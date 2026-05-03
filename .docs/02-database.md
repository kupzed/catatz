# Database Schema & Migrations

## Urutan Migrasi (WAJIB berurutan)

```
001 → 002 → 003 → 004 → 005 → 006 → 007
```

---

## Tabel: `profiles`
*File: `src/migrations/001-profiles.sql`*

Meng-extend `auth.users` Supabase dengan data profil aplikasi.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | Foreign key ke `auth.users` |
| `name` | TEXT | Nama tampilan pengguna |
| `avatar_url` | TEXT | URL foto profil |
| `currency` | TEXT | Default `'IDR'` |
| `locale` | TEXT | Default `'id-ID'` |

**Trigger**: `on_auth_user_created` — otomatis membuat baris `profiles` saat user baru register.

---

## Tabel: `rekening`
*File: `src/migrations/002-rekening.sql`*

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | → `profiles.id` |
| `nama` | TEXT | Nama rekening, e.g. "BCA Utama" |
| `jenis` | ENUM | `Tunai`, `Bank`, `E-Wallet`, `Investasi` |
| `saldo_awal` | NUMERIC(15,2) | Saldo saat rekening dibuat |
| `saldo_saat_ini` | NUMERIC(15,2) | **Auto-update** oleh trigger transaksi |
| `warna` | TEXT | Hex color, default `#6366f1` |
| `logo` | TEXT | Slug bank, e.g. `bca`, `gopay` |
| `exclude_total` | BOOLEAN | Kecualikan dari total saldo dashboard |
| `urutan` | INT | Urutan tampil |

> ✅ `saldo_saat_ini` **tidak perlu diupdate manual** — trigger PostgreSQL mengurusnya otomatis.

---

## Tabel: `kategori`
*File: `src/migrations/003-kategori.sql`*

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | NULL = kategori sistem (global) |
| `nama` | TEXT | |
| `ikon` | TEXT | Emoji icon |
| `warna` | TEXT | Hex color |
| `tipe` | TEXT | `income`, `expense`, atau `all` |
| `is_system` | BOOLEAN | TRUE = tidak bisa dihapus user |

**Seed data**: 6 kategori income + 12 kategori expense sudah diisi otomatis.

**RLS**: User bisa lihat semua kategori sistem + kategori miliknya sendiri.

---

## Tabel: `transaksi`
*File: `src/migrations/004-transaksi.sql`*

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | → `profiles.id` |
| `tipe` | ENUM | `income`, `expense`, `transfer` |
| `nominal` | NUMERIC(15,2) | Nilai transaksi, selalu positif |
| `tanggal` | DATE | |
| `kategori_id` | UUID FK | → `kategori.id`, nullable |
| `rekening_id` | UUID FK | Rekening sumber |
| `rekening_tujuan` | UUID FK | Hanya untuk tipe `transfer` |
| `catatan` | TEXT | Deskripsi bebas |
| `tags` | TEXT[] | Array tag |
| `is_recurring` | BOOLEAN | Dari transaksi berulang? |
| `recurring_id` | UUID | Link ke `recurring_transaksi` |

**Constraint**: Transfer wajib punya `rekening_tujuan`, non-transfer tidak boleh.

**Trigger**: `trg_transaksi_saldo` — update `saldo_saat_ini` rekening secara otomatis untuk INSERT/UPDATE/DELETE.

*Contoh logika trigger:*
- `income` INSERT → `saldo += nominal`
- `expense` INSERT → `saldo -= nominal`
- `transfer` INSERT → rekening asal `-= nominal`, rekening tujuan `+= nominal`
- UPDATE → reverse dulu transaksi lama, lalu apply transaksi baru

---

## Tabel: `hutang` & `hutang_cicilan`
*File: `src/migrations/005-hutang.sql`*

**`hutang`**:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `tipe` | ENUM | `memberi` (piutang) atau `menerima` (hutang) |
| `nama_entitas` | TEXT | Nama orang/lembaga |
| `total_pinjaman` | NUMERIC | Jumlah awal |
| `sisa_tagihan` | NUMERIC | **Auto-update** oleh trigger cicilan |
| `status` | ENUM | `aktif`, `lunas`, `overdue` |
| `tanggal_jatuh_tempo` | DATE | Opsional |

**`hutang_cicilan`**:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `hutang_id` | UUID FK | → `hutang.id` CASCADE |
| `nominal` | NUMERIC | Jumlah cicilan |
| `tanggal` | DATE | |

**Trigger**: `trg_update_sisa_hutang` — saat cicilan ditambah/hapus, `sisa_tagihan` dan `status` hutang diperbarui otomatis. Jika `sisa <= 0` maka `status = 'lunas'`.

---

## Tabel: `budget`
*File: `src/migrations/006-budget.sql`*

| Kolom | Tipe | Keterangan |
|---|---|---|
| `user_id` | UUID FK | |
| `kategori_id` | UUID FK | |
| `bulan` | INT | 1–12 |
| `tahun` | INT | |
| `limit_nominal` | NUMERIC | Batas pengeluaran |

**Unique constraint**: `(user_id, kategori_id, bulan, tahun)` — satu budget per kategori per bulan.

---

## Row Level Security (RLS)

**Semua tabel** menggunakan RLS. Setiap tabel punya 4 policy:

```sql
-- Contoh pola yang sama di semua tabel
CREATE POLICY "xxx: select own" ON public.xxx
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "xxx: insert own" ON public.xxx
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "xxx: update own" ON public.xxx
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "xxx: delete own" ON public.xxx
  FOR DELETE USING (auth.uid() = user_id);
```

Ini memastikan **user tidak bisa mengakses data user lain**, meskipun menggunakan Supabase anon key yang sama.

---

## Index untuk Performa

```sql
-- Transaksi: query by user + sort by date (paling sering dipakai)
CREATE INDEX idx_transaksi_user_tanggal ON transaksi(user_id, tanggal DESC);
CREATE INDEX idx_transaksi_rekening    ON transaksi(rekening_id);
CREATE INDEX idx_transaksi_kategori    ON transaksi(kategori_id);

-- Hutang: query by user + filter status
CREATE INDEX idx_hutang_user ON hutang(user_id, status);
CREATE INDEX idx_cicilan_hutang ON hutang_cicilan(hutang_id);
```
