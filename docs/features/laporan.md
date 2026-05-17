# Feature: Laporan/Rekap

## Status

Status: Aktif untuk rekap dan export PDF. Budget usage tampil jika data budget tersedia.

## Deskripsi

Fitur laporan/rekap menampilkan ringkasan pemasukan, pengeluaran, breakdown kategori, chart, dan export PDF transaksi.

## Route

- `/rekap`
- Export PDF berada di `/settings` tab `Export Data`.

## Lokasi File

- Rekap page: `src/app/(dashboard)/rekap/page.tsx`
- Loading: `src/app/(dashboard)/rekap/loading.tsx`
- Client page: `src/app/(dashboard)/rekap/_components/rekap-page-client.tsx`
- Chart: `src/app/(dashboard)/rekap/_components/rekap-charts.tsx`
- Rekap actions: `src/actions/rekap-action.ts`
- Export actions: `src/actions/export-action.ts`
- PDF generator: `src/lib/pdf-generator.ts`
- Export tab: `src/app/(dashboard)/settings/_components/export-tab.tsx`

## Data Source

Rekap initial data:

- `getRekapBulanan(tahun)`
- `getRekapKategori(bulan, tahun)`
- `getBudgetWithUsage(bulan, tahun)`

Export data:

- `getExportData(filter)`
- `getExportCount()`

## Tabel Database Terkait

- `transaksi`
- `kategori`
- `rekening`
- `profiles`
- `budget`

## Server Action Terkait

- `getRekapBulanan`
- `getRekapKategori`
- `getBudgetWithUsage`
- `upsertBudget`
- `getExportData`
- `getExportCount`

## Business Rules

- Rekap bulanan menghitung `income` dan `expense`.
- Transfer dikecualikan dari perhitungan income/expense tahunan.
- Breakdown kategori hanya menghitung transaksi `expense`.
- Budget usage menghitung expense per kategori pada bulan/tahun aktif.
- Export PDF dapat difilter dengan tanggal `dari` dan `sampai`.
- Export PDF menampilkan summary, count transaksi, periode, top kategori, dan detail transaksi.

## UI Behavior

- Chart memakai Recharts dan di-lazy load untuk mengurangi bundle awal.
- Summary card menampilkan pemasukan/pengeluaran bulan aktif dan total tahunan.
- Pie chart kategori hanya tampil jika ada data kategori expense.
- Budget section hanya tampil jika ada data budget.
- Export PDF memakai dynamic import `src/lib/pdf-generator.ts`.

## TODO / Improvement

- UI untuk membuat/mengubah budget belum terlihat, walaupun action `upsertBudget` dan table `budget` sudah ada.
- Pertimbangkan filter periode di halaman `/rekap` jika kebutuhan analisis lebih luas.
