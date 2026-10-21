# Feature: Rekening

## Status

Status: **Production (Aktif)**.

## Deskripsi

Fitur rekening digunakan untuk mengelola sumber dana seperti tunai, bank, e-wallet, dan investasi. Rekening menyimpan saldo awal, saldo saat ini, logo, warna, dan opsi exclude dari total.

## Route

- Index: `/wallets`
- Detail: `/wallets/[id]`

## Lokasi File

- Index Page: `src/app/(dashboard)/wallets/page.tsx`
- Index Loading: `src/app/(dashboard)/wallets/loading.tsx`
- Index Client page: `src/app/(dashboard)/wallets/_components/rekening-page-client.tsx`
- Detail Page: `src/app/(dashboard)/wallets/[id]/page.tsx`
- Detail Loading: `src/app/(dashboard)/wallets/[id]/loading.tsx`
- Detail Client page: `src/app/(dashboard)/wallets/[id]/_components/rekening-detail-client.tsx`
- Detail Stat Cards: `src/app/(dashboard)/wallets/[id]/_components/rekening-stat-cards.tsx`
- Dialog Rekening: `src/app/(dashboard)/wallets/_components/rekening-dialog.tsx`
- Actions: `src/actions/rekening-action.ts`
- Validation: `src/validations/rekening-validation.ts`
- Types: `src/types/rekening.d.ts`
- Bank constants: `src/constants/banks.ts`

## Data Source

Initial data index diambil dengan:
- `getRekening()`
- `getRekeningUsageCountsMap()`

Initial data detail diambil dengan:
- `getRekeningById(id)`
- `getTransaksi({ rekening_id: [id] })`
- `getRekening()`
- `getKategori()`

## Tabel Database Terkait

- `rekening`
- `transaksi` untuk transaksi correction saat saldo diubah
- `hutang`
- `hutang_cicilan`
- `recurring_transaksi`

## Server Action Terkait

- `getRekening`
- `getRekeningById`
- `getRekeningUsageCountsMap`
- `createRekening`
- `updateRekening`
- `deleteRekening`
- `toggleExcludeTotal`

## Business Rules

- Jenis rekening harus salah satu dari `Tunai`, `Bank`, `E-Wallet`, atau `Investasi`.
- `saldo_awal` diset saat create.
- `saldo_saat_ini` diset dari `saldo_awal` saat create.
- Saat edit saldo saat ini, action membuat transaksi `correction`, mengubah saldo rekening, dan merevalidate `/reports`.
- Rekening yang `exclude_total = true` tidak dihitung dalam total saldo UI.
- Rekening tidak bisa dihapus jika masih dipakai oleh transaksi, rekening tujuan transfer, hutang/piutang, cicilan, atau template transaksi berulang.
- Server Action `deleteRekening` memeriksa pemakaian rekening sebelum delete.
- Database memiliki trigger `trg_prevent_rekening_delete_when_referenced` sebagai proteksi backend tambahan untuk delete langsung.

## UI Behavior

### Index (`/wallets`)
- Halaman menampilkan total saldo dari rekening yang tidak di-exclude.
- User bisa tambah, edit, hapus rekening.
- Form dialog Tambah & Edit Rekening (`RekeningDialog`) otomatis menutup modal dialog (`onClose`) setelah submit berhasil.
- Selector Bank / E-Wallet pada form Tambah Rekening menyajikan grid bank/e-wallet dengan tata letak rapi, seragam, dan emoji terpusat di dalam lingkaran ikon.
- Rekening card dan badge jumlah data (`Dipakai {usage.total} data`) dapat diklik untuk langsung membuka halaman detail `/wallets/[id]`.
- Tombol hapus memberi rincian data pemakaian (transaksi keluar/masuk/koreksi, transfer masuk, hutang/piutang, cicilan, dan transaksi berulang) agar data terkait dihapus terlebih dahulu.
- State rekening dan pemakaian data pada client otomatis tersinkronisasi saat initial props dari Server Component diperbarui.
- User bisa toggle rekening untuk dihitung/tidak dihitung dalam total.

### Detail (`/wallets/[id]`)
- Menampilkan breadcrumb topnav dinamis dengan nama rekening (misal `Rekening > SeaBank`), menggantikan UUID raw URL.
- Menampilkan header dengan tombol kembali ke `/wallets`, nama rekening, badge jenis rekening, dan badge status keikutsertaan saldo.
- Tombol aksi pada mobile tersusun seimbang (grid 2 kolom pill `rounded-full` 50/50).
- Kartu Saldo Utama menampilkan nominal saldo saat ini dalam `font-mono` besar beserta switch toggle keikutsertaan dalam total saldo.
- Tiga kartu statistik: Total Masuk (inflow), Total Keluar (outflow), dan Arus Kas Bersih (net flow).
- Pill ringkasan distribusi data pemakaian (Pemasukan, Pengeluaran, Transfer Keluar, Transfer Masuk, Koreksi Saldo, dan Hutang/Cicilan).
- Feed histori transaksi lengkap dengan fungsionalitas serupa halaman Index Transaksi: dropdown periode (`Semua Waktu`, `Bulan Ini`, `Minggu Ini`, `Hari Ini`, `Tahun Ini`, `Custom`), navigasi tanggal interaktif dengan pemilih tanggal bawaan, tab tipe transaksi horizontal scrollable, serta pencarian instan.
- Klik transaksi membuka `TransaksiDetailSheet` (bisa melihat detail, copy transaksi, edit transaksi, hapus transaksi).
- Tombol "Tambah Transaksi" & Edit Transaksi di detail rekening terkunci ke rekening ini (`lockRekening={true}`):
  - Pada mode create dan edit expense/income: dropdown Rekening Asal ter-disable dan terkunci ke rekening yang sedang dibuka, dengan label penanda "Terkunci di rekening ini".
  - Pada mode create transfer: Rekening Asal terkunci ke rekening saat ini, sementara Rekening Tujuan bebas dipilih.
  - Pada mode edit transfer-in (di mana rekening tujuan adalah rekening detail saat ini): Rekening Tujuan ter-disable dan terkunci, sementara Rekening Asal dapat diubah.
  - Saran judul transaksi (`getRecentJudul` & `getJudulSuggestions`) difilter secara spesifik berdasarkan riwayat `rekening_id` yang sedang dibuka.
  - Pemilihan saran judul atau AI autofill memproteksi rekening terkunci agar tidak tertimpa.
  - Submit form menegakkan rekening yang terkunci ke database.
  - Copy transaksi (`_isCopySignal`) dari detail rekening terintegrasi mulus.
- Tombol "Edit Rekening" membuka `RekeningDialog` untuk memperbarui informasi atau koreksi saldo rekening, dan dialog otomatis tertutup setelah berhasil disimpan.

## TODO / Improvement

- Tambahkan mekanisme reorder rekening jika field `urutan` ingin dipakai aktif di UI.
