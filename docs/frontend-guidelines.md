# Frontend Guidelines

> **Sumber kebenaran desain:** [`DESIGN.md`](../DESIGN.md) — baca DESIGN.md sebelum membuat komponen atau halaman baru.  
> Dokumen ini adalah adaptasi DESIGN.md ke implementasi Tailwind CSS v4 + shadcn/ui di codebase CatatZ.

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

## Design System: Coinbase Institutional Style

CatatZ mengikuti desain sistem berbasis Coinbase institutional style yang didefinisikan di `DESIGN.md`.

### Font

| Font | Variable CSS | Gunakan untuk |
|---|---|---|
| **Inter** | `--font-inter` | Semua teks UI — heading, body, label, button |
| **Geist Mono** | `--font-geist-mono` | Nominal keuangan, angka tabular, kode |

- Semua nominal keuangan (Rp, persentase, angka finansial) **WAJIB** menggunakan `font-mono`.
- Inter diimport via `next/font/google` dan di-set sebagai `font-sans` di `globals.css`.
- Inter menggunakan `font-feature-settings: "cv02", "cv03", "cv04", "cv11"` untuk rendering mirip Coinbase.
- `font-variant-numeric: lining-nums tabular-nums` aktif secara global.

### Hierarki Tipografi

| Token | Class Tailwind | Gunakan untuk |
|---|---|---|
| `title-lg` (32px/400) | `text-[32px] font-normal tracking-[-0.4px]` | `h1` page title utama — **jangan `font-bold`** |
| `title-md` (18px/600) | `text-lg font-semibold` | Section title, card title besar |
| `title-sm` (16px/600) | `text-base font-semibold` | Sub-section, list label |
| `body-md` (16px/400) | `text-base` | Default body text |
| `body-sm` (14px/400) | `text-sm` | Secondary info, label form |
| `caption` (12px/600) | `text-xs font-semibold` | Badge label, uppercase caption |
| `number-display` | `font-mono text-sm font-semibold` | Nominal keuangan kecil |
| `number-large` | `font-mono text-[44px] font-normal` | Saldo besar, hero number |

### Token Warna

Semua token sudah tersedia di `globals.css` dan dapat dipakai langsung via Tailwind:

| Token Tailwind | Nilai light | Nilai dark | Gunakan untuk |
|---|---|---|---|
| `bg-background` | #ffffff | #0a0b0d | Page background |
| `bg-card` | #ffffff | #16181c | Card default |
| `bg-surface-soft` | #f7f7f7 | #1c1f26 | Alternating band, muted bg |
| `bg-surface-strong` | #eef0f3 | #252830 | Secondary button bg, badge, icon plate |
| `bg-surface-dark` | #0a0b0d | #0a0b0d | Dark hero card (light mode) |
| `bg-surface-dark-elevated` | #16181c | #16181c | Card di atas dark background |
| `bg-primary` | #0052ff | #0052ff | CTA utama, active nav |
| `text-foreground` | #0a0b0d | #ffffff | Text utama |
| `text-muted-foreground` | #7c828a | #a8acb3 | Text sekunder, label |
| `text-semantic-up` | #05b169 | #05b169 | Pemasukan / nilai positif |
| `text-semantic-down` | #cf202f | #cf202f | Pengeluaran / nilai negatif |
| `border-hairline` | #dee1e6 | rgba(255,255,255,0.12) | Default border/divider |

**Aturan warna:**
- `bg-primary` (Coinbase Blue) hanya untuk CTA utama, active nav, inline accent. **Gunakan secukupnya.**
- `text-semantic-up` dan `text-semantic-down` **text-only** — jangan pakai sebagai background button.
- Dark card di light mode: `bg-surface-dark`. Di dark mode: `dark:bg-surface-dark-elevated` agar kontras terlihat.

### Border Radius

| Token | Nilai | Gunakan untuk |
|---|---|---|
| `rounded-full` / `rounded-pill` | 100px | Semua CTA button, badge, avatar |
| `rounded-card` | 24px | Card container, dialog, modal |
| `rounded-input` | 12px | Form input, select, textarea |
| `rounded-[8px]` | 8px | Dropdown item, compact row |
| `rounded-full` | 9999px | Avatar, icon circle |

**Shape rules:**
- **Semua CTA button WAJIB `rounded-full`.** Tidak ada pengecualian.
- Card dan container pakai `rounded-card` (24px) atau `rounded-[24px]`.
- Input dan select pakai `rounded-input` (12px).

### Elevation & Shadow

| Level | Treatment | Gunakan untuk |
|---|---|---|
| Flat | Tidak ada shadow | 80% surface — default state |
| Hairline | `border border-hairline` | Card outline pada background putih |
| Hover shadow | `hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]` | Hover state card |
| Dark separator | `ring-1 ring-white/5` | Visual separation dark card dari dark background |

**Jangan gunakan `shadow-md`, `shadow-lg` pada default state.** Satu shadow tier saja saat hover.

## Aturan Component

- Gunakan Server Component untuk initial data fetching di page.
- Gunakan Client Component untuk interaksi, form, dialog, filter, localStorage, IndexedDB, PWA events, dan browser API.
- Komponen route-specific ditempatkan di `_components` dalam folder route.
- Komponen reusable lintas fitur ditempatkan di `src/components/common` atau `src/components/ui`.
- Jangan memanggil Supabase browser client untuk data privat jika Server Action/Server Component sudah mencukupi.

## Pola Halaman Dashboard

Setiap halaman dashboard mengikuti struktur konsisten berikut:

```tsx
<div className="w-full max-w-5xl mx-auto space-y-6">
  {/* 1. Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-[32px] font-normal tracking-[-0.4px] text-foreground leading-tight">
        Judul Halaman
      </h1>
      <p className="text-sm text-muted-foreground">Subtitle singkat</p>
    </div>
    <Button className="bg-primary hover:bg-[#003ecc] text-white rounded-full font-semibold gap-2">
      <Plus className="h-4 w-4" />
      Tambah Item
    </Button>
  </div>

  {/* 2. Hero/summary card — opsional */}
  <div className="rounded-card bg-surface-dark dark:bg-surface-dark-elevated text-white p-8 ring-1 ring-white/5">
    {/* Angka besar, highlight metrics */}
  </div>

  {/* 3. Filter & search */}
  {/* 4. Data list / table */}
</div>
```

## Pola Komponen Kunci

### Button
```tsx
// Primary CTA
<Button className="bg-primary hover:bg-[#003ecc] text-white rounded-full font-semibold h-11 px-5">
  Tambah Transaksi
</Button>

// Secondary
<Button variant="secondary" className="rounded-full">
  Batal
</Button>

// Destructive
<Button className="bg-semantic-down hover:bg-semantic-down/90 text-white rounded-full">
  Hapus
</Button>
```

### Card
```tsx
// Default card
<div className="rounded-card border border-hairline bg-card p-6">
  {/* content */}
</div>

// Dark hero card (light dan dark mode berbeda)
<div className="rounded-card bg-surface-dark dark:bg-surface-dark-elevated text-white p-8 ring-1 ring-white/5">
  {/* hero content */}
</div>
```

### Nominal Keuangan
```tsx
// Wajib font-mono
<p className="font-mono text-base font-semibold text-semantic-up">
  +{formatRupiah(totalIncome)}
</p>

// Angka besar
<p className="font-mono text-[44px] font-normal tracking-[-1px] text-white leading-none">
  {formatRupiah(saldo)}
</p>
```

### Badge / Status
```tsx
<Badge className="rounded-full bg-surface-strong text-muted-foreground text-xs">
  Status
</Badge>

// Semantic
<Badge className="rounded-full bg-semantic-up/10 text-semantic-up border-semantic-up/20">
  Lunas
</Badge>
```

### Input & Form
```tsx
// Input standar — h-12 rounded-input sudah ada di default src/components/ui/input.tsx
<Input placeholder="Cari..." className="pl-9" />

// Select standar
<SelectTrigger className="text-foreground border-hairline">
  <SelectValue />
</SelectTrigger>

// RekeningSelect — komponen reusable pemilihan rekening dengan desain dot warna dan jenis rekening
<RekeningSelect
  rekening={rekening}
  value={value}
  onValueChange={onValueChange}
  placeholder="Pilih rekening"
  includeNone={true} // opsional: jika true, menyertakan pilihan "Tanpa rekening"
/>

// NominalInput mengikuti separator ribuan dari SystemPreferenceProvider
<NominalInput value={value} onValueChange={onValueChange} />

// Input waktu tetap memakai native input; browser menentukan picker 12h/24h
<Input type="time" value={value} onChange={onChange} />
```

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
- Drawer mobile memberi padding `safe-area-inset-top`, `safe-area-inset-bottom`, dan inset horizontal sesuai sisi drawer agar header/footer tidak masuk ke area sistem perangkat.
- Dialog mobile memakai `100dvh`, batas tinggi yang dikurangi safe area, `overscroll-contain`, dan padding lebih ringkas. Mulai breakpoint `sm`, dialog kembali terpusat dengan padding desktop.
- Settings memakai sidebar nav desktop dan tab strip mobile.

**Aturan responsive untuk angka dan teks:**
- Angka nominal di grid 3-kolom (mobile): gunakan `text-xs sm:text-sm`, `break-all`, `min-w-0`.
- Teks panjang (email, nama): gunakan `truncate` dan pastikan container punya `min-w-0 overflow-hidden`.
- Padding card: `px-3 sm:px-6` agar lebih lega di mobile.
- Filter yang memiliki tiga kontrol menggunakan grid dua kolom pada layar kecil; kontrol terpanjang dapat memakai `col-span-2`, lalu kembali menjadi tiga kolom mulai `sm`.
- Kelompok action yang wajib selalu terlihat memakai grid kompak tanpa horizontal scroll. Tombol ikon tetap wajib memiliki nama aksesibel dan touch target minimum 44px.

### Breakpoint Reference (DESIGN.md)

| Breakpoint | Width | Perubahan utama |
|---|---|---|
| Mobile | < 640px | 1-column, font scale turun, padding kecil |
| Tablet | 640–1024px | 2-column grid, font medium |
| Desktop | > 1024px | Full layout, sidebar expanded |

## Format Angka, Tanggal, dan Waktu

- Mata uang tetap Rupiah (`IDR`).
- Preferensi user didefinisikan di `src/lib/user-preferences.ts`.
- Dashboard memakai `SystemPreferenceProvider` dari `src/providers/system-preference-provider.tsx`.
- Di Client Component dashboard, ambil formatter dari `useSystemPreferences()` agar tampilan mengikuti `number_format`, `date_format`, `show_decimal_places`, dan `time_format`.
- Di Server Action/generator file, panggil helper `src/lib/utils.ts` dengan argumen `preferences`.
- `formatRupiah(value, compact?, preferences?)`:
  - Tanpa `preferences`, default tetap `id-ID` tanpa 2 angka desimal.
  - Nominal penuh mengikuti `number_format` dan `show_decimal_places`.
  - Nominal compact tetap ringkas dan tidak dipaksa 2 angka desimal.
- `formatNumber(value, preferences?)` dipakai untuk export CSV ketika angka harus tanpa simbol mata uang.
- `formatTanggal(date, fmt?, preferences?)` memilih locale `id-ID` atau `en-US`.
- `formatWaktu(value, preferences?)` memilih tampilan `14:30` atau `02:30 PM`.
- Input waktu transaksi, hutang, dan cicilan tetap memakai native `Input type="time"` agar picker browser/OS bekerja normal. Untuk layout tanggal/waktu dalam dialog, gunakan satu baris `grid-cols-[3fr_1fr]`.
- `NominalInput` di `src/components/common/nominal-input.tsx` mengikuti separator ribuan/desimal dari `number_format`, menerima koma atau titik saat decimal aktif, tetapi tetap mengirim angka normal ke form/action.
- Helper utama ada di `src/lib/utils.ts`:
  - `formatRupiah`
  - `formatNumber`
  - `getRupiahSpreadsheetFormat`
  - `parseNominal`
  - `formatTanggal`
  - `formatWaktu`
  - `todayISODate`
  - `currentTime`
  - `percentage`

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
- Touch target minimum 44px (WCAG AAA) — pastikan button cukup tinggi di mobile.

## Dark Mode

- Theme dikontrol via `next-themes` dengan class strategy (`class="dark"`).
- Semua token warna sudah punya dark mode variant di `globals.css`.
- Dark card (`bg-surface-dark`) di dark mode harus pakai `dark:bg-surface-dark-elevated` agar kontras terlihat dari page background.
- Jangan gunakan warna hardcoded yang tidak mengikuti token — akan broken di dark mode.

## Checklist Review UI

Sebelum task UI dianggap selesai:

- [ ] CTA button semua `rounded-full`
- [ ] Angka keuangan semua `font-mono`
- [ ] Tidak ada shadow berlebihan di default state
- [ ] Warna menggunakan token (tidak hardcode hex baru)
- [ ] Dark mode dan light mode sudah divisualisasikan berbeda
- [ ] Tidak ada teks truncate/overflow di mobile
- [ ] Responsive dicek di ≤640px dan ≥1024px
- [ ] Touch target ≥44px di mobile
