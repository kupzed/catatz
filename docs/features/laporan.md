# Feature: Laporan/Rekap

## Status

Status: **Production (Aktif)** untuk rekap dan export PDF/XLSX/CSV. Budget usage tampil jika data budget tersedia.

## Deskripsi

Fitur laporan/rekap menampilkan ringkasan pemasukan, pengeluaran, detail bulanan, breakdown kategori/judul, chart, dan export transaksi.

## Route

- `/reports`
- `/reports/detail?dari=YYYY-MM-DD&sampai=YYYY-MM-DD&jenis=bulanan|custom[&id=uuid]` (Detail rekap periode)
- Export data berada di `/settings` tab `Export Data`.

## Lokasi File

- Rekap page: `src/app/(dashboard)/reports/page.tsx`
- Loading: `src/app/(dashboard)/reports/loading.tsx`
- Client page: `src/app/(dashboard)/reports/_components/rekap-page-client.tsx`
- Realtime tab: `src/app/(dashboard)/reports/_components/rekap-realtime-tab.tsx`
- Bulanan tab: `src/app/(dashboard)/reports/_components/rekap-bulanan-tab.tsx`
- Custom tab: `src/app/(dashboard)/reports/_components/rekap-custom-tab.tsx`
- Custom dialog: `src/app/(dashboard)/reports/_components/rekap-custom-dialog.tsx`
- Period card: `src/app/(dashboard)/reports/_components/rekap-period-card.tsx`
- Settings dialog: `src/app/(dashboard)/reports/_components/rekap-settings-dialog.tsx`
- Detail page: `src/app/(dashboard)/reports/detail/page.tsx`
- Detail loading: `src/app/(dashboard)/reports/detail/loading.tsx`
- Detail client component: `src/app/(dashboard)/reports/detail/_components/rekap-detail-client.tsx`
- Detail breakdown: `src/app/(dashboard)/reports/detail/_components/rekap-detail-breakdown.tsx`
- Proporsi saldo chart: `src/app/(dashboard)/reports/detail/_components/proporsi-saldo-chart.tsx`
- Chart components (`RekapBarChart`, `RekapPieChart`, `RekapDonutChart`): `src/app/(dashboard)/reports/_components/rekap-charts.tsx`
- Detail bulanan (legacy, dipertahankan): `src/app/(dashboard)/reports/_components/rekap-monthly-detail-section.tsx`
- Summary cards (legacy, dipertahankan): `src/app/(dashboard)/reports/_components/rekap-summary-cards.tsx`
- Category breakdown (legacy, dipertahankan): `src/app/(dashboard)/reports/_components/rekap-kategori-section.tsx`
- Bar breakdown (legacy, dipertahankan): `src/app/(dashboard)/reports/_components/rekap-bar-section.tsx`
- Budget section (legacy, dipertahankan): `src/app/(dashboard)/reports/_components/rekap-budget-section.tsx`
- Rekap period engine: `src/lib/rekap-period.ts`
- Rekap aggregation: `src/lib/rekap-aggregate.ts`
- Rekap balance calculator: `src/lib/rekap-balance.ts`
- Rekap actions: `src/actions/rekap-action.ts`
- Rekap period & settings actions: `src/actions/rekap-period-action.ts`
- Rekap balance action: `src/actions/rekap-saldo-action.ts`
- Export actions: `src/actions/export-action.ts`
- PDF generator: `src/lib/pdf-generator.ts`
- Spreadsheet generator: `src/lib/spreadsheet-generator.ts`
- Export section: `src/app/(dashboard)/settings/_components/export-section.tsx`

## Data Source

Rekap initial data:

- `getRekapSettings()` (pengaturan cut-off & akumulasi saldo)
- `getRekapDetailByRange(startDate, endDate)` (agregasi pengeluaran kategori realtime per siklus berjalan)
- `getRekapBulanan(tahun)`
- `getRekapDetailBulanan(bulan, tahun)`
- `getBudgetWithUsage(bulan, tahun)`

Export data:

- `getExportData(filter)`
- `getExportCount()`

## Tabel Database Terkait

- `user_preferences` (menyimpan `cutoff_day` dan `akumulasi_saldo`)
- `rekap_periode_custom`
- `transaksi`
- `kategori`
- `rekening`
- `hutang`
- `hutang_cicilan`
- `profiles`
- `budget`

## Server Action Terkait

- `getRekapSettings`
- `updateRekapSettings`
- `listCustomPeriods`
- `createCustomPeriod`
- `updateCustomPeriod`
- `deleteCustomPeriod`
- `getSaldoPeriodeList`
- `getRekapBulanan`
- `getRekapDetailBulanan`
- `getRekapDetailByRange`
- `getRekapRingkasanPeriodeList`
- `getRekapKategori`
- `getBudgetWithUsage`
- `upsertBudget`
- `getExportData`
- `getExportCount`

## Business Rules

- Rekap bulanan menghitung `income` dan `expense`; `transfer` dan `correction` tidak masuk selisih utama (D12).
- Detail bulan menampilkan selisih pemasukan/pengeluaran, rata-rata harian, serta total selisih koreksi saldo dan hutang/piutang jika ada aktivitas pada bulan tersebut.
- Koreksi saldo dan hutang/piutang tidak diselisihkan ke nominal utama pemasukan dikurangi pengeluaran.
- Breakdown detail dapat dilihat berdasarkan kategori atau judul untuk transaksi `income` dan `expense`.
- Detail hutang/piutang dihitung dari hutang/piutang baru dan cicilan pada rentang tanggal terpilih.
- **Catatan Rekonsiliasi Arus Kas Hutang/Piutang (D8)**:
  - Rumus lama `hutangPiutangNet` pada komponen UI `rekap-monthly-detail-section.tsx` saat ini menghitung:
    `piutang_baru + cicilan_piutang - hutang_baru - cicilan_hutang`
  - Rumus tersebut berbeda tanda (+ / -) dengan Keputusan Arsitektur D8 untuk arus kas riil bersih:
    `hutang_baru - piutang_baru - cicilan_hutang + cicilan_piutang` (menerima pinjaman dan terima cicilan piutang menambah saldo uang riil/kas masuk; memberi pinjaman dan bayar cicilan hutang mengurangi saldo uang riil/kas keluar).
  - Komponen `rekap-monthly-detail-section.tsx` dipertahankan tanpa perubahan pada Fase 4 dan direkonsiliasi pada fase UI terkait berikutnya (Fase 5/6).
- Budget usage menghitung expense per kategori pada bulan/tahun terpilih.
- Export PDF, XLSX, dan CSV dapat difilter dengan tanggal `dari` dan `sampai`.
- Export PDF menampilkan summary, count transaksi, periode, top kategori, dan detail transaksi.
- Export XLSX menampilkan sheet `Ringkasan` dan `Transaksi`.
- Export CSV menampilkan detail transaksi dalam format comma-separated values.
- Seluruh pengambilan dataset untuk rekap bulanan, rekap detail rentang, aggregasi tren periode, budget usage, kalkulasi saldo mundur, dan export data menggunakan utilitas `fetchAllRows` (`src/lib/supabase-fetch.ts`) untuk mengambil data secara bertahap dalam batch 1.000 baris sehingga melewati batas default PostgREST tanpa kehilangan data.
- Seluruh teks antarmuka laporan/rekap (nama tab, label siklus, kartu metrik, donut chart, rincian kategori/judul, dan dialog periode custom) bersifat bilingual melalui kamus `src/i18n/`.

## UI Behavior

- Shell baru rekap (`RekapPageClient`) menampilkan `PageHeader` dengan judul "Rekap Keuangan" dan tombol pengaturan (tap target 44px, `size-11`, `rounded-full`) dengan `aria-label="Pengaturan Rekap"` di pojok kanan atas.
- Navigasi tab utama: "Realtime", "Bulanan", dan "Custom".
- Tab aktif disinkronkan ke URL query parameter `?tab=` via `router.replace(..., { scroll: false })` (default: `realtime`) agar navigasi kembali dari halaman detail tetap berada pada tab yang sama.
- Dialog pengaturan rekap (`RekapSettingsDialog`):
  - Aman safe-area pada viewport mobile (`rounded-card`, scrollable container).
  - Dropdown `Select` untuk tanggal cut-off siklus 1–31 dengan pratinjau live rentang siklus berjalan (menggunakan helper `rekap-period.ts`).
  - Toggle `Switch` untuk "Saldo Akumulasi" dengan deskripsi informatif.
  - Penyimpanan perubahan via Server Action `updateRekapSettings` dengan state optimistik, rollback bila gagal, notifikasi Sonner `toast`, dan `router.refresh()`- **Tab Realtime (`RekapRealtimeTab`)**:
  - Menentukan siklus berjalan dinamis menggunakan `getCycleContaining(settings.cutoff_day, getTodayInJakarta())` (D6).
  - Menampilkan kartu header siklus berjalan dengan label periode terformat dan 3 ringkasan metrik: Total Pengeluaran (`text-semantic-down font-mono`), Total Pemasukan (`text-semantic-up font-mono`), dan Sisa Saldo (`font-mono`).
  - Menyediakan switcher segmented pill untuk rincian: "Kategori" atau "Judul".
  - Mengambil data via `getRekapDetailByRange(cycle.startDate, cycle.endDate)`.
  - Merender Donut Chart Recharts (`RekapDonutChart`, lazy-loaded) dengan total nominal di tengah lingkaran dan irisan warna proporsi sesuai mode aktif (Kategori atau Judul).
  - Merender daftar rincian: ikon plate, nama, persentase (`font-mono`), nominal (`font-mono`), dan batang proporsi progress bar yang diwarnai sesuai palet tema.
  - Kartu Donut Chart dan Kartu Rincian Daftar diratakan tingginya (`h-full items-stretch`).
  - Otomatis melakukan re-fetch data saat window kembali fokus (`focus`), tab kembali aktif (`visibilitychange`), atau perangkat kembali online (`online`) (D5).
  - Menampilkan `EmptyState` bila belum ada transaksi pada siklus berjalan.
- **Halaman Detail Rekap (`/reports/detail`)**:
  - Validasi parameter kueri secara asinkron di Server Component (`searchParams`) menggunakan Zod schema `rekapDetailQuerySchema` (`dari`, `sampai`, `jenis: 'bulanan' | 'custom'`, `id?: uuid`), me-redirect ke `notFound()` jika parameter tidak valid atau rentang tanggal terbalik.
  - Untuk `jenis === 'custom'` dengan parameter `id`, mengambil nama periode via `getCustomPeriod(id)`. Jika periode kustom tidak ditemukan di database, memicu `notFound()`.
  - Mengambil data ringkasan via `getRekapDetailByRange(dari, sampai)`.
  - Tombol kembali menuju tab asal (`/reports?tab=${jenis}`) berbentuk pill (`rounded-full`) dengan tap target minimum 44px.
  - Label periode terformat (`formatPeriodLabel`), nama kustom (bila ada), dan badge jenis periode.
  - Tiga kartu ringkasan utama: Total Pengeluaran (rata-rata/hari), Total Pemasukan (rata-rata/hari), dan Selisih Utama (Pemasukan dikurangi Pengeluaran).
  - Kartu Rincian Finansial Periode:
    - Pengeluaran & rata-rata pengeluaran per hari (`text-semantic-down font-mono`).
    - Pemasukan & rata-rata pemasukan per hari (`text-semantic-up font-mono`).
    - Selisih utama (`signed font-mono`).
    - Baris Koreksi Saldo (`signed font-mono`), hanya tampil jika ada aktivitas koreksi (`detail.koreksi.count > 0`).
    - Baris Arus Kas Hutang & Piutang (`signed font-mono`), hanya tampil jika ada mutasi hutang/piutang (`detail.hutang_piutang.count > 0`), dihitung dengan formula arus kas bersih D8: `(hutang_baru + cicilan_piutang) - (piutang_baru + cicilan_hutang)`.
    - Baris Saldo Awal dan Saldo Akhir (`font-mono`), hanya tampil jika toggle akumulasi saldo aktif (`settings.akumulasi_saldo === true`), dihitung menggunakan `getSaldoPeriodeList`.
  - Kartu Grafik Proporsi Pengeluaran vs Sisa Saldo (Definisi D9):
    - Vertikal Bar Chart Recharts ("chart bar ke atas") dengan batang Pengeluaran (`semantic-down`) dan Sisa Saldo (`primary`).
    - Sisa saldo dihitung dari: `total_income + (akumulasiAktif ? saldoAwal : 0) - total_expense`.
    - Jika defisit (`sisaSaldo < 0`), chart menampilkan penanda defisit disertai badge dan banner peringatan defisit berwarna `semantic-down`.
  - Kartu Rincian Breakdown Transaksi (`RekapDetailBreakdown`):
    - Visual Donut Chart proporsi (`RekapDonutChart`) di bagian atas dengan toggle pill "Pengeluaran" | "Pemasukan", menampilkan pembagian visual per kategori atau per judul secara dinamis.
    - Tab segmented aksesibel "Kategori | Judul" (`TabsList rounded-full`).
    - Tab Kategori menampilkan dua bagian: "Pengeluaran per Kategori" (`detail.kategori.expense`) dan "Pemasukan per Kategori" (`detail.kategori.income`).
    - Tab Judul menampilkan dua bagian (D10): "Pengeluaran per Judul" (`detail.judul.expense`) dan "Pemasukan per Judul" (`detail.judul.income`).
    - Tiap baris menyajikan: ikon plate (`rounded-full`), label teks (`truncate`), total nominal (`font-mono`, semantic color hanya pada teks tanpa background button), persentase (`font-mono`), jumlah transaksi, dan batang proporsi `Progress`.
    - Interaksi drill-down: menekan baris membuka/menutup daftar transaksi (`aria-expanded`), dengan aturan satu baris terbuka per bagian ("single expanded row per section").
    - Daftar transaksi menampilkan judul/catatan, badge kategori/tipe, tanggal, waktu, nama rekening, catatan (`break-words`), dan nominal bertanda (`+`/`-`, `font-mono`).
    - Data transaksi diambil langsung dari payload `getRekapDetailByRange`, tanpa memicu kueri database baru.
    - Struktur responsif dan anti-overflow pada mobile viewport (`truncate`, `break-words`, `min-w-0`).
- **Tab Bulanan (`RekapBulananTab`) & Kartu Periode (`RekapPeriodCard`)**:
  - `RekapBulananTab` memuat siklus secara dinamis dari bulan pertama kali ada transaksi (`getEarliestTransactionDate`) sampai siklus berjalan saat ini, menghindari pagination mundur tak terhingga yang memberatkan database.
  - Mengambil agregasi finansial secara batch via `getRekapRingkasanPeriodeList(cycles)` dan `getSaldoPeriodeList(cycles)` (bila mode `akumulasi_saldo` aktif).
  - Seluruh kartu periode (`RekapPeriodCard`) di tab Bulanan dan Custom memiliki tinggi seragam rata dengan kartu terpanjang (`h-full items-stretch`) dengan tetap mempertahankan susunan baris metrik data apa adanya.
  - Menampilkan skeleton loading selama inisialisasi data.
  - Menampilkan `EmptyState` jika tidak ada siklus atau data transaksi.
  - Otomatis melakukan refetch ketika pengaturan cut-off atau akumulasi saldo diperbarui di modal pengaturan.
  - Kartu Periode (`RekapPeriodCard`):
    - Seluruh bodi kartu dibungkus sebagai `Link` aksesibel menuju halaman detail (`/reports/detail?dari=YYYY-MM-DD&sampai=YYYY-MM-DD&jenis=bulanan[&id=uuid]`) dengan safe tap target (min 44px) dan efek hover halus (`hover:border-hairline-strong hover:bg-surface-soft/60`).
    - Header kartu menampilkan label rentang tanggal terformat, badge status "Berjalan" (pill `rounded-full bg-primary/10 text-primary`) untuk siklus aktif saat ini, dan ikon navigasi `ChevronRight`.
    - Dukungan tombol opsional ubah periode (`onEdit`) dengan `e.preventDefault()` / `e.stopPropagation()` agar tidak memicu navigasi kartu.
    - Mode akumulasi saldo nonaktif: Pengeluaran (`text-semantic-down`), Pemasukan (`text-semantic-up`), Selisih utama (`signed`), dan Arus Kas Hutang Piutang (formula D8: `(hutang_baru + cicilan_piutang) - (piutang_baru + cicilan_hutang)`).
    - Mode akumulasi saldo aktif: Saldo Awal, Pengeluaran, Pemasukan, Selisih, Hutang Piutang, dan Saldo Akhir.
    - Baris Koreksi Saldo (`signed font-mono`) hanya ditampilkan jika terdapat aktivitas koreksi saldo (`koreksi.count > 0` atau `koreksi.net !== 0`).
    - Seluruh nominal keuangan berformat `font-mono` dengan aturan warna semantik strictly text-only sesuai `DESIGN.md`.
- **Tab Periode Kustom (`RekapCustomTab`) & Dialog Kustom (`RekapCustomDialog`)**:
  - `RekapCustomTab` memuat daftar periode kustom via Server Action `listCustomPeriods` (diurutkan tanggal mulai terbaru).
  - Mengambil agregasi finansial secara batch via `getRekapRingkasanPeriodeList(ranges)` dan `getSaldoPeriodeList(ranges)` (jika akumulasi saldo aktif).
  - Merender kartu `RekapPeriodCard` bertipe `jenis="custom"` yang menautkan langsung ke `/reports/detail?dari=...&sampai=...&jenis=custom&id=uuid`, menampilkan nama kustom, serta tombol ubah periode (`onEdit`).
  - Menampilkan `EmptyState` jika belum ada periode kustom yang dibuat pengguna, lengkap dengan tombol CTA "Tambah Periode Kustom".
  - **Floating Action Button (FAB)**:
    - Tombol CTA melayang berbentuk pill (`rounded-full bg-primary`) dengan ikon `Plus` dan label "Periode Baru".
    - Tap target aman: tinggi 48px (`h-12 min-h-[44px] px-5`).
    - **Posisi & Anti-Tabrakan**:
      - Mobile (`< 768px`): `fixed right-4 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] z-40`.
      - Desktop (`md+`): `fixed right-8 bottom-8 z-40`.
      - **Alasan Pemilihan Posisi**: Tombol panduan iOS install guide (`ios-install-guide.tsx`) berada pada `fixed right-4 bottom-16` (tinggi 40px, menjangkau 64px–104px dari dasar viewport). Offset `bottom-[calc(7.5rem+...)]` (120px + safe area) memberikan jarak celah vertikal bersih 16px di atas tombol iOS install guide. Di saat yang sama, bilah `OfflineIndicator` berada di `fixed inset-x-3 bottom-3` (12px–56px), sehingga ketiga elemen mengambang tetap terlihat jelas dan dapat ditekan dengan nyaman tanpa tabrakan.
  - **Dialog Periode Kustom (`RekapCustomDialog`)**:
    - Input nama periode (1–100 karakter, menggunakan `ClearableInput`).
    - Input grid responsif untuk tanggal mulai dan tanggal selesai.
    - Validasi client & server menggunakan `customPeriodSchema` (Zod v4).
    - Mode tambah: memanggil `createCustomPeriod(values)`.
    - Mode edit: memanggil `updateCustomPeriod(editData.id, values)`.
    - Mode edit menyediakan tombol aksi "Hapus" yang dilindungi dialog konfirmasi `ConfirmDialog` (`deleteCustomPeriod(editData.id)`).
    - Setelah mutasi berhasil, menampilkan notifikasi Sonner toast dan memicu reload data daftar periode secara reaktif.
- Komponen rekap legacy (`rekap-summary-cards`, `rekap-monthly-detail-section`, `rekap-kategori-section`, `rekap-bar-section`, `rekap-charts`, `rekap-budget-section`) tidak dihapus dan tidak diedit untuk menjamin backward compatibility.
- Export PDF memakai dynamic import `src/lib/pdf-generator.ts`.
- Export XLSX/CSV memakai dynamic import `src/lib/spreadsheet-generator.ts`.

## TODO / Improvement

- UI untuk membuat/mengubah budget belum terlihat, walaupun action `upsertBudget` dan table `budget` sudah ada (fitur budget kalender lama tidak dirender di antarmuka rekap baru sesuai D11).
- Perombakan fitur rekap telah selesai penuh sampai Fase 12 (tercakup suite E2E Playwright `tests/e2e/rekap-flow.spec.ts` dan inventarisasi pembersihan legacy).

