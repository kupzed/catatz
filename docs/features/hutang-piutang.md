# Feature: Hutang/Piutang

## Status

Status: **Production (Aktif)**.

## Deskripsi

Fitur hutang/piutang digunakan untuk mencatat dan mengelola hubungan pinjaman masuk (hutang) dan pinjaman keluar (piutang) dengan berbagai pihak. Sistem ini menggunakan arsitektur dua level:
1. **Halaman Index (`/debts`)**: Direktori daftar pihak/kontak. Menambah pihak baru hanya memerlukan input **Nama** dan **Catatan**.
2. **Halaman Detail (`/debts/[id]`)**: Ruang kerja komprehensif untuk mencatat riwayat transaksi pinjaman dan pembayaran/cicilan, mengelola status lunas, dan melihat ringkasan keuangan pihak terkait.

Sistem mendukung fleksibilitas nominal pengembalian (termasuk jika pembayaran melebihi pinjaman pokok) dan memisahkan fungsi status Lunas sebagai label/tag visual dari perhitungan nominal saldo riil.

## Route

- `/debts` — Halaman index daftar pihak hutang & piutang.
- `/debts/[id]` — Halaman detail transaksi per pihak.

## Lokasi File

- Index Page: `src/app/(dashboard)/debts/page.tsx`
- Index Client: `src/app/(dashboard)/debts/_components/hutang-page-client.tsx`
- Index Card: `src/app/(dashboard)/debts/_components/hutang-card.tsx`
- Contact Add/Edit Dialog: `src/app/(dashboard)/debts/_components/hutang-dialog.tsx`
- Detail Page: `src/app/(dashboard)/debts/[id]/page.tsx`
- Detail Loading: `src/app/(dashboard)/debts/[id]/loading.tsx`
- Detail Client: `src/app/(dashboard)/debts/[id]/_components/hutang-detail-client.tsx`
- Detail Transaction Dialog: `src/app/(dashboard)/debts/[id]/_components/hutang-transaction-dialog.tsx`
- Detail Transaction List: `src/app/(dashboard)/debts/[id]/_components/hutang-transaction-list.tsx`
- Detail Contact Edit Dialog: `src/app/(dashboard)/debts/[id]/_components/hutang-contact-edit-dialog.tsx`
- Actions: `src/actions/hutang-action.ts`
- Validation: `src/validations/hutang-validation.ts`
- Types: `src/types/hutang.d.ts`
- Migration: `src/migrations/015-hutang-piutang-revamp.sql`

## Data Source

Initial data diambil dengan:
- `getHutang()` (pada index)
- `getHutangDetail(id)` (pada halaman detail)
- `getRekening()`

## Tabel Database Terkait

- `public.hutang`
- `public.hutang_cicilan`
- `public.rekening`

## Server Action Terkait

- `getHutang`: Mengambil seluruh daftar pihak hutang & piutang.
- `getHutangDetail`: Mengambil detail satu pihak beserta seluruh riwayat transaksinya.
- `createHutangContact`: Membuat kontak pihak baru dengan Nama dan Catatan (total pinjaman awal 0).
- `updateHutangContact`: Memperbarui nama atau catatan pihak.
- `toggleHutangStatus`: Menandai status Lunas / Belum Lunas sebagai label tag manual.
- `updateHutangTipe`: Mengubah tipe hubungan (`memberi` / `menerima`) sebelum ada riwayat transaksi.
- `createHutangTransaction`: Mencatat transaksi pinjaman baru atau pembayaran/cicilan baru.
- `createCicilan`: Kompatibilitas pencatatan cicilan/pembayaran.
- `updateCicilan`: Mengedit transaksi yang sudah tercatat.
- `deleteCicilan`: Menghapus transaksi dan otomatis mengembalikan saldo rekening terkait.
- `deleteHutang`: Menghapus pihak beserta seluruh riwayat transaksi dan mengembalikan saldo rekening.
- `markHutangLunas`: Melunaskan sisa tagihan secara penuh.

## Business Rules & Invariants

1. **Separasi Index vs Detail**:
   - Pembuatan data baru di halaman index difokuskan sebagai direktori kontak: hanya meminta Nama dan Catatan.
   - Seluruh mutasi nominal (tambah pinjaman pokok atau catat cicilan) dilakukan di halaman detail.
2. **Fleksibilitas Pengembalian**:
   - Nominal pengembalian/pembayaran tidak dibatasi secara kaku. Pengembalian boleh melebihi pinjaman pokok (misal: pinjam Rp1.000.000, kembali Rp1.200.000 karena bunga atau kelebihan bayar).
   - Sistem mencatat surplus/kelebihan bayar secara transparan tanpa error.
3. **Status Lunas & Ringkasan Aktif**:
   - Status Lunas berfungsi sebagai penanda/tag pelunasan (bisa di-toggle manual atau otomatis saat sisa tagihan lunas).
   - Kartu pihak yang bertag Lunas (`status === 'lunas'` atau `is_lunas_manual === true`) **tidak dihitung** dalam kartu ringkasan index (Piutang Aktif dan Hutang Aktif).
4. **Perhitungan Saldo Rekening**:
   - Trigger database `trg_rekening_cicilan` menyesuaikan saldo rekening berdasarkan `jenis_transaksi`:
     - Pinjaman piutang: uang keluar (-).
     - Pembayaran piutang: uang masuk (+).
     - Pinjaman hutang: uang masuk (+).
     - Pembayaran hutang: uang keluar (-).
   - Menghapus transaksi atau kontak otomatis mengembalikan saldo rekening ke kondisi semula.
5. **Revalidasi**:
   - Perubahan data hutang/piutang merevalidate path `/debts`, `/debts/[id]`, `/wallets`, dan `/reports`.

## UI Behavior

- **Index (`/debts`)**:
  - Ringkasan Piutang Aktif dan Hutang Aktif hanya menghitung pihak yang berstatus aktif (belum lunas).
  - Search bar pencarian nama pihak atau catatan.
  - Filter status: Semua | Belum Lunas | Lunas.
  - Kartu pihak menampilkan nama dan catatan di sisi kiri, serta nominal sisa aktif atau tag `✓ Lunas` di sisi kanan kartu, lengkap dengan link langsung ke halaman detail.
  - Dialog tambah pihak hanya meminta Nama dan Catatan.
- **Detail (`/debts/[id]`)**:
  - Breadcrumb dinamis: `Hutang` $\to$ `Detail Hutang & Piutang`.
  - Header dengan tombol kembali, nama pihak, catatan, dan badge tag Lunas.
  - Tombol aksi: Tandai Lunas/Belum Lunas, Edit Info, Hapus Kontak.
  - Selector hubungan keuangan pihak (Piutang / Hutang) responsif (`grid-cols-1 sm:grid-cols-2`) agar rapi di perangkat mobile.
  - Stat cards: Total Pinjaman Pokok, Total Pembayaran, Sisa Tagihan Riil, serta banner kelebihan bayar jika ada. Saat belum ada pinjaman pokok, progress bar disembunyikan dan stat cards menampilkan keterangan belum ada pinjaman.
  - Tombol aksi pencatatan transaksi:
    - Jika belum ada pinjaman (`totalPinjaman === 0`): tombol aksi berfokus mencatat pinjaman awal (`Beri Pinjaman` / `Catat Pinjaman Diterima`), dan opsi pembayaran dinonaktifkan di dialog sampai pinjaman pertama dicatat.
    - Jika sudah ada pinjaman (`totalPinjaman > 0`): tombol aksi utama adalah pembayaran (`Catat Pembayaran` / `Bayar Hutang`) dengan tombol sekunder `Tambah Pinjaman`.
  - Riwayat transaksi dengan visualisasi arah uang masuk/keluar, info rekening, tanggal/waktu, catatan, serta aksi edit dan hapus yang dioptimalkan untuk mobile.
