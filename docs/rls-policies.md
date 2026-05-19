# RLS Policies

## Prinsip RLS Project

- Semua table user-owned di schema `public` mengaktifkan RLS.
- Akses data privat umumnya dibatasi dengan `auth.uid() = user_id`.
- `profiles` memakai `auth.uid() = id`.
- `kategori` memperbolehkan read kategori system dan kategori milik user.
- `hutang_cicilan` mengandalkan parent `hutang` untuk validasi kepemilikan.
- Storage `avatars` memperbolehkan read public, tetapi write dibatasi ke folder user sendiri.

## Tabel `profiles`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `profiles: select own` | `auth.uid() = id` | User hanya bisa membaca profil sendiri. |
| UPDATE | `profiles: update own` | `auth.uid() = id` | User hanya bisa memperbarui profil sendiri. |

Catatan: Tidak ada policy INSERT untuk user biasa karena profile dibuat oleh trigger `handle_new_user`.

## Tabel `rekening`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `rekening: select own` | `auth.uid() = user_id` | User hanya membaca rekening sendiri. |
| INSERT | `rekening: insert own` | `WITH CHECK auth.uid() = user_id` | User hanya membuat rekening untuk diri sendiri. |
| UPDATE | `rekening: update own` | `auth.uid() = user_id` | User hanya mengubah rekening sendiri. |
| DELETE | `rekening: delete own` | `auth.uid() = user_id` | User hanya menghapus rekening sendiri. |

## Tabel `kategori`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `kategori: select own and system` | `is_system = TRUE OR auth.uid() = user_id` | User membaca kategori system dan kategori miliknya. |
| INSERT | `kategori: insert own` | `WITH CHECK auth.uid() = user_id AND is_system = FALSE` | User hanya membuat kategori custom sendiri. |
| UPDATE | `kategori: update own` | `auth.uid() = user_id AND is_system = FALSE` | User hanya mengubah kategori custom sendiri. |
| DELETE | `kategori: delete own` | `auth.uid() = user_id AND is_system = FALSE` | User hanya menghapus kategori custom sendiri. |

## Tabel `transaksi`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `transaksi: select own` | `auth.uid() = user_id` | User hanya membaca transaksi sendiri. |
| INSERT | `transaksi: insert own` | `WITH CHECK auth.uid() = user_id` | User hanya membuat transaksi untuk diri sendiri. |
| UPDATE | `transaksi: update own` | `auth.uid() = user_id` | User hanya mengubah transaksi sendiri. |
| DELETE | `transaksi: delete own` | `auth.uid() = user_id` | User hanya menghapus transaksi sendiri. |

## Tabel `hutang`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `hutang: select own` | `auth.uid() = user_id` | User hanya membaca hutang/piutang sendiri. |
| INSERT | `hutang: insert own` | `WITH CHECK auth.uid() = user_id` | User hanya membuat hutang/piutang untuk diri sendiri. |
| UPDATE | `hutang: update own` | `auth.uid() = user_id` | User hanya mengubah hutang/piutang sendiri. |
| DELETE | `hutang: delete own` | `auth.uid() = user_id` | User hanya menghapus hutang/piutang sendiri. |

## Tabel `hutang_cicilan`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `cicilan: select own` | `EXISTS hutang where h.id = hutang_id AND h.user_id = auth.uid()` | User membaca cicilan dari hutang miliknya. |
| INSERT | `cicilan: insert own` | `WITH CHECK EXISTS hutang where h.id = hutang_id AND h.user_id = auth.uid()` | User hanya membuat cicilan untuk hutang miliknya. |
| UPDATE | `cicilan: update own` | `USING` dan `WITH CHECK` via parent `hutang.user_id = auth.uid()` | User hanya mengubah cicilan dari hutang miliknya. |
| DELETE | `cicilan: delete own` | `EXISTS hutang where h.id = hutang_id AND h.user_id = auth.uid()` | User hanya menghapus cicilan dari hutang miliknya. |

Catatan: Policy UPDATE ditambahkan oleh `011-hutang-cicilan-balance-safety.sql` untuk mendukung edit cicilan dari UI Detail.

## Tabel `budget`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `budget: select own` | `auth.uid() = user_id` | User hanya membaca budget sendiri. |
| INSERT | `budget: insert own` | `WITH CHECK auth.uid() = user_id` | User hanya membuat budget untuk diri sendiri. |
| UPDATE | `budget: update own` | `auth.uid() = user_id` | User hanya mengubah budget sendiri. |
| DELETE | `budget: delete own` | `auth.uid() = user_id` | User hanya menghapus budget sendiri. |

## Tabel `recurring_transaksi`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `recurring: select own` | `auth.uid() = user_id` | User hanya membaca recurring transaction sendiri. |
| INSERT | `recurring: insert own` | `WITH CHECK auth.uid() = user_id` | User hanya membuat recurring transaction untuk diri sendiri. |
| UPDATE | `recurring: update own` | `auth.uid() = user_id` | User hanya mengubah recurring transaction sendiri. |
| DELETE | `recurring: delete own` | `auth.uid() = user_id` | User hanya menghapus recurring transaction sendiri. |

## Storage Bucket `avatars`

| Action | Policy Name | Rule | Description |
|---|---|---|---|
| SELECT | `avatars: read all` | `bucket_id = 'avatars'` | Object avatar dapat dibaca publik. |
| INSERT | `avatars: upload own` | `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]` | User hanya upload ke folder user sendiri. |
| UPDATE | `avatars: update own` | `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]` | User hanya update object di folder sendiri. |
| DELETE | `avatars: delete own` | `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]` | User hanya delete object di folder sendiri. |

## Grant API

Grant API didefinisikan di masing-masing migration table dalam `src/migrations`:

- Table user-owned memberi akses sesuai kebutuhan ke role `authenticated`.
- `kategori` memberi `SELECT` kepada `anon` agar kategori system bisa dibaca.
- Storage `avatars` memakai policy storage khusus di migration `008-avatars-storage.sql`.

Grant bukan pengganti RLS. Grant membuka akses API pada level table/schema, RLS tetap membatasi row.

## Security Notes

- Function `handle_new_user` dan `update_saldo_rekening` dibuat sebagai `SECURITY DEFINER` di schema `public`. Function hutang/cicilan terbaru dari migration 011 memakai `SECURITY INVOKER` dan fully qualified object names agar tetap mengikuti RLS user yang sedang login.
- `avatars` bersifat public read. Jangan simpan gambar yang bersifat rahasia di bucket ini.
- Pastikan semua perubahan table baru selalu mengaktifkan RLS sebelum diberi grant API.

## RLS Checklist

- [ ] Semua tabel user-owned sudah mengaktifkan RLS.
- [ ] Policy INSERT menggunakan `WITH CHECK`.
- [ ] Tidak ada policy berbahaya seperti `USING (true)` untuk data privat.
- [ ] Table yang diberi `GRANT` tetap memiliki RLS yang sesuai.
- [ ] Service role key tidak digunakan di client.
- [ ] Storage bucket privat tidak diberi policy read public tanpa alasan.
- [ ] Function `SECURITY DEFINER` direview sebelum production.
- [ ] Policy UPDATE memiliki SELECT policy yang sesuai agar update tidak silent fail.
