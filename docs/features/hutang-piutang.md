# Feature: Hutang/Piutang

## Status

Status: Aktif.

## Deskripsi

Fitur hutang/piutang digunakan untuk mencatat pinjaman yang user berikan atau terima, melacak cicilan, dan melihat status pelunasan.

## Route

- `/hutang`

## Lokasi File

- Page: `src/app/(dashboard)/hutang/page.tsx`
- Loading: `src/app/(dashboard)/hutang/loading.tsx`
- Client page: `src/app/(dashboard)/hutang/_components/hutang-page-client.tsx`
- Dialog: `src/app/(dashboard)/hutang/_components/hutang-dialog.tsx`
- Actions: `src/actions/hutang-action.ts`
- Validation: `src/validations/hutang-validation.ts`
- Types: `src/types/hutang.d.ts`
- Helper reminder: `waReminderUrl` di `src/lib/utils.ts`

## Data Source

Initial data diambil dengan:

- `getHutang()`
- `getRekening()`

## Tabel Database Terkait

- `hutang`
- `hutang_cicilan`
- `rekening`

## Server Action Terkait

- `getHutang`
- `createHutang`
- `updateHutang`
- `deleteHutang`
- `createCicilan`
- `deleteCicilan`
- `markHutangLunas`

## Business Rules

- `tipe` hutang adalah `memberi` atau `menerima`.
- `total_pinjaman` wajib lebih dari 0.
- `sisa_tagihan` diisi dari `total_pinjaman` saat create.
- Cicilan wajib memiliki nominal lebih dari 0.
- Trigger database menghitung ulang `sisa_tagihan` dan status setelah insert/delete cicilan.
- Trigger database mengubah saldo rekening saat hutang/piutang atau cicilan mempengaruhi rekening.
- UI melunaskan hutang dengan membuat cicilan sebesar sisa tagihan.

## UI Behavior

- Halaman menampilkan daftar hutang/piutang dengan badge status.
- Progress menunjukkan persentase pembayaran.
- User bisa tambah/edit/hapus hutang/piutang.
- User bisa tambah cicilan.
- User bisa lunaskan catatan melalui confirm dialog.
- User bisa membuka WhatsApp reminder link dengan helper `waReminderUrl`.

## TODO / Improvement

- Status `overdue` ada di enum database, tetapi belum terlihat logic otomatis yang mengubah status menjadi overdue berdasarkan tanggal jatuh tempo.
- Pertimbangkan riwayat cicilan yang lebih rinci jika kebutuhan audit bertambah.
