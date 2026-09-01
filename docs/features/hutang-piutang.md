# Feature: Hutang/Piutang

## Status

Status: Aktif.

## Deskripsi

Fitur hutang/piutang digunakan untuk mencatat pinjaman yang user berikan atau terima, melacak cicilan, dan melihat status pelunasan.

## Route

- `/debts`

## Lokasi File

- Page: `src/app/(dashboard)/debts/page.tsx`
- Loading: `src/app/(dashboard)/debts/loading.tsx`
- Client page: `src/app/(dashboard)/debts/_components/hutang-page-client.tsx`
- Dialog: `src/app/(dashboard)/debts/_components/hutang-dialog.tsx`
- Actions: `src/actions/hutang-action.ts`
- Validation: `src/validations/hutang-validation.ts`
- Types: `src/types/hutang.d.ts`

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
- `updateCicilan`
- `deleteCicilan`
- `markHutangLunas`

## Business Rules

- `tipe` hutang adalah `memberi` atau `menerima`.
- `total_pinjaman` wajib lebih dari 0.
- `sisa_tagihan` diisi dari `total_pinjaman` saat create.
- Cicilan wajib memiliki nominal lebih dari 0.
- Trigger database menghitung ulang `sisa_tagihan` dan status setelah cicilan dibuat, diubah, atau dihapus.
- Trigger database mengubah saldo rekening saat hutang/piutang atau cicilan mempengaruhi rekening.
- Cicilan menyimpan `tipe_hutang_snapshot` agar rollback saldo tetap benar ketika parent hutang/piutang dihapus setelah memiliki cicilan.
- Perubahan hutang/piutang dan cicilan ikut merevalidate `/reports` karena halaman rekap menampilkan rincian hutang/piutang.
- UI melunaskan hutang dengan meminta user memilih rekening terlebih dahulu, lalu membuat cicilan sebesar sisa tagihan.
- Tipe hutang/piutang tidak bisa diubah setelah catatan memiliki cicilan.

## UI Behavior

- Halaman menampilkan daftar hutang/piutang dengan badge status.
- Halaman menampilkan ringkasan Piutang aktif dan Hutang aktif berdasarkan total `sisa_tagihan`.
- Progress menunjukkan persentase pembayaran.
- User bisa tambah/edit/hapus hutang/piutang.
- User bisa tambah cicilan.
- User bisa membuka Detail sebagai panel inline di bawah card untuk melihat daftar cicilan.
- User bisa mengedit dan menghapus cicilan dari Detail.
- User bisa membuka panel Pelunasan inline seperti form Cicilan, memilih rekening, lalu melunaskan sisa tagihan.
- Hanya satu panel Detail, Cicilan, atau Pelunasan yang terbuka pada satu card.
- Dialog tambah/edit hutang dipusatkan di area aman viewport.
- Action Detail, Cicilan, Lunas, Edit, dan Hapus menggunakan grid satu baris pada mobile tanpa horizontal scroll. Edit dan Hapus berada pada kolom tetap 44px di sisi kanan dengan label aksesibel.
- Tombol WhatsApp reminder tidak tersedia.

## TODO / Improvement

- Status `overdue` ada di enum database, tetapi belum terlihat logic otomatis yang mengubah status menjadi overdue berdasarkan tanggal jatuh tempo.
- Pertimbangkan audit log khusus jika riwayat edit/hapus cicilan perlu disimpan permanen.
