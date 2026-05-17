# Frontend Guidelines

## Bahasa UI

- UI user-facing menggunakan Bahasa Indonesia.
- Istilah teknis boleh dipakai jika memang lebih jelas, misalnya PWA, export, login, atau server action.
- Error message untuk user harus jelas dan tidak membocorkan detail internal yang sensitif.

## Stack UI

- Styling memakai Tailwind CSS v4.
- Komponen primitive mengikuti shadcn/ui di `src/components/ui`.
- Icon memakai `lucide-react`.
- Theme memakai `next-themes`.
- Toast memakai `sonner`.
- Form memakai `react-hook-form` dan `zod` untuk validasi.

## Aturan Component

- Gunakan Server Component untuk initial data fetching di page.
- Gunakan Client Component untuk interaksi, form, dialog, filter, localStorage, IndexedDB, PWA events, dan browser API.
- Komponen route-specific ditempatkan di `_components` dalam folder route.
- Komponen reusable lintas fitur ditempatkan di `src/components/common` atau `src/components/ui`.
- Jangan memanggil Supabase browser client untuk data privat jika Server Action/Server Component sudah mencukupi.

## Aturan Form

- Setiap form wajib memiliki validasi.
- Gunakan schema Zod di `src/validations` untuk form utama.
- Tampilkan loading/submitting state pada tombol submit.
- Tampilkan error validasi dekat field.
- Untuk action destructive, gunakan `ConfirmDialog`.

## Loading State

Route yang sudah memiliki loading state:

- `/transaksi`: `src/app/(dashboard)/transaksi/loading.tsx`
- `/rekening`: `src/app/(dashboard)/rekening/loading.tsx`
- `/rekap`: `src/app/(dashboard)/rekap/loading.tsx`
- `/hutang`: `src/app/(dashboard)/hutang/loading.tsx`

Gunakan `Skeleton` untuk loading route/data yang membutuhkan waktu.

## Empty State

- Empty state harus menjelaskan kondisi data kosong dan memberi aksi berikutnya jika relevan.
- Untuk transaksi/rekening/kategori/hutang, empty state sebaiknya mengarahkan user membuat data pertama.

## Error State

- Root error boundary route ada di `src/app/error.tsx`.
- 404 page ada di `src/app/not-found.tsx`.
- App-level error boundary ada di `src/components/error-boundary.tsx`.
- Error action ditampilkan dengan toast.
- Jangan tampilkan stack trace, SQL detail, atau secret di UI.

## Responsive Design

- Dashboard memakai sidebar collapsible.
- Mobile memakai sidebar trigger dan layout safe-area.
- Header dashboard sticky dan memperhitungkan `env(safe-area-inset-top)`.
- Main content memperhitungkan `env(safe-area-inset-bottom)`.
- Settings memakai sidebar nav desktop dan tab strip mobile.

## Format Angka dan Tanggal

- Mata uang gunakan Rupiah (`IDR`) via `formatRupiah`.
- Locale tanggal memakai Bahasa Indonesia via `date-fns/locale/id`.
- Helper utama ada di `src/lib/utils.ts`:
  - `formatRupiah`
  - `parseNominal`
  - `formatTanggal`
  - `todayISODate`
  - `currentTime`
  - `percentage`

## Warna dan Layout

- Warna komponen mengikuti token Tailwind/shadcn seperti `bg-background`, `text-foreground`, `muted`, `card`, dan `border`.
- Rekening dan kategori memiliki warna custom berbentuk hex.
- Hindari hardcoded style baru jika sudah ada token atau pattern lokal.
- Gunakan spacing yang konsisten dengan halaman dashboard saat ini: container `max-w-5xl`, `space-y-6`, dan grid responsive.

## PWA dan Offline UI

- Indikator offline global ada di `src/components/pwa/offline-indicator.tsx`.
- Install banner dan iOS install guide berada di `src/components/pwa`.
- Offline queue transaksi memakai IndexedDB melalui `src/lib/offline-queue.ts`.
- UI transaksi menampilkan pending state untuk transaksi yang menunggu sinkronisasi.

## Accessibility

- Tombol icon perlu `aria-label` atau tooltip jika maknanya tidak jelas.
- Input form harus memiliki label.
- Dialog konfirmasi harus menyebut konsekuensi aksi.
- Jangan mengunci zoom mobile tanpa review aksesibilitas.
