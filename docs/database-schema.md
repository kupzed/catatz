# Database Schema

Sumber schema: file SQL di `src/migrations`. Repository tidak memiliki folder `supabase/`; migration berada di dalam source app.

## Custom Types

| Type | Values | Digunakan oleh |
|---|---|---|
| `jenis_rekening` | `Tunai`, `Bank`, `E-Wallet`, `Investasi` | `rekening.jenis` |
| `tipe_transaksi` | `income`, `expense`, `transfer`, `correction` | `transaksi.tipe`, `recurring_transaksi.tipe` |
| `tipe_hutang` | `memberi`, `menerima` | `hutang.tipe` |
| `status_hutang` | `aktif`, `lunas`, `overdue` | `hutang.status` |
| `interval_recurring` | `harian`, `mingguan`, `bulanan`, `tahunan` | `recurring_transaksi.interval_type` |

## Tabel `profiles`

Deskripsi: data profil aplikasi yang memperluas `auth.users`.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | - | Primary key, FK ke `auth.users(id)` dengan `ON DELETE CASCADE`. |
| `name` | `text` | Yes | - | Nama tampilan user. |
| `avatar_url` | `text` | Yes | - | URL avatar user. |
| `currency` | `text` | Yes | `'IDR'` | Preferensi mata uang. |
| `locale` | `text` | Yes | `'id-ID'` | Preferensi locale. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah. |

Trigger/function:

- `public.handle_new_user()` membuat row profile setelah insert ke `auth.users`.
- Trigger `on_auth_user_created` berjalan `AFTER INSERT ON auth.users`.

## Tabel `rekening`

Deskripsi: rekening, dompet, bank, e-wallet, atau akun investasi user.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | No | - | FK ke `profiles(id)`. |
| `nama` | `text` | No | - | Nama rekening. |
| `jenis` | `jenis_rekening` | No | `'Bank'` | Jenis rekening. |
| `saldo_awal` | `numeric(15,2)` | No | `0` | Saldo awal saat rekening dibuat. |
| `saldo_saat_ini` | `numeric(15,2)` | No | `0` | Saldo berjalan. Dipengaruhi transaksi dan hutang/cicilan. |
| `warna` | `text` | No | `'#6366f1'` | Warna visual rekening. |
| `logo` | `text` | Yes | - | Slug logo bank/e-wallet. |
| `exclude_total` | `boolean` | No | `false` | Jika true, rekening tidak dihitung di total ringkasan. |
| `urutan` | `int` | Yes | `0` | Urutan tampilan. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah. |

Trigger/function:

- `public.prevent_rekening_delete_when_referenced()` menolak delete rekening yang masih direferensikan oleh `transaksi`, `hutang`, `hutang_cicilan`, atau `recurring_transaksi`.
- Trigger `trg_prevent_rekening_delete_when_referenced` berjalan sebelum delete pada `rekening`.

## Tabel `kategori`

Deskripsi: kategori transaksi. Kategori system memiliki `user_id = NULL` dan `is_system = TRUE`; kategori custom dimiliki user.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | Yes | - | FK ke `profiles(id)`. Null untuk kategori system. |
| `nama` | `text` | No | - | Nama kategori. |
| `ikon` | `text` | No | Emoji/default icon | Ikon kategori. |
| `warna` | `text` | No | `'#6366f1'` | Warna kategori. |
| `tipe` | `text` | No | `'all'` | Check: `income`, `expense`, atau `all`. |
| `is_system` | `boolean` | No | `false` | Menandai kategori bawaan system. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah. |

Seed system category ada di migration `003-kategori.sql`: `Gaji`, `Bonus`, `Makan & Minum`, `Transportasi`, `Kesehatan`, dan `Lainnya`.

## Tabel `transaksi`

Deskripsi: catatan transaksi keuangan user.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | No | - | FK ke `profiles(id)`. |
| `tipe` | `tipe_transaksi` | No | - | `income`, `expense`, `transfer`, atau `correction`. |
| `nominal` | `numeric(15,2)` | No | - | Harus lebih dari 0. |
| `tanggal` | `date` | No | `current_date` | Tanggal transaksi. |
| `waktu` | `time` | Yes | `current_time` | Waktu transaksi. |
| `judul` | `text` | Yes | - | Judul transaksi untuk income/expense. |
| `kategori_id` | `uuid` | Yes | - | FK ke `kategori(id)`, `ON DELETE SET NULL`. |
| `rekening_id` | `uuid` | Yes | - | FK ke `rekening(id)`, rekening asal/utama. |
| `rekening_tujuan` | `uuid` | Yes | - | FK ke `rekening(id)`, wajib untuk transfer. |
| `catatan` | `text` | Yes | - | Catatan tambahan. |
| `tags` | `text[]` | Yes | `'{}'` | Tag internal, termasuk `correction_add`/`correction_sub`. |
| `is_recurring` | `boolean` | No | `false` | Penanda transaksi recurring. |
| `recurring_id` | `uuid` | Yes | - | Referensi logical ke recurring flow. Tidak ada FK eksplisit di migration. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah. |

Constraints:

- `nominal > 0`.
- `chk_transfer`: transfer wajib memiliki `rekening_tujuan`, non-transfer tidak boleh memiliki `rekening_tujuan`.
- `chk_correction_judul`: transaksi `correction` tidak boleh memiliki `judul`.

Indexes:

- `idx_transaksi_user_tanggal` pada `(user_id, tanggal DESC)`.
- `idx_transaksi_rekening` pada `rekening_id`.
- `idx_transaksi_kategori` pada `kategori_id`.
- `idx_transaksi_judul` pada `(user_id, judul)` jika `judul IS NOT NULL`.

Trigger/function:

- `public.update_saldo_rekening()`.
- Trigger `trg_transaksi_saldo` berjalan setelah insert/update/delete.
- Trigger memproses `income`, `expense`, dan `transfer`.
- `correction` tidak diproses trigger; action layer mengubah saldo rekening secara manual.

## Tabel `hutang`

Deskripsi: catatan hutang/piutang utama.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | No | - | FK ke `profiles(id)`. |
| `tipe` | `tipe_hutang` | No | - | `memberi` atau `menerima`. |
| `tanggal_mulai` | `date` | No | `current_date` | Tanggal awal hutang/piutang. |
| `waktu` | `time` | Yes | `current_time` | Waktu pencatatan. |
| `tanggal_jatuh_tempo` | `date` | Yes | - | Tanggal jatuh tempo opsional. |
| `status` | `status_hutang` | No | `'aktif'` | Status catatan. |
| `nama_entitas` | `text` | No | - | Nama pihak terkait. |
| `rekening_id` | `uuid` | Yes | - | FK ke `rekening(id)`, `ON DELETE SET NULL`. |
| `total_pinjaman` | `numeric(15,2)` | No | - | Total pinjaman, harus lebih dari 0. |
| `sisa_tagihan` | `numeric(15,2)` | No | - | Sisa yang belum dibayar. |
| `catatan` | `text` | Yes | - | Catatan tambahan. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah. |

Indexes:

- `idx_hutang_user` pada `(user_id, status)`.

Trigger/function:

- `public.update_saldo_rekening_hutang()` mengubah saldo rekening ketika hutang/piutang dibuat, diubah, diubah tipe/rekening/nominalnya, atau dihapus.
- Trigger `trg_rekening_hutang`.

## Tabel `hutang_cicilan`

Deskripsi: pembayaran cicilan untuk row `hutang`.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `hutang_id` | `uuid` | No | - | FK ke `hutang(id)`, `ON DELETE CASCADE`. |
| `nominal` | `numeric(15,2)` | No | - | Nominal cicilan, harus lebih dari 0. |
| `tanggal` | `date` | No | `current_date` | Tanggal cicilan. |
| `waktu` | `time` | Yes | `current_time` | Waktu cicilan. |
| `rekening_id` | `uuid` | Yes | - | FK ke `rekening(id)`, `ON DELETE SET NULL`. |
| `tipe_hutang_snapshot` | `tipe_hutang` | No | Diisi trigger | Snapshot `hutang.tipe` saat cicilan dibuat agar rollback saldo saat cascade delete tetap memakai arah saldo yang benar. |
| `catatan` | `text` | Yes | - | Catatan cicilan. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |

Indexes:

- `idx_cicilan_hutang` pada `hutang_id`.

Trigger/function:

- `public.set_hutang_cicilan_tipe_snapshot()` mengisi snapshot tipe hutang pada cicilan.
- `public.update_sisa_hutang()` menghitung ulang `sisa_tagihan` dan status `lunas`/`aktif` saat cicilan dibuat, diubah nominalnya, atau dihapus.
- `public.update_saldo_rekening_cicilan()` mengubah saldo rekening ketika cicilan dibuat, diubah nominal/rekeningnya, atau dihapus.
- Trigger `trg_set_cicilan_tipe_snapshot`.
- Trigger `trg_update_sisa_hutang`.
- Trigger `trg_rekening_cicilan`.

Catatan: RLS cicilan mengacu ke parent `hutang`, bukan `user_id` langsung.

## Tabel `budget`

Deskripsi: limit budget per kategori, bulan, dan tahun.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | No | - | FK ke `profiles(id)`. |
| `kategori_id` | `uuid` | No | - | FK ke `kategori(id)`. |
| `bulan` | `smallint` | No | - | 1 sampai 12. |
| `tahun` | `smallint` | No | - | Tahun budget. |
| `limit_nominal` | `numeric(15,2)` | No | - | Limit budget, harus lebih dari 0. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah. |

Constraints/index:

- Unique `(user_id, kategori_id, bulan, tahun)`.
- `idx_budget_user_period` pada `(user_id, tahun, bulan)`.

Catatan: action `upsertBudget` tersedia, tetapi UI create/edit budget belum terlihat di route saat ini.

## Tabel `recurring_transaksi`

Deskripsi: template transaksi berulang.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | No | - | FK ke `profiles(id)`. |
| `tipe` | `tipe_transaksi` | No | - | Tipe transaksi template. |
| `nominal` | `numeric(15,2)` | No | - | Nominal template. |
| `kategori_id` | `uuid` | Yes | - | FK ke `kategori(id)`. |
| `rekening_id` | `uuid` | Yes | - | FK ke `rekening(id)`. |
| `rekening_tujuan` | `uuid` | Yes | - | FK ke `rekening(id)`. |
| `catatan` | `text` | Yes | - | Catatan template. |
| `tags` | `text[]` | Yes | `'{}'` | Tags template. |
| `interval_type` | `interval_recurring` | No | `'bulanan'` | Interval recurring. |
| `next_run` | `date` | No | - | Jadwal berikutnya. |
| `is_active` | `boolean` | No | `true` | Status aktif template. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah. |

Catatan: table sudah ada di migration, tetapi belum terlihat ada UI/Server Action khusus recurring transaction.

## Tabel `user_preferences`

Deskripsi: preferensi tampilan dan format data milik user.

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | No | - | FK ke `profiles(id)` dengan `ON DELETE CASCADE`, unique per user. |
| `theme` | `text` | Yes | `'system'` | Theme `light`, `dark`, atau `system`. |
| `currency` | `text` | Yes | `'IDR'` | Mata uang tampilan. UI saat ini hanya menyediakan IDR. |
| `date_format` | `text` | Yes | `'id-ID'` | Locale/tampilan tanggal aplikasi dan export. |
| `number_format` | `text` | Yes | `'id-ID'` | Locale pemisah ribuan/desimal angka. |
| `default_landing_page` | `text` | Yes | `'/transaksi'` | Route awal setelah login. |
| `show_decimal_places` | `boolean` | No | `false` | Jika true, nominal penuh tampil dengan 2 digit desimal. |
| `time_format` | `text` | No | `'24h'` | Format waktu tampilan/input, `24h` atau `12h`. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu dibuat. |
| `updated_at` | `timestamptz` | Yes | `now()` | Waktu terakhir diubah dari application layer. |

Constraints/index:

- Unique `user_id`.
- Check `chk_user_preferences_time_format`: `time_format IN ('24h', '12h')`.
- Index `idx_user_preferences_user_id` pada `user_id`.

## Tabel `user_sessions`

Deskripsi: mencatat perangkat dan sesi pengguna yang aktif untuk fitur Keamanan (Active Sessions).

| Column | Type | Nullable | Default | Description |
|---|---|---:|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | No | - | FK ke `profiles(id)`. |
| `auth_session_id` | `text` | Yes | - | ID session auth Supabase. |
| `device_id` | `text` | Yes | - | ID device dari cookie. |
| `device_name` | `text` | Yes | - | Nama perangkat. |
| `browser` | `text` | Yes | - | Browser yang digunakan. |
| `os` | `text` | Yes | - | OS yang digunakan. |
| `ip_address` | `text` | Yes | - | Alamat IP pengguna. |
| `location` | `text` | Yes | - | Lokasi geografis (default null). |
| `user_agent` | `text` | Yes | - | Header user-agent. |
| `last_active_at` | `timestamptz` | Yes | `now()` | Waktu terakhir aktif. |
| `created_at` | `timestamptz` | Yes | `now()` | Waktu login/dibuat. |
| `revoked_at` | `timestamptz` | Yes | - | Waktu sesi diakhiri. |

Indexes:

- `idx_user_sessions_user_id` pada `user_id`.
- `idx_user_sessions_device_id` pada `device_id`.
- `idx_user_sessions_revoked_at` pada `revoked_at`.
- `idx_user_sessions_last_active_at` pada `last_active_at DESC`.

## Storage Bucket `avatars`

Migration `008-avatars-storage.sql` membuat bucket:

| Bucket | Public | Description |
|---|---:|---|
| `avatars` | Yes | Menyimpan avatar user di path `{user.id}/avatar.{ext}`. |

Policy storage:

- Insert/update/delete hanya untuk folder milik user: `auth.uid()::text = (storage.foldername(name))[1]`.
- Select terbuka untuk semua object di bucket `avatars`.

## Relasi Database

- `profiles.id` -> `auth.users.id`.
- `rekening.user_id` -> `profiles.id`.
- `kategori.user_id` -> `profiles.id`.
- `transaksi.user_id` -> `profiles.id`.
- `transaksi.kategori_id` -> `kategori.id`.
- `transaksi.rekening_id` -> `rekening.id`.
- `transaksi.rekening_tujuan` -> `rekening.id`.
- `hutang.user_id` -> `profiles.id`.
- `hutang.rekening_id` -> `rekening.id`.
- `hutang_cicilan.hutang_id` -> `hutang.id`.
- `hutang_cicilan.rekening_id` -> `rekening.id`.
- `budget.user_id` -> `profiles.id`.
- `budget.kategori_id` -> `kategori.id`.
- `recurring_transaksi.user_id` -> `profiles.id`.
- `recurring_transaksi.kategori_id` -> `kategori.id`.
- `recurring_transaksi.rekening_id` -> `rekening.id`.
- `recurring_transaksi.rekening_tujuan` -> `rekening.id`.
- `user_preferences.user_id` -> `profiles.id`.
- `user_sessions.user_id` -> `profiles.id`.

## Business Rule Database

- Data privat user dibatasi dengan RLS.
- Insert transaksi income menambah saldo rekening asal.
- Insert transaksi expense mengurangi saldo rekening asal.
- Insert transaksi transfer mengurangi saldo rekening asal dan menambah rekening tujuan.
- Delete/update transaksi membalik saldo lama lalu menerapkan saldo baru.
- Transaksi correction sengaja dilewati trigger database dan diproses manual di Server Action.
- Membuat, mengubah rekening/nominal/tipe, atau menghapus hutang/piutang dapat mengubah saldo rekening berdasarkan `tipe`.
- Membuat, mengubah, atau menghapus cicilan mengubah sisa tagihan, status hutang/piutang, dan saldo rekening.
- Menghapus parent hutang/piutang dengan cicilan memakai snapshot tipe cicilan agar saldo utama dan saldo cicilan tidak rollback dua kali atau tertinggal.
- Menghapus rekening yang masih direferensikan data keuangan ditolak oleh trigger database agar histori tidak kehilangan referensi rekening.
- Kategori system tidak boleh diubah/dihapus user melalui RLS dan Server Action.
