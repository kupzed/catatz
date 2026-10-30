# Changelog

Format mengikuti Keep a Changelog sederhana.

## [Unreleased]

### Added

- **Dukungan Bilingual Penuh (Bahasa Indonesia & English / i18n)**:
  - Arsitektur lokalisasi internal berbasis kamus TypeScript terstruktur di `src/i18n/` tanpa library eksternal (`next-intl`, `react-intl`, atau `i18next`).
  - Kamus terjemahan lengkap (`src/i18n/dictionaries/id.ts` & `src/i18n/dictionaries/en.ts`) yang mencakup seluruh halaman transaksi, rekening, rekap/laporan, hutang/piutang, kategori, pengaturan, dan auth.
  - Server-first resolution melalui `getLocale()` dari kolom preferensi `user_preferences.language` (default: `'id'`).
  - React Context provider `DictionaryProvider` dan hook `useTranslation()` untuk rendering instan pada seluruh Client Components.
  - Migrasi database additive `017-user-preferences-language.sql` yang menambahkan kolom `language` pada tabel `user_preferences`.
  - Schema validasi Zod form menggunakan pattern pabrik `get<Entity>Schema(dict)` untuk error validasi dinamis dalam bahasa aktif.
  - PWA manifest, offline fallback page (`offline.html`), offline indicator, dan dynamic HTML metadata bilingual (`<html lang={locale}>`).
  - Selector bahasa terintegrasi di `/settings` (Preferensi Sistem) dengan optimistic update dan server boundary refresh.

---

## [1.3.0] — 2026-10-22

### Added

- **Perombakan Kategori & Workspace Detail Kategori (`/categories` & `/categories/[id]`)**:
  - Migrasi database `016-user-owned-categories.sql`: mengalihkan kategori sistem global menjadi milik masing-masing pengguna dengan RLS terisolasi.
  - Pemetaan ulang aman data transaksi, budget, dan recurring transactions ke kategori milik pengguna.
  - Halaman workspace `/categories/[id]` dengan metrik finansial terpadu (total transaksi, total nominal, rata-rata nominal, filter tanggal, dan paginasi).
  - Fitur penguncian kategori otomatis (*locked category*) dan validasi tipe transaksi pada dialog transaksi yang dibuka dari detail kategori.
- **Perombakan Total Sistem Hutang & Piutang (`/debts` & `/debts/[id]`)**:
  - Migrasi database `015-hutang-piutang-revamp.sql`: mendukung pencairan pinjaman bertahap (*multi-disbursement*) dan pembayaran lebih (*overpayment*).
  - Penambahan status lunas manual (`is_lunas_manual`) dan pembaruan trigger dinamis perhitungan sisa hutang `update_sisa_hutang()`.
  - Halaman workspace kontak `/debts/[id]` dengan riwayat kronologis pembayaran/pinjaman serta kartu ringkasan kekayaan bersih (*net worth*) pada indeks `/debts`.
- **Halaman Workspace Detail Rekening (`/wallets/[id]`)**:
  - Metrik arus kas rekening (saldo riil, pemasukan, pengeluaran, net flow, dan proporsi terhadap total saldo).
  - Fitur penguncian konteks rekening dan tombol tukar arah transfer (*switch transfer direction*) pada dialog transfer.
  - Paginasi query agregasi pemakaian rekening di `rekening-action.ts` untuk melewati limit 1.000 baris PostgREST.
- **Drawer Detail Transaksi & Paginasi Server (`/transactions`)**:
  - Paginasi server berbasis offset/limit untuk menangani puluhan ribu baris transaksi tanpa batasan PostgREST.
  - Komponen `TransaksiDetailSheet` dengan drawer interaktif, tombol salin ringkasan ke clipboard, serta shortcut edit dan hapus.
  - Perlindungan transfer timbal-balik (*mutual protection & auto-switch*) untuk mencegah pemilihan rekening asal dan tujuan yang sama.
  - Toolbar filter satu baris dan sheet filter layar penuh pada perangkat mobile.

### Changed

- Pembaruan paket inti aplikasi: Next.js `16.4.2`, React `19.3.1`, React DOM `19.3.1`, Serwist `9.5.13`, Supabase JS `2.118.0`, Supabase SSR `0.12.7`, dan TanStack Query `5.104.5`.
- Upgrade framework pengujian ke Vitest `5.0.5`, `@testing-library/jest-dom` `7.0.1`, dan `jsdom` `30.1.3`.
- Ekspansi test suite dari 190 tests (15 file) menjadi 293 tests (28 file) dengan line coverage 97.2%.
- Regenerasi file bundle service worker `public/sw.js`.

### Fixed

- Mengatasi kendala truncate teks transaksi pada perangkat layar kecil.
- Perbaikan layout toolbar filter dan pill rentang tanggal kustom.
- Perbaikan auto-close dialog dan sinkronisasi state saat create/edit kategori dan rekening.

---

## [1.2.0] — 2026-10-15

### Added

- **Perombakan Menyeluruh Rekap Keuangan (`/reports`)**:
  - Tiga tab navigasi utama tersinkronisasi URL (`?tab=`): Realtime (dengan grafik Donut Chart Recharts), Bulanan, dan Custom.
  - Dialog pengaturan siklus rekap: tanggal cut-off dinamis (1–31) dan toggle Saldo Akumulasi tersimpan pada tabel `user_preferences`.
  - Halaman detail rekap periode (`/reports/detail`) tervalidasi Zod dengan metrik finansial terpadu, arus kas hutang/piutang riil, rekonsiliasi saldo awal/akhir mundur (*historical ledger rollback balance engine*), dan grafik proporsi saldo antar rekening (`proporsi-saldo-chart.tsx`).
  - Rincian breakdown transaksi interaktif (sub-tab Kategori & Judul) dengan drawer/accordion drill-down transaksi individual per item.
  - Tab Periode Kustom dengan kemampuan CRUD penuh (dialog tambah/edit serta hapus via `ConfirmDialog`).
  - Pure calculation engines terisolasi: `rekap-period.ts`, `rekap-balance.ts`, dan `rekap-aggregate.ts`.
- **Peningkatan Rekening & Keamanan Transaksi**:
  - Breakdown granular transaksi finansial (pemasukan, pengeluaran, transfer masuk, transfer keluar, dan hutang/piutang terkait) pada dialog konfirmasi hapus rekening untuk mencegah kehilangan data secara tidak sengaja.
- **Pengujian & CI**:
  - Ekspansi unit test Vitest menjadi 190 tests di 15 file test yang mencakup engine rekap, validasi, dan komponen UI.

### Changed

- Migrasi seluruh 5 route dashboard Next.js App Router dari Bahasa Indonesia ke Bahasa Inggris untuk standarisasi konvensi URL path:
  - `/kategori` -> `/categories`
  - `/hutang` -> `/debts`
  - `/rekap` -> `/reports`
  - `/rekening` -> `/wallets`
  - `/transaksi` -> `/transactions`
- Menambahkan HTTP 307 temporary redirects di `next.config.ts` untuk backward compatibility semua URL lama ke URL baru.
- Memperbarui revalidasi Server Actions, breadcrumb keys, user preferences, PWA shortcuts (`public/manifest.json`), dan offline fallback link (`public/offline.html`).
- Dekomposisi komponen monolitik `TransaksiDialog` (747 baris) menjadi 6 sub-komponen modular (`use-transaksi-dialog.ts`, `transaksi-form-fields.tsx`, `transaksi-tipe-tabs.tsx`, `transaksi-dialog-header.tsx`, `transaksi-dialog-footer.tsx`, `transaksi-ai-section.tsx`).
- Penyederhanaan workflow CI di `.github/workflows/quality.yml` dengan memfokuskan pada ESLint, Typecheck, dan Vitest unit test.

### Fixed

- Perhitungan transaksi transfer dua arah (*bidirectional*) pada filter transaksi rekening dan deteksi penggunaan rekening (`rekening-action.ts`).
- Reset otomatis pilihan kategori saat berpindah ke tipe transaksi Transfer.
- Sinkronisasi URL query params tab rekap dan perbaikan tampilan judul pada breakdown realtime.

### Removed

- Suite pengujian Playwright E2E dan konfigurasi terkait untuk mengeliminasi kelemahan timeout/flakiness pada runner headless CI.

---

## [1.1.0] — 2026-08-06

### Added

- Multi-select combo filter pada halaman transaksi untuk Tipe, Rekening, dan Kategori.
- Komponen reusable `ClearableInput` dan tombol pembersih pada `NominalInput` di seluruh dialog dashboard.
- Dokumentasi `SECURITY.md`.

### Changed

- Standarisasi tinggi trigger filter transaksi menjadi `h-12` sesuai `DESIGN.md`.

### Fixed

- Penanganan double-click pada tombol clear input nominal/teks.
- Word wrapping pada tampilan voice transcript layar kecil.
- Guard `event.source` pada pesan service worker (CWE-20, CWE-940).
- Sanitasi protokol URL avatar (CWE-79, CWE-116).

---

## [1.0.0] — 2026-06-19

First public release.

### Added

- Initial project documentation.
- Documentation index in `docs/README.md`.
- Project overview documentation.
- Architecture documentation.
- Folder structure documentation.
- Local setup documentation.
- Environment variables documentation.
- Database schema documentation.
- Database migrations documentation.
- Supabase Auth documentation.
- RLS policies documentation.
- Server Actions and API documentation.
- Frontend guidelines.
- Feature documentation for transaksi, rekening, kategori, hutang/piutang, laporan, settings, and auth.
- Vercel deployment checklist.
- PWA documentation.
- Security checklist.
- Troubleshooting guide.
- AI development rules.
- Repository-level Codex workflow instructions in `AGENTS.md`.
- Conventional Commit guidance for Codex task summaries.
- Technical commit message body requirements for Codex final responses.
- Documentation references for the Codex operating instructions.
- Root `.env.example`.
- `DESIGN.md` — Coinbase institutional design system reference (colors, typography, components, spacing).
- `CHANGELOG.md` — root-level release notes consumed by GitHub Actions release workflow.
- `.github/FUNDING.yml` — GitHub Sponsors and PayPal support links.

### Changed

- Full UI redesign mengikuti `DESIGN.md` (Coinbase institutional style):
  - Design tokens (CSS variables) di `globals.css`: Coinbase Blue primary, surface tiers, semantic colors, Inter font, Geist Mono.
  - UI primitives (`button`, `input`, `select`, `card`, `badge`, `dialog`): pill CTA, rounded-card container, rounded-input form, flat shadow.
  - Navigation: sidebar institutional style, active state left-border, brand blue hemat.
  - Dashboard pages (transaksi, rekening, rekap, hutang, kategori, settings, auth): dark hero card, asset-row pattern, mono font pada nominal.
  - Auth pages: clean light canvas, card `rounded-[24px]`, pill CTA.
- `AGENTS.md` diperbarui dengan **Design Contract** — setiap perubahan UI wajib mengikuti `DESIGN.md`.
- `docs/frontend-guidelines.md` diperbarui secara komprehensif dengan token warna, typography hierarchy, shape rules, pola komponen, dan checklist review UI.
- `docs/github-workflows.md` diperbarui untuk mencerminkan workflow `release.yml` aktual: tanpa build step, menggunakan `CHANGELOG.md` sebagai body release, dan dokumentasi `FUNDING.yml`.
- `package.json` version bump ke `1.0.0`.
