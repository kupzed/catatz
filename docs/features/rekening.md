# Feature: Rekening

## Status

Status: Aktif.

## Deskripsi

Fitur rekening digunakan untuk mengelola sumber dana seperti tunai, bank, e-wallet, dan investasi. Rekening menyimpan saldo awal, saldo saat ini, logo, warna, dan opsi exclude dari total.

## Route

- `/rekening`

## Lokasi File

- Page: `src/app/(dashboard)/rekening/page.tsx`
- Loading: `src/app/(dashboard)/rekening/loading.tsx`
- Client page: `src/app/(dashboard)/rekening/_components/rekening-page-client.tsx`
- Dialog: `src/app/(dashboard)/rekening/_components/rekening-dialog.tsx`
- Actions: `src/actions/rekening-action.ts`
- Validation: `src/validations/rekening-validation.ts`
- Types: `src/types/rekening.d.ts`
- Bank constants: `src/constants/banks.ts`

## Data Source

Initial data diambil dengan:

- `getRekening()`
- `getRekeningUsageCountsMap()`

## Tabel Database Terkait

- `rekening`
- `transaksi` untuk transaksi correction saat saldo diubah
- `hutang`
- `hutang_cicilan`
- `recurring_transaksi`

## Server Action Terkait

- `getRekening`
- `getRekeningUsageCountsMap`
- `createRekening`
- `updateRekening`
- `deleteRekening`
- `toggleExcludeTotal`

## Business Rules

- Jenis rekening harus salah satu dari `Tunai`, `Bank`, `E-Wallet`, atau `Investasi`.
- `saldo_awal` diset saat create.
- `saldo_saat_ini` diset dari `saldo_awal` saat create.
- Saat edit saldo saat ini, action membuat transaksi `correction`, mengubah saldo rekening, dan merevalidate `/rekap`.
- Rekening yang `exclude_total = true` tidak dihitung dalam total saldo UI.
- Rekening tidak bisa dihapus jika masih dipakai oleh transaksi, rekening tujuan transfer, hutang/piutang, cicilan, atau template transaksi berulang.
- Server Action `deleteRekening` memeriksa pemakaian rekening sebelum delete.
- Database memiliki trigger `trg_prevent_rekening_delete_when_referenced` sebagai proteksi backend tambahan untuk delete langsung.

## UI Behavior

- Halaman menampilkan total saldo dari rekening yang tidak di-exclude.
- User bisa tambah, edit, hapus rekening.
- Rekening yang masih dipakai menampilkan badge jumlah data dan tombol hapus memberi pesan agar data terkait dihapus terlebih dahulu.
- User bisa toggle rekening untuk dihitung/tidak dihitung dalam total.
- Dialog create memakai `rekeningCreateSchema`.
- Dialog edit memakai `rekeningEditSchema`.
- Saldo awal readonly saat edit; perubahan saldo saat ini ditandai sebagai koreksi saldo.
- Logo bank/e-wallet dipilih dari constants berdasarkan jenis rekening.

## TODO / Improvement

- Tambahkan mekanisme reorder rekening jika field `urutan` ingin dipakai aktif di UI.
