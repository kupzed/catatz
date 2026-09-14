# Feature: Kategori

## Status

Status: Aktif.

## Deskripsi

Fitur kategori digunakan untuk mengelola kategori transaksi. Project membedakan kategori system dan kategori custom user.

## Route

- `/categories`

## Lokasi File

- Page: `src/app/(dashboard)/categories/page.tsx`
- Client page: `src/app/(dashboard)/categories/_components/kategori-page-client.tsx`
- Dialog: `src/app/(dashboard)/categories/_components/kategori-dialog.tsx`
- Actions: `src/actions/kategori-action.ts`
- Validation: `src/validations/kategori-validation.ts`
- Types: `src/types/transaksi.d.ts`

## Data Source

Initial data diambil dengan `getKategori()`.

## Tabel Database Terkait

- `kategori`
- `transaksi` menggunakan `kategori_id`

## Server Action Terkait

- `getKategori`
- `createKategori`
- `updateKategori`
- `deleteKategori`

## Business Rules

- Kategori system memiliki `is_system = true` dan `user_id = null`.
- User bisa membaca kategori system dan kategori miliknya.
- User hanya bisa membuat, mengubah, dan menghapus kategori custom miliknya.
- Server Action update/delete menambahkan filter `user_id = user.id` dan `is_system = false`.
- Tipe kategori harus `income`, `expense`, atau `all`.
- Warna wajib format hex.

## UI Behavior

- Halaman memisahkan kategori custom dan kategori system.
- Kategori system tampil read-only.
- User dapat search kategori dan filter berdasarkan tipe kategori.
- Saat filter Pemasukan atau Pengeluaran, kategori bertipe `all` tetap ikut tampil karena dapat digunakan untuk kedua tipe transaksi.
- Search dan filter ditampilkan sebagai filter bar responsif.
- Dialog kategori memakai Zod schema `kategoriSchema`.
- Delete kategori menggunakan confirm dialog.

## TODO / Improvement

- Jika kategori dipakai banyak transaksi, pertimbangkan warning dampak sebelum delete.
