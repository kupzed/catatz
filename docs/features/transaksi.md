# Feature: Transaksi

## Status

Status: Aktif.

## Deskripsi

Fitur transaksi digunakan untuk mencatat pemasukan, pengeluaran, transfer antar rekening, dan koreksi saldo.

## Route

- `/transaksi`
- Shortcut PWA: `/transaksi?new=true`

## Lokasi File

- Page: `src/app/(dashboard)/transaksi/page.tsx`
- Loading: `src/app/(dashboard)/transaksi/loading.tsx`
- Client page: `src/app/(dashboard)/transaksi/_components/transaksi-page-client.tsx`
- Dialog: `src/app/(dashboard)/transaksi/_components/transaksi-dialog.tsx`
- Voice button: `src/app/(dashboard)/transaksi/_components/voice-input-button.tsx`
- Actions: `src/actions/transaksi-action.ts`
- Validation: `src/validations/transaksi-validation.ts`
- Types: `src/types/transaksi.d.ts`
- Offline queue: `src/lib/offline-queue.ts`

## Data Source

Initial data diambil di Server Component dengan:

- `getTransaksi()`
- `getRekening()`
- `getKategori()`

## Tabel Database Terkait

- `transaksi`
- `rekening`
- `kategori`

## Server Action Terkait

- `getTransaksi`
- `getKategori`
- `createTransaksi`
- `updateTransaksi`
- `deleteTransaksi`
- `getJudulSuggestions`
- `getRecentJudul`
- `suggestKategori`
- `processVoiceInput` untuk input suara

## Business Rules

- `nominal` wajib lebih dari 0.
- `income` dan `expense` wajib memiliki `judul` dan `kategori_id`.
- `transfer` wajib memiliki `rekening_tujuan`.
- `rekening_id` dan `rekening_tujuan` tidak boleh sama untuk transfer.
- `transfer` dan `correction` tidak boleh memiliki `judul` berdasarkan schema UI.
- Server Action create/update memvalidasi payload dengan `transaksiSchema` agar proteksi tidak hanya bergantung pada UI.
- Database juga memastikan `correction` tidak memiliki `judul`.
- Trigger database otomatis mengubah saldo rekening untuk `income`, `expense`, dan `transfer`.
- `correction` tidak diproses trigger dan ditangani manual oleh Server Action rekening/transaksi.
- Setelah create/update/delete, route `/transaksi`, `/rekening`, dan `/rekap` di-revalidate.

## UI Behavior

- User bisa filter periode, tipe, rekening, search judul/catatan/kategori, dan sorting.
- Query `?new=true` membuka dialog transaksi baru otomatis.
- Dialog mendukung mode create, edit, copy, dan correction readonly behavior.
- Tanggal default dialog create normal mengikuti tanggal/periode yang sedang dipilih di halaman transaksi; waktu tetap memakai waktu saat dialog dibuka.
- Field kategori hanya tampil untuk income/expense.
- Field rekening tujuan hanya tampil untuk transfer.
- Dialog membersihkan field yang tidak relevan saat tipe transaksi berubah, misalnya kategori untuk transfer dan rekening tujuan untuk non-transfer.
- Judul suggestion diambil dari histori transaksi.
- Input suara memakai browser Speech Recognition dan Gemini parser server-side.
- Saat offline, create/update/delete transaksi dapat masuk ke IndexedDB queue.
- Pending transaksi offline ditampilkan sebagai data sementara dengan status menunggu sinkronisasi.

## TODO / Improvement

- Review apakah update/delete offline untuk semua skenario sudah memiliki feedback konflik data yang cukup.
- Jika recurring transaction diaktifkan, tambahkan UI dan dokumentasi khusus recurring.
