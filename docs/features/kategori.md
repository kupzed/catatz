# Feature: Kategori

## Status

Status: **Production (Aktif)**.

## Deskripsi

Fitur kategori digunakan untuk mengelola kategori pemasukan dan pengeluaran transaksi finansial. Seluruh kategori bersifat **user-owned (milik masing-masing pengguna)** dengan seeded default categories saat registrasi, sehingga pengguna bebas mengedit atau menghapus kategori apa pun yang tidak diinginkan.

## Route

- `/categories` - Daftar kategori (grid card & ringkasan)
- `/categories/[id]` - Detail kategori & histori transaksi

## Lokasi File

- Index Page: `src/app/(dashboard)/categories/page.tsx`
- Index Client: `src/app/(dashboard)/categories/_components/kategori-page-client.tsx`
- Dialog: `src/app/(dashboard)/categories/_components/kategori-dialog.tsx`
- Detail Page: `src/app/(dashboard)/categories/[id]/page.tsx`
- Detail Loading: `src/app/(dashboard)/categories/[id]/loading.tsx`
- Detail Client: `src/app/(dashboard)/categories/[id]/_components/kategori-detail-client.tsx`
- Detail Stat Cards: `src/app/(dashboard)/categories/[id]/_components/kategori-stat-cards.tsx`
- Actions: `src/actions/kategori-action.ts`
- Validation: `src/validations/kategori-validation.ts`
- Types: `src/types/transaksi.d.ts`
- Migration: `src/migrations/016-user-owned-categories.sql`

## Data Source

- Index: `getKategori()` dan `getKategoriUsageCountsMap()`.
- Detail: `getKategoriById(id)` dan `getTransaksi({ kategori_id: [id] })`.

## Tabel Database Terkait

- `kategori`
- `transaksi` (`kategori_id`)
- `budget` (`kategori_id`)
- `recurring_transaksi` (`kategori_id`)

## Server Action Terkait

- `getKategori()`: Mengambil seluruh kategori milik user yang aktif.
- `getKategoriById(id)`: Mengambil data 1 kategori beserta detail `KategoriUsageCounts`.
- `getKategoriUsageCountsMap()`: Mengambil ringkasan jumlah pemakaian data keuangan seluruh kategori.
- `createKategori(values)`: Membuat kategori baru.
- `updateKategori(id, values)`: Mengubah informasi kategori (dengan proteksi perubahan tipe jika ada histori transaksi).
- `deleteKategori(id)`: Menghapus kategori (dilindungi pengecekan integritas data transaksi, budget, dan transaksi berulang).

## Business Rules

- Semua kategori 100% milik user (`user_id = auth.uid()`).
- Saat user baru mendaftar, trigger `handle_new_user()` otomatis men-seed 6 kategori awal default.
- Pengguna berhak mengubah nama, ikon, warna, tipe, atau menghapus kategori awal tersebut.
- Proteksi integritas finansial: Kategori tidak dapat dihapus jika masih digunakan oleh transaksi, alokasi budget, atau template transaksi berulang. Pengguna wajib memindahkan atau menghapus data terkait terlebih dahulu.
- Tipe kategori harus `income`, `expense`, atau `all`.
- Warna wajib berupa format hex (`#rrggbb`).

## UI Behavior

- **Index `/categories`**:
  - Hero card ringkasan total kategori aktif dan breakdown tipe (Pengeluaran, Pemasukan, Semua Tipe).
  - Filter bar responsif: input pencarian dengan clear button + pill filter tipe (Semua, Pengeluaran, Pemasukan).
  - Grid card modern seragam dengan halaman Rekening (`/wallets`), beraksen border atas sesuai warna kategori.
  - Kartu menampilkan ikon plate transparan, nama, tipe badge, dan badge penggunaan "Dipakai X data".
  - Klik pada kartu kategori bernavigasi langsung ke `/categories/[id]`.
  - Tombol edit membuka dialog, sedangkan tombol hapus memunculkan dialog konfirmasi atau toast warning jika masih memiliki keterkaitan data keuangan.
- **Detail `/categories/[id]`**:
  - Tombol kembali ke `/categories`.
  - Header interaktif: ikon, nama kategori, tipe badge, tombol Edit Kategori, tombol Hapus, dan CTA Tambah Transaksi (otomatis memilih kategori ini).
  - Tombol aksi pada mobile tersusun seimbang (grid 2 kolom pill 50/50 untuk Edit Kategori & Hapus, baris kedua full-width pill untuk Tambah Transaksi).
  - Kartu aksen ringkasan kategori dengan kode warna hex.
  - 3 kartu statistik metrik finansial: Total nominal (pengeluaran/pemasukan/net flow), frekuensi transaksi, dan rata-rata per transaksi, dilengkapi badge rincian pemakaian data.
  - Kontrol periode & navigasi tanggal identik dengan Detail Rekening dan Index Transaksi (`Semua Waktu`, `Bulan Ini`, `Minggu Ini`, `Hari Ini`, `Tahun Ini`, `Custom`) dengan kapsul tanggal interaktif.
  - Tab tipe transaksi horizontal scrollable jika kategori bertipe `all`, serta pencarian transaksi instan.
  - Daftar histori transaksi dengan pagination dan detail sheet.
  - Breadcrumb dinamis terintegrasi (`Kategori > [Nama Kategori]`).
