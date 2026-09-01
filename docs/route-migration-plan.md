# Route Migration Plan: Indonesian to English Dashboard Routes

Dokumen ini adalah **sumber kebenaran tunggal (Single Source of Truth)** untuk rencana dan eksekusi migrasi 5 route dashboard aplikasi CatatZ dari Bahasa Indonesia ke Bahasa Inggris.

---

## 1. Ground Rules

Wajib dipatuhi oleh setiap agent AI di seluruh fase migrasi:

- **GR-1 (Scope Isolasi):** Scope migrasi **HANYA** string path URL dan nama folder route. Kata `"kategori"`, `"hutang"`, `"rekening"`, `"rekap"`, `"transaksi"` juga dipakai sebagai nama tabel database, tipe TypeScript, nama file action, nama komponen, nama hook, nama migration, dan nama fungsi — **SEMUA ITU TIDAK BOLEH DISENTUH**, bahkan di fase-fase implementasi nanti. Hanya `href`, `revalidatePath()`, redirect target, key pada map breadcrumb, value pada array/select/manifest, dan nama folder route yang berubah.
- **GR-2 (Routing Berbasis Folder):** Next.js 16 App Router memakai routing berbasis struktur folder (`src/app/(dashboard)/<nama>/`).
- **GR-3 (Pemisahan URL vs Display Text):** String `href`, `start_url`, `revalidatePath`, redirect target, dan value preferensi berubah ke Bahasa Inggris. Teks yang tampil ke user (label menu, breadcrumb display text, nama shortcut PWA, dialog title, tombol) **tetap Bahasa Indonesia**.
- **GR-4 (Proxy & Middleware Independence):** `src/proxy.ts` dan `src/configs/supabase/middleware.ts` **TIDAK** melakukan hardcode nama route dashboard manapun. Logikanya hanya mendeteksi auth route publik (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/`), sisanya dianggap protected route. Terverifikasi aman dan tidak perlu diubah.
- **GR-5 (Backward Compatibility Redirects):** Akan ditambahkan redirect permanen (308) dari path lama ke path baru di `next.config.ts` untuk menjaga bookmark, link lama, atau cache user.
- **GR-6 (User Preferences Fallback & Auto-Migration):** Kolom `default_landing_page` di tabel database `user_preferences` mungkin berisi nilai path lama bagi user existing. `src/lib/user-preferences.ts` (`normalizeUserPreferences`) memiliki mekanisme fallback otomatis (`isOneOf` check). Pada implementasinya nanti, disarankan menambahkan backward-compatibility mapping (misal: `/rekening` otomatis di-normalize ke `/wallets`) sebelum fallback ke default (`/transactions`).
- **GR-7 (Immutability of Historical Data & Old Migrations):** Jangan pernah mengedit file migration lama di `src/migrations/001` s/d `013`, dan jangan menulis ulang riwayat historis di `CHANGELOG.md` maupun `docs/changelog.md`.
- **GR-8 (Stateless Execution Sessions):** Setiap fase migrasi dijalankan dalam sesi AI agent terpisah tanpa memori bersama. Dokumen `docs/route-migration-plan.md` ini adalah acuan instruksi dan status resmi antar sesi.
- **GR-9 (Branching & Phase Commits):** Seluruh pekerjaan dikerjakan di git branch khusus (misal `refactor/route-migration-en`) dan wajib membuat commit Git per fase menggunakan konvensi Conventional Commits.

---

## 2. Pemetaan Route (Mapping Table)

| Route Lama (ID) | Route Baru (EN) | Lokasi Folder Route | Label UI (Tetap Bahasa Indonesia) |
| --- | --- | --- | --- |
| `/transaksi` | `/transactions` | `src/app/(dashboard)/transaksi` -> `src/app/(dashboard)/transactions` | Transaksi |
| `/rekening` | `/wallets` | `src/app/(dashboard)/rekening` -> `src/app/(dashboard)/wallets` | Rekening |
| `/rekap` | `/reports` | `src/app/(dashboard)/rekap` -> `src/app/(dashboard)/reports` | Rekap |
| `/hutang` | `/debts` | `src/app/(dashboard)/hutang` -> `src/app/(dashboard)/debts` | Hutang |
| `/kategori` | `/categories` | `src/app/(dashboard)/kategori` -> `src/app/(dashboard)/categories` | Kategori |

---

## 3. Tabel Referensi File Bersama (Shared Files)

Tabel ini merangkum file-file lintas route yang memuat lebih dari satu referensi path atau menjadi infrastruktur bersama, apa yang berubah, dan fase mana yang menyentuhnya.

| File | Apa yang Berubah | Fase yang Menyentuh |
| --- | --- | --- |
| `next.config.ts` | Menambahkan konfigurasi 5 redirects permanen (308) dari path lama ke path baru | Fase 1 |
| `src/lib/user-preferences.ts` | Update `LANDING_PAGE_PREFERENCES` array dan `default_landing_page` ke `/transactions`, serta normalisasi backward-compat path lama | Fase 1 |
| `src/app/(dashboard)/_components/dashboard-breadcrumb.tsx` | Update key pada `ROUTE_NAMES` dari ID ke EN (`transactions`, `wallets`, `reports`, `debts`, `categories`) dengan display text tetap Bahasa Indonesia | Fase 1 |
| `src/components/common/app-sidebar.tsx` | Update link navigasi `NAV_ITEMS` (`/transactions`, `/wallets`, `/reports`, `/debts`, `/categories`), logo link `/transactions`, dan tombol CTA `Transaksi baru` (`/transactions?new=true`) | Fase 1 |
| `src/app/(dashboard)/settings/_components/system-preference-section.tsx` | Update `SelectItem` `value` pilihan landing page ke route baru (`/transactions`, `/wallets`, `/reports`, `/debts`, `/categories`) | Fase 1 |
| `public/manifest.json` | Update `start_url` (`/transactions`) dan shortcuts `url` (`/transactions?new=true`, `/reports`, `/wallets`) | Fase 1 |
| `public/offline.html` | Update link navigasi offline (`/transactions`, `/wallets`, `/reports`, `/debts`, `/categories`) | Fase 1 |
| `src/app/not-found.tsx` | Update link CTA kembali `<Link href="/transactions">Ke Transaksi</Link>` | Fase 1 |
| `src/app/auth/callback/route.ts` | Update default fallback route `safeNextPath` dari `/transaksi` ke `/transactions` | Fase 1 |
| `src/actions/auth-action.ts` | Update target callback redirect URL `createAuthCallbackUrl("/transactions")` dan `redirect("/transactions")` | Fase 1 |
| `src/actions/preference-action.ts` | Update target `revalidatePath` untuk `/settings`, `/transactions`, `/wallets`, `/reports`, `/debts` | Fase 1 |
| `src/actions/kategori-action.ts` | Update `revalidatePath("/categories")` dan `revalidatePath("/transactions")` | Fase 2 & Fase 6 |
| `src/actions/hutang-action.ts` | Update `revalidatePath("/debts")`, `revalidatePath("/wallets")`, `revalidatePath("/reports")` | Fase 3, 4, 5 |
| `src/actions/rekening-action.ts` | Update `revalidatePath("/wallets")`, `revalidatePath("/transactions")`, `revalidatePath("/reports")` | Fase 4, 5, 6 |
| `src/actions/transaksi-action.ts` | Update `revalidatePath("/transactions")`, `revalidatePath("/wallets")`, `revalidatePath("/reports")` | Fase 4, 5, 6 |
| `src/app/(dashboard)/transaksi/_components/transaksi-page-client.tsx` | Update `router.replace("/transactions", { scroll: false })` saat modal add dibuka via query param | Fase 6 |
| `tests/e2e/mobile-layout.spec.ts` | Update asersi URL `expect(page).toHaveURL(/\/transactions$/)` dan navigasi `page.goto("/debts")` | Fase 3 & Fase 6 |
| `tests/e2e/mock-supabase.mjs` | Update mock `default_landing_page` ke `"/transactions"` | Fase 1 |

---

## 4. Status Fase Migrasi

Bagian ini memuat checklist status untuk seluruh 8 fase migrasi. Setiap fase dijalankan pada sesi agent terpisah dan dicentang manual setelah verifikasi fase tersebut tuntas.

- [ ] **Fase 1: Foundation & Shared Setup**
  - [ ] Tambahkan redirects di `next.config.ts` (`/transaksi` -> `/transactions`, dst.)
  - [ ] Update `src/lib/user-preferences.ts` (array `LANDING_PAGE_PREFERENCES`, default landing page, backward-compat mapper)
  - [ ] Update `src/app/(dashboard)/_components/dashboard-breadcrumb.tsx` (`ROUTE_NAMES` keys)
  - [ ] Update `src/components/common/app-sidebar.tsx` (`NAV_ITEMS`, CTA link, brand logo link)
  - [ ] Update `src/app/(dashboard)/settings/_components/system-preference-section.tsx` (`SelectItem` values)
  - [ ] Update `public/manifest.json` (`start_url`, shortcuts `url`)
  - [ ] Update `public/offline.html` (anchor hrefs)
  - [ ] Update `src/app/not-found.tsx` (CTA link)
  - [ ] Update `src/app/auth/callback/route.ts` & `src/actions/auth-action.ts`
  - [ ] Update `src/actions/preference-action.ts`
  - [ ] Update `tests/e2e/mock-supabase.mjs`
  - [ ] Validasi build & lint quick check
- [x] **Fase 2: Migrasi Route Kategori -> Categories**
  - [x] Rename folder `src/app/(dashboard)/kategori` -> `src/app/(dashboard)/categories`
  - [x] Update `revalidatePath("/categories")` di `src/actions/kategori-action.ts`
  - [x] Update `next.config.ts` redirects (`/kategori/:path*` -> `/categories/:path*`)
  - [x] Update `NAV_ITEMS` di `src/components/common/app-sidebar.tsx`
  - [x] Update `ROUTE_NAMES` di `src/app/(dashboard)/_components/dashboard-breadcrumb.tsx`
  - [x] Update `LANDING_PAGE_PREFERENCES` di `src/lib/user-preferences.ts`
  - [x] Update `SelectItem` di `src/app/(dashboard)/settings/_components/system-preference-section.tsx`
  - [x] Update `public/offline.html`
  - [x] Update `docs/features/kategori.md` & `docs/folder-structure.md`
  - [x] Validasi fungsionalitas kategori & quick check (typecheck, lint, build)
- [x] **Fase 3: Migrasi Route Hutang -> Debts**
  - [x] Rename folder `src/app/(dashboard)/hutang` -> `src/app/(dashboard)/debts`
  - [x] Update `revalidatePath("/debts")` di `src/actions/hutang-action.ts` & `src/actions/preference-action.ts`
  - [x] Update `next.config.ts` redirects (`/hutang/:path*` -> `/debts/:path*`)
  - [x] Update `NAV_ITEMS` di `src/components/common/app-sidebar.tsx`
  - [x] Update `ROUTE_NAMES` di `src/app/(dashboard)/_components/dashboard-breadcrumb.tsx`
  - [x] Update `LANDING_PAGE_PREFERENCES` di `src/lib/user-preferences.ts`
  - [x] Update `SelectItem` di `src/app/(dashboard)/settings/_components/system-preference-section.tsx`
  - [x] Update `public/offline.html`
  - [x] Update `docs/features/hutang-piutang.md` & `docs/folder-structure.md`
  - [x] Validasi fungsionalitas hutang/piutang & quick check (typecheck, lint, build)
- [x] **Fase 4: Migrasi Route Rekap -> Reports**
  - [x] Rename folder `src/app/(dashboard)/rekap` -> `src/app/(dashboard)/reports`
  - [x] Update `revalidatePath("/reports")` di `src/actions/transaksi-action.ts`, `rekening-action.ts`, `hutang-action.ts`, `preference-action.ts`
  - [x] Update `next.config.ts` redirects (`/rekap/:path*` -> `/reports/:path*`)
  - [x] Update `NAV_ITEMS` di `src/components/common/app-sidebar.tsx`
  - [x] Update `ROUTE_NAMES` di `src/app/(dashboard)/_components/dashboard-breadcrumb.tsx`
  - [x] Update `LANDING_PAGE_PREFERENCES` di `src/lib/user-preferences.ts`
  - [x] Update `SelectItem` di `src/app/(dashboard)/settings/_components/system-preference-section.tsx`
  - [x] Update shortcut url di `public/manifest.json`
  - [x] Update `public/offline.html`
  - [x] Validasi fungsionalitas laporan rekap & quick check (typecheck, lint, build)
- [x] **Fase 5: Migrasi Route Rekening -> Wallets**
  - [x] Rename folder `src/app/(dashboard)/rekening` -> `src/app/(dashboard)/wallets`
  - [x] Update `revalidatePath("/wallets")` di `src/actions/rekening-action.ts`, `transaksi-action.ts`, `hutang-action.ts`, `preference-action.ts`
  - [x] Update `next.config.ts` redirects (`/rekening/:path*` -> `/wallets/:path*`)
  - [x] Update `NAV_ITEMS` di `src/components/common/app-sidebar.tsx`
  - [x] Update `ROUTE_NAMES` di `src/app/(dashboard)/_components/dashboard-breadcrumb.tsx`
  - [x] Update `LANDING_PAGE_PREFERENCES` di `src/lib/user-preferences.ts`
  - [x] Update `SelectItem` di `src/app/(dashboard)/settings/_components/system-preference-section.tsx`
  - [x] Update shortcut url di `public/manifest.json`
  - [x] Update `public/offline.html`
  - [x] Update `docs/features/rekening.md` & `docs/folder-structure.md`
  - [x] Fungsi `revalidateHutangSaldoPaths()` di `src/actions/hutang-action.ts` sekarang telah lengkap termigrasi seluruhnya (`/debts`, `/wallets`, `/reports`)
- [x] **Fase 6: Migrasi Route Transaksi -> Transactions**
  - [x] Rename folder `src/app/(dashboard)/transaksi` -> `src/app/(dashboard)/transactions`
  - [x] Update `router.replace("/transactions")` di client component
  - [x] Update `revalidatePath("/transactions")` di `transaksi-action.ts`, `rekening-action.ts`, `kategori-action.ts`, `preference-action.ts`
  - [x] Update `createAuthCallbackUrl("/transactions")` dan `redirect("/transactions")` di `auth-action.ts` & `src/app/auth/callback/route.ts`
  - [x] Update `toHaveURL(/\/transactions$/)` di `tests/e2e/mobile-layout.spec.ts` & mock supabase
  - [x] Update `NAV_ITEMS` & CTA link di `src/components/common/app-sidebar.tsx`
  - [x] Update `ROUTE_NAMES` di `src/app/(dashboard)/_components/dashboard-breadcrumb.tsx`
  - [x] Update `LANDING_PAGE_PREFERENCES` & `DEFAULT_USER_PREFERENCES` di `src/lib/user-preferences.ts`
  - [x] Update `SelectItem` di `src/app/(dashboard)/settings/_components/system-preference-section.tsx`
  - [x] Update `start_url` & shortcut url di `public/manifest.json`
  - [x] Update `public/offline.html` & `src/app/not-found.tsx`
  - [x] Update `next.config.ts` redirects (`/transaksi/:path*` -> `/transactions/:path*`)
  - [x] Update `docs/features/transaksi.md`, `docs/features/auth.md`, `docs/supabase-auth.md`, `docs/architecture.md`, `docs/folder-structure.md`
- [x] **Fase 7: Sinkronisasi Dokumentasi (`docs/`) & Final Sweep**
  - [x] Update referensi URL route di `docs/features/*`, `docs/architecture.md`, `docs/folder-structure.md`, `docs/server-actions-api.md`, `docs/setup-local.md`, `docs/supabase-auth.md`, `docs/troubleshooting.md`, `docs/overview.md`, `docs/pwa.md`, `docs/database-schema.md`, `docs/frontend-guidelines.md`
  - [x] Tambahkan entry migrasi route di bagian Unreleased pada `docs/changelog.md` tanpa mengubah rilis historis
  - [x] Sweep seluruh repository untuk memastikan tidak ada path lama aktif yang tertinggal
  - [x] Konfirmasi fallback `normalizeUserPreferences` untuk value lama
  - [x] Validasi `next.config.ts` berisi tepat 5 redirects konsisten
  - [x] Jalankan `npm run verify:quick` dan `npm run build`
- [ ] **Fase 8: Verifikasi Menyeluruh & Build/E2E Final Audit**
  - [ ] Jalankan `npm run build` (memverifikasi webpack Serwist & regenerasi `public/sw.js`)
  - [ ] Jalankan `npm run test` (unit tests vitest)
  - [ ] Jalankan `npm run test:e2e` (Playwright tests)
  - [ ] Verifikasi final git diff dan status

---

## 5. Checklist Lengkap Temuan Audit per Route

Bagian ini berisi hasil scanning lengkap seluruh repository untuk literal string 5 route dashboard. Setiap item telah dianalisis apakah merupakan **[PATH URL]** (wajib diganti) atau **[BUKAN PATH URL]** (tidak boleh diganti).


==========================================
=== CHECKLIST TEMUAN ROUTE /KATEGORI (29 item) ===
==========================================
- [x] docs/README.md:26 — `- [Kategori](./features/kategori.md)` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/architecture.md:28 — `- Route group `(dashboard)` memuat route protected seperti `/transaksi`, `/rekening`, `/rekap`, `/hutang`, `/kategori`, dan `/settings`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/kategori.md:13 — `- `/categories`` — [PATH URL, dimigrasikan ke /categories]
- [x] docs/features/kategori.md:17 — `- Page: `src/app/(dashboard)/categories/page.tsx`` — [BUKAN PATH URL, path file folder route di-update ke categories]
- [x] docs/features/kategori.md:18 — `- Client page: `src/app/(dashboard)/categories/_components/kategori-page-client.tsx`` — [BUKAN PATH URL, path file folder route di-update ke categories]
- [x] docs/features/kategori.md:19 — `- Dialog: `src/app/(dashboard)/categories/_components/kategori-dialog.tsx`` — [BUKAN PATH URL, path file folder route di-update ke categories]
- [x] docs/features/kategori.md:20 — `- Actions: `src/actions/kategori-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/kategori.md:21 — `- Validation: `src/validations/kategori-validation.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:73 — `- User bisa filter periode, tipe (multi-select), rekening (multi-select), kategori (multi-select), search judul/catatan/kategori, dan sorting.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/folder-structure.md:89 — `/categories            -> kategori` — [PATH URL, routing tree di-update ke /categories]
- [x] docs/frontend-guidelines.md:244 — `- Untuk transaksi/rekening/kategori/hutang, empty state sebaiknya mengarahkan user membuat data pertama.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/overview.md:44 — `- Kategori: `src/app/(dashboard)/categories`, `src/actions/kategori-action.ts`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:345 — `Lokasi: `src/actions/kategori-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:426 — `| "/categories";` — [BUKAN PATH URL, dokumentasi types]
- [x] public/offline.html:231 — `<li><a href="/categories">Kategori</a></li>` — [PATH URL, dimigrasikan ke /categories]
- [x] public/sw.js:1 — bundle build service worker Serwist — [BUKAN PATH URL LANGSUNG, file build service worker serwist hasil kompilasi]
- [x] src/actions/kategori-action.ts:7 — `import { kategoriSchema } from '@/validations/kategori-validation';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/kategori-action.ts:8 — `import type { KategoriSchema } from '@/validations/kategori-validation';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/kategori-action.ts:41 — `revalidatePath('/categories');` — [PATH URL, dimigrasikan ke /categories]
- [x] src/actions/kategori-action.ts:142 — `revalidatePath('/categories');` — [PATH URL, dimigrasikan ke /categories]
- [x] src/actions/kategori-action.ts:198 — `revalidatePath('/categories');` — [PATH URL, dimigrasikan ke /categories]
- [x] src/app/(dashboard)/categories/_components/kategori-dialog.tsx:9 — `} from "@/validations/kategori-validation";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/categories/_components/kategori-dialog.tsx:10 — `import { createKategori, updateKategori } from "@/actions/kategori-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/categories/_components/kategori-page-client.tsx:22 — `import KategoriDialog from "./kategori-dialog";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/categories/_components/kategori-page-client.tsx:23 — `import { deleteKategori } from "@/actions/kategori-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/categories/page.tsx:3 — `import KategoriPageClient from './_components/kategori-page-client';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/settings/_components/system-preference-section.tsx:325 — `<SelectItem value="/categories">Kategori</SelectItem>` — [PATH URL, dimigrasikan ke /categories]
- [x] src/components/common/app-sidebar.tsx:71 — `items: [{ href: "/categories", label: "Kategori", icon: Tags }],` — [PATH URL, dimigrasikan ke /categories]
- [x] src/lib/user-preferences.ts:11 — `"/categories",` — [PATH URL, dimigrasikan ke /categories]

==========================================
=== CHECKLIST TEMUAN ROUTE /HUTANG (55 item) ===
==========================================
- [x] docs/README.md:27 — `- [Hutang/Piutang](./features/hutang-piutang.md)` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/architecture.md:28 — `- Route group `(dashboard)` memuat route protected seperti `/transaksi`, `/rekening`, `/rekap`, `/hutang`, `/kategori`, dan `/settings`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/hutang-piutang.md:13 — `- `/debts`` — [PATH URL, dimigrasikan ke /debts]
- [x] docs/features/hutang-piutang.md:17 — `- Page: `src/app/(dashboard)/debts/page.tsx`` — [BUKAN PATH URL, path file folder route di-update ke debts]
- [x] docs/features/hutang-piutang.md:18 — `- Loading: `src/app/(dashboard)/debts/loading.tsx`` — [BUKAN PATH URL, path file folder route di-update ke debts]
- [x] docs/features/hutang-piutang.md:19 — `- Client page: `src/app/(dashboard)/debts/_components/hutang-page-client.tsx`` — [BUKAN PATH URL, path file folder route di-update ke debts]
- [x] docs/features/hutang-piutang.md:20 — `- Dialog: `src/app/(dashboard)/debts/_components/hutang-dialog.tsx`` — [BUKAN PATH URL, path file folder route di-update ke debts]
- [x] docs/features/hutang-piutang.md:21 — `- Actions: `src/actions/hutang-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/hutang-piutang.md:22 — `- Validation: `src/validations/hutang-validation.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/hutang-piutang.md:23 — `- Types: `src/types/hutang.d.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/folder-structure.md:88 — `/debts                 -> hutang/piutang` — [PATH URL, routing tree di-update ke /debts]
- [x] docs/frontend-guidelines.md:237 — `- `/hutang`: `src/app/(dashboard)/hutang/loading.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/frontend-guidelines.md:244 — `- Untuk transaksi/rekening/kategori/hutang, empty state sebaiknya mengarahkan user membuat data pertama.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/overview.md:45 — `- Hutang/Piutang: `src/app/(dashboard)/debts`, `src/actions/hutang-action.ts`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:363 — `Lokasi: `src/actions/hutang-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:381 — `Catatan: operasi cicilan mengandalkan trigger database untuk memperbarui `sisa_tagihan`, status, dan saldo rekening. UI pelunasan meminta user memilih rekening terlebih dahulu lalu mencatat cicilan sebesar sisa tagihan. Mutasi hutang/piutang dan cicilan merevalidate `/hutang`, `/rekening`, dan `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:425 — `| "/debts"` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:452 — `Revalidate: `/settings`, `/transaksi`, `/rekening`, `/rekap`, `/hutang`, dan `/`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:454 — `Catatan: preferensi format memengaruhi tampilan dashboard dan export, tetapi tidak mengubah kontrak data transaksi/hutang; waktu tetap disimpan sebagai `HH:mm`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] public/offline.html:230 — `<li><a href="/debts">Hutang</a></li>` — [PATH URL, dimigrasikan ke /debts]
- [x] public/sw.js:1 — bundle build service worker Serwist — [BUKAN PATH URL LANGSUNG, file build service worker serwist hasil kompilasi]
- [x] src/actions/hutang-action.ts:12 — `} from '@/types/hutang';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/hutang-action.ts:13 — `import { hutangSchema, cicilanSchema } from '@/validations/hutang-validation';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/hutang-action.ts:18 — `revalidatePath('/debts');` — [PATH URL, dimigrasikan ke /debts]
- [x] src/actions/preference-action.ts:76 — `revalidatePath('/debts');` — [PATH URL, dimigrasikan ke /debts]
- [x] src/actions/rekap-action.ts:4 — `import type { TipeHutang } from '@/types/hutang';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-card.tsx:4 — `import type { Hutang } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-card.tsx:6 — `import { STATUS_BADGE } from "@/constants/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-detail.tsx:3 — `import type { Hutang, HutangCicilan } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-detail.tsx:9 — `import { HutangCicilanItem } from "./hutang-cicilan-item";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-item.tsx:4 — `import type { Hutang, HutangCicilan } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-dialog.tsx:9 — `} from "@/validations/hutang-validation";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-dialog.tsx:10 — `import { createHutang, updateHutang } from "@/actions/hutang-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-dialog.tsx:12 — `import type { Hutang } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-group.tsx:3 — `import type { Hutang } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-group.tsx:9 — `} from "./hutang-card";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-group.tsx:10 — `import { HutangCicilanForm } from "./hutang-cicilan-form";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-group.tsx:11 — `import { HutangCicilanDetail } from "./hutang-cicilan-detail";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-group.tsx:12 — `import { HutangLunasForm } from "./hutang-lunas-form";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-lunas-form.tsx:3 — `import type { Hutang } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-page-client.tsx:4 — `import type { Hutang } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-page-client.tsx:7 — `import { createCicilan, deleteHutang } from "@/actions/hutang-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-dialog.tsx:11 — `import HutangDialog from "./hutang-dialog";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-page-client.tsx:20 — `} from "./hutang-group";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-page-client.tsx:21 — `import type { HutangPanelMode } from "./hutang-card";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/page.tsx:2 — `import { getHutang } from '@/actions/hutang-action';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/page.tsx:4 — `import HutangPageClient from './_components/hutang-page-client';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/settings/_components/system-preference-section.tsx:324 — `<SelectItem value="/debts">Hutang</SelectItem>` — [PATH URL, dimigrasikan ke /debts]
- [x] src/components/common/app-sidebar.tsx:66 — `{ href: "/debts", label: "Hutang", icon: HandCoins },` — [PATH URL, dimigrasikan ke /debts]
- [x] src/hooks/use-hutang-cicilan.ts:10 — `} from "@/actions/hutang-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/hooks/use-hutang-cicilan.ts:12 — `import type { Hutang, HutangCicilan } from "@/types/hutang";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/lib/user-preferences.ts:10 — `"/debts",` — [PATH URL, dimigrasikan ke /debts]
- [x] tests/e2e/mobile-layout.spec.ts:92 — `await page.goto("/debts");` — [PATH URL, dimigrasikan ke /debts]
- [x] tests/e2e/mobile-layout.spec.ts:125 — `await page.goto("/debts");` — [PATH URL, dimigrasikan ke /debts]
- [x] tests/e2e/mobile-layout.spec.ts:220 — `await page.goto("/debts");` — [PATH URL, dimigrasikan ke /debts]

==========================================
=== CHECKLIST TEMUAN ROUTE /REKAP (58 item) ===
==========================================
- [x] docs/architecture.md:28 — `- Route group `(dashboard)` memuat route protected seperti `/transaksi`, `/rekening`, `/rekap`, `/hutang`, `/kategori`, dan `/settings`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/hutang-piutang.md:58 — `- Perubahan hutang/piutang dan cicilan ikut merevalidate `/rekap` karena halaman rekap menampilkan rincian hutang/piutang.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/laporan.md:9 — `Fitur laporan/rekap menampilkan ringkasan pemasukan, pengeluaran, detail bulanan, breakdown kategori/judul, chart, dan export transaksi.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/laporan.md:13 — `- `/reports`` — [PATH URL, dimigrasikan ke /reports]
- [x] docs/features/laporan.md:18 — `- Rekap page: `src/app/(dashboard)/reports/page.tsx`` — [BUKAN PATH URL, path file folder route di-update ke reports]
- [x] docs/features/laporan.md:19 — `- Loading: `src/app/(dashboard)/reports/loading.tsx`` — [BUKAN PATH URL, path file folder route di-update ke reports]
- [x] docs/features/laporan.md:20 — `- Client page: `src/app/(dashboard)/reports/_components/rekap-page-client.tsx`` — [BUKAN PATH URL, path file folder route di-update ke reports]
- [x] docs/features/laporan.md:21 — `- Chart: `src/app/(dashboard)/reports/_components/rekap-charts.tsx`` — [BUKAN PATH URL, path file folder route di-update ke reports]
- [x] docs/features/laporan.md:22 — `- Detail bulanan: `src/app/(dashboard)/reports/_components/rekap-monthly-detail-section.tsx`` — [BUKAN PATH URL, path file folder route di-update ke reports]
- [x] docs/features/laporan.md:23 — `- Rekap actions: `src/actions/rekap-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/laporan.md:90 — `- Pertimbangkan filter periode di halaman `/rekap` jika kebutuhan analisis lebih luas.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/rekening.md:55 — `- Saat edit saldo saat ini, action membuat transaksi `correction`, mengubah saldo rekening, dan merevalidate `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:69 — `- Setelah create/update/delete, route `/transaksi`, `/rekening`, dan `/rekap` di-revalidate.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/folder-structure.md:87 — `/reports               -> laporan/rekap` — [PATH URL, routing tree di-update ke /reports]
- [x] docs/frontend-guidelines.md:236 — `- `/rekap`: `src/app/(dashboard)/rekap/loading.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/overview.md:46 — `- Rekap/Laporan: `src/app/(dashboard)/reports`, `src/actions/rekap-action.ts`, `src/actions/export-action.ts`, `src/lib/pdf-generator.ts`, `src/lib/spreadsheet-generator.ts`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:229 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:250 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:264 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:323 — `Revalidate: `/rekening`, `/transaksi`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:381 — `Catatan: operasi cicilan mengandalkan trigger database untuk memperbarui `sisa_tagihan`, status, dan saldo rekening. UI pelunasan meminta user memilih rekening terlebih dahulu lalu mencatat cicilan sebesar sisa tagihan. Mutasi hutang/piutang dan cicilan merevalidate `/hutang`, `/rekening`, dan `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:385 — `Lokasi: `src/actions/rekap-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:424 — `| "/reports"` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:452 — `Revalidate: `/settings`, `/transaksi`, `/rekening`, `/rekap`, `/hutang`, dan `/`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] public/manifest.json:101 — `"url": "/reports",` — [PATH URL, dimigrasikan ke /reports]
- [x] public/offline.html:229 — `<li><a href="/reports">Rekap</a></li>` — [PATH URL, dimigrasikan ke /reports]
- [x] public/sw.js:1 — bundle build service worker Serwist — [BUKAN PATH URL LANGSUNG, file build service worker serwist hasil kompilasi]
- [x] src/actions/hutang-action.ts:20 — `revalidatePath('/reports');` — [PATH URL, dimigrasikan ke /reports]
- [x] src/actions/preference-action.ts:75 — `revalidatePath('/reports');` — [PATH URL, dimigrasikan ke /reports]
- [x] src/actions/rekening-action.ts:216 — `revalidatePath('/reports');` — [PATH URL, dimigrasikan ke /reports]
- [x] src/actions/transaksi-action.ts:135 — `revalidatePath('/reports');` — [PATH URL, dimigrasikan ke /reports]
- [x] src/actions/transaksi-action.ts:229 — `revalidatePath('/reports');` — [PATH URL, dimigrasikan ke /reports]
- [x] src/actions/transaksi-action.ts:273 — `revalidatePath('/reports');` — [PATH URL, dimigrasikan ke /reports]
- [x] src/app/(dashboard)/reports/_components/rekap-bar-section.tsx:4 — `import type { RekapBulanan } from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-bar-section.tsx:5 — `import { BULAN_NAMES } from "@/constants/rekap";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-bar-section.tsx:9 — `import("./rekap-charts").then((module) => ({` — [BUKAN PATH URL, dynamic import komponen lokal]
- [x] src/app/(dashboard)/reports/_components/rekap-budget-section.tsx:3 — `import type { BudgetWithUsage } from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-budget-section.tsx:4 — `import { BULAN_NAMES } from "@/constants/rekap";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-charts.tsx:15 — `import type { RekapBulanan, RekapKategori } from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-charts.tsx:16 — `import { BULAN_NAMES } from "@/constants/rekap";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-kategori-section.tsx:4 — `import type { RekapKategori } from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-kategori-section.tsx:5 — `import { BULAN_NAMES } from "@/constants/rekap";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-kategori-section.tsx:11 — `import("./rekap-charts").then((module) => ({` — [BUKAN PATH URL, dynamic import komponen lokal]
- [x] src/app/(dashboard)/reports/_components/rekap-monthly-detail-section.tsx:18 — `} from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-monthly-detail-section.tsx:19 — `import { BULAN_NAMES } from "@/constants/rekap";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-page-client.tsx:9 — `} from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-page-client.tsx:13 — `} from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-bar-section.tsx:14 — `import { RekapBarSection } from "./rekap-bar-section";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-budget-section.tsx:15 — `import { RekapBudgetSection } from "./rekap-budget-section";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-monthly-detail-section.tsx:16 — `import { RekapMonthlyDetailSection } from "./rekap-monthly-detail-section";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-summary-cards.tsx:17 — `import { RekapSummaryCards } from "./rekap-summary-cards";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-summary-cards.tsx:3 — `import type { RekapBulanan } from "@/actions/rekap-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-summary-cards.tsx:4 — `import { BULAN_NAMES } from "@/constants/rekap";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/page.tsx:6 — `} from '@/actions/rekap-action';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/page.tsx:7 — `import RekapPageClient from './_components/rekap-page-client';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/settings/_components/system-preference-section.tsx:323 — `<SelectItem value="/reports">Rekap</SelectItem>` — [PATH URL, dimigrasikan ke /reports]
- [x] src/components/common/app-sidebar.tsx:65 — `{ href: "/reports", label: "Rekap", icon: BarChart3 },` — [PATH URL, dimigrasikan ke /reports]
- [x] src/lib/user-preferences.ts:9 — `"/reports",` — [PATH URL, dimigrasikan ke /reports]

==========================================
=== CHECKLIST TEMUAN ROUTE /REKENING (74 item) ===
==========================================
- [x] docs/README.md:25 — `- [Rekening](./features/rekening.md)` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/architecture.md:28 — `- Route group `(dashboard)` memuat route protected seperti `/transaksi`, `/rekening`, `/rekap`, `/hutang`, `/kategori`, dan `/settings`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/database-schema.md:146 — `- `public.update_saldo_rekening_hutang()` mengubah saldo rekening ketika hutang/piutang dibuat, diubah, diubah tipe/rekening/nominalnya, atau dihapus.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/database-schema.md:173 — `- `public.update_saldo_rekening_cicilan()` mengubah saldo rekening ketika cicilan dibuat, diubah nominal/rekeningnya, atau dihapus.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/rekening.md:13 — `- `/wallets`` — [PATH URL, dimigrasikan ke /wallets]
- [x] docs/features/rekening.md:17 — `- Page: `src/app/(dashboard)/wallets/page.tsx`` — [BUKAN PATH URL, path file folder route di-update ke wallets]
- [x] docs/features/rekening.md:18 — `- Loading: `src/app/(dashboard)/wallets/loading.tsx`` — [BUKAN PATH URL, path file folder route di-update ke wallets]
- [x] docs/features/rekening.md:19 — `- Client page: `src/app/(dashboard)/wallets/_components/rekening-page-client.tsx`` — [BUKAN PATH URL, path file folder route di-update ke wallets]
- [x] docs/features/rekening.md:20 — `- Dialog: `src/app/(dashboard)/wallets/_components/rekening-dialog.tsx`` — [BUKAN PATH URL, path file folder route di-update ke wallets]
- [x] docs/features/rekening.md:21 — `- Actions: `src/actions/rekening-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/rekening.md:22 — `- Validation: `src/validations/rekening-validation.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/rekening.md:23 — `- Types: `src/types/rekening.d.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:69 — `- Setelah create/update/delete, route `/transaksi`, `/rekening`, dan `/rekap` di-revalidate.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/folder-structure.md:86 — `/wallets               -> rekening` — [PATH URL, routing tree di-update ke /wallets]
- [x] docs/frontend-guidelines.md:235 — `- `/rekening`: `src/app/(dashboard)/rekening/loading.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/frontend-guidelines.md:244 — `- Untuk transaksi/rekening/kategori/hutang, empty state sebaiknya mengarahkan user membuat data pertama.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/overview.md:43 — `- Rekening: `src/app/(dashboard)/wallets`, `src/actions/rekening-action.ts`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:229 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:250 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:264 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:282 — `Lokasi: `src/actions/rekening-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:306 — `Revalidate: `/rekening`, `/transaksi`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:323 — `Revalidate: `/rekening`, `/transaksi`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:381 — `Catatan: operasi cicilan mengandalkan trigger database untuk memperbarui `sisa_tagihan`, status, dan saldo rekening. UI pelunasan meminta user memilih rekening terlebih dahulu lalu mencatat cicilan sebesar sisa tagihan. Mutasi hutang/piutang dan cicilan merevalidate `/hutang`, `/rekening`, dan `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:423 — `| "/wallets"` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:452 — `Revalidate: `/settings`, `/transaksi`, `/rekening`, `/rekap`, `/hutang`, dan `/`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] public/manifest.json:112 — `"url": "/wallets",` — [PATH URL, dimigrasikan ke /wallets]
- [x] public/offline.html:228 — `<li><a href="/wallets">Rekening</a></li>` — [PATH URL, dimigrasikan ke /wallets]
- [x] public/sw.js:1 — bundle build service worker Serwist — [BUKAN PATH URL LANGSUNG, file build service worker serwist hasil kompilasi]
- [x] src/actions/hutang-action.ts:19 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/preference-action.ts:74 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/rekening-action.ts:6 — `import type { Rekening, RekeningFormValues, RekeningUsageCounts } from '@/types/rekening';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/rekening-action.ts:8 — `import { rekeningCreateSchema, rekeningEditSchema } from '@/validations/rekening-validation';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/rekening-action.ts:214 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/rekening-action.ts:288 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/rekening-action.ts:313 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/rekening-action.ts:325 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/transaksi-action.ts:134 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/transaksi-action.ts:228 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/actions/transaksi-action.ts:272 — `revalidatePath('/wallets');` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/app/(dashboard)/debts/_components/hutang-card.tsx:5 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-detail.tsx:4 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-form.tsx:4 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-form.tsx:9 — `import { RekeningSelect } from "@/components/common/rekening-select";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-item.tsx:5 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-cicilan-item.tsx:9 — `import { RekeningSelect } from "@/components/common/rekening-select";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-dialog.tsx:13 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-dialog.tsx:15 — `import { RekeningSelect } from "@/components/common/rekening-select";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-group.tsx:4 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-lunas-form.tsx:4 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-lunas-form.tsx:5 — `import { RekeningSelect } from "@/components/common/rekening-select";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/_components/hutang-page-client.tsx:5 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/debts/page.tsx:3 — `import { getRekening } from '@/actions/rekening-action';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/_components/rekening-dialog.tsx:11 — `} from "@/validations/rekening-validation";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/_components/rekening-dialog.tsx:12 — `import { createRekening, updateRekening } from "@/actions/rekening-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/_components/rekening-dialog.tsx:14 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/_components/rekening-page-client.tsx:8 — `} from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/_components/rekening-page-client.tsx:9 — `import { deleteRekening, toggleExcludeTotal } from "@/actions/rekening-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/_components/rekening-page-client.tsx:23 — `import RekeningDialog from "./rekening-dialog";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/page.tsx:2 — `import { getRekening, getRekeningUsageCountsMap } from '@/actions/rekening-action';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/wallets/page.tsx:3 — `import RekeningPageClient from './_components/rekening-page-client';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/settings/_components/system-preference-section.tsx:322 — `<SelectItem value="/wallets">Rekening</SelectItem>` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/app/(dashboard)/transaksi/_components/transaksi-dialog.tsx:34 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transaksi/_components/transaksi-dialog.tsx:56 — `import { RekeningSelect } from "@/components/common/rekening-select";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transaksi/_components/transaksi-filter-bar.tsx:4 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transaksi/_components/transaksi-page-client.tsx:8 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transaksi/page.tsx:3 — `import { getRekening } from '@/actions/rekening-action';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/components/common/app-sidebar.tsx:64 — `{ href: "/wallets", label: "Rekening", icon: Landmark },` — [PATH URL, dimigrasikan ke /wallets]
- [x] src/components/common/rekening-select.tsx:2 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/hooks/use-hutang-cicilan.ts:13 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/hooks/use-offline-queue-sync.ts:12 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/lib/transaction-auto-fill.ts:1 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/lib/user-preferences.ts:8 — `"/wallets",` — [PATH URL, dimigrasikan ke /wallets]
- [x] tests/unit/transaction-auto-fill.test.ts:3 — `import type { Rekening } from "@/types/rekening";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]

==========================================
=== CHECKLIST TEMUAN ROUTE /TRANSAKSI (116 item) ===
==========================================
- [x] CHANGELOG.md:48 — `- Update `docs/features/transaksi.md` and `docs/server-actions-api.md` to reflect filter changes` — [BUKAN PATH URL, riwayat historis CHANGELOG (GR-7)]
- [x] docs/README.md:24 — `- [Transaksi](./features/transaksi.md)` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/architecture.md:28 — `- Route group `(dashboard)` memuat route protected seperti `/transactions`, `/wallets`, `/reports`, `/debts`, `/categories`, dan `/settings`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/architecture.md:89 — `redirect ke /transactions` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/architecture.md:95 — `{NEXT_PUBLIC_APP_URL}/auth/callback?next=/transactions` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/architecture.md:117 — `+-- Sudah login dan membuka /login atau /register -> redirect /transactions` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/database-schema.md:237 — `| `default_landing_page` | `text` | Yes | `'/transaksi'` | Route awal setelah login. |` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/auth.md:47 — `- Register mengirim email verification redirect ke `/auth/callback?next=/transactions` memakai origin production atau origin development yang sudah diizinkan.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/auth.md:48 — `- Login sukses redirect ke `/transactions`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/auth.md:49 — `- Google login/daftar memakai `signInWithOAuth` dan redirect ke `/auth/callback?next=/transactions` memakai origin production atau origin development yang sudah diizinkan.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/auth.md:53 — `- Auth page akan redirect ke `/transactions` jika user sudah login.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/kategori.md:22 — `- Types: `src/types/transaksi.d.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:13 — `- `/transactions`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:14 — `- Shortcut PWA: `/transactions?new=true`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:18 — `- Page: `src/app/(dashboard)/transactions/page.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:19 — `- Loading: `src/app/(dashboard)/transactions/loading.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:20 — `- Client page: `src/app/(dashboard)/transactions/_components/transaksi-page-client.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:21 — `- Dialog: `src/app/(dashboard)/transactions/_components/transaksi-dialog.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:22 — `- Voice button: `src/app/(dashboard)/transactions/_components/voice-input-button.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:23 — `- File Auto Fill button: `src/app/(dashboard)/transactions/_components/transaction-file-auto-fill-button.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:24 — `- Actions: `src/actions/transaksi-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:26 — `- Validation: `src/validations/transaksi-validation.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:27 — `- Types: `src/types/transaksi.d.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:68 — `- `correction` tidak diproses trigger dan ditangani manual oleh Server Action rekening/transaksi.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/features/transaksi.md:69 — `- Setelah create/update/delete, route `/transactions`, `/wallets`, dan `/reports` di-revalidate.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/folder-structure.md:81 — `/                      -> redirect ke /transactions` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/folder-structure.md:85 — `/transactions          -> transaksi` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/frontend-guidelines.md:234 — `- `/transaksi`: `src/app/(dashboard)/transaksi/loading.tsx`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/overview.md:42 — `- Transaksi: `src/app/(dashboard)/transaksi`, `src/actions/transaksi-action.ts`, `src/actions/voice-action.ts`, `src/actions/transaction-file-action.ts`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/pwa.md:31 — `- `start_url`: `/transaksi`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:41 — `Catatan: mengirim `emailRedirectTo` ke `/auth/callback?next=/transaksi` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:51 — `Output: redirect ke `/transaksi` jika sukses, `ActionResult` error jika gagal.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:119 — `Catatan: redirect OAuth diarahkan ke `/auth/callback?next=/transaksi` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`. Jika origin development belum diizinkan, action mengembalikan error dan tidak membuat URL OAuth.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:176 — `Lokasi: `src/actions/transaksi-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:186 — `Lokasi: `src/actions/transaksi-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:213 — `Lokasi: `src/actions/transaksi-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:221 — `- UI dan Server Action memakai `transaksiSchema` di `src/validations/transaksi-validation.ts`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:229 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:235 — `Lokasi: `src/actions/transaksi-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:250 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:256 — `Lokasi: `src/actions/transaksi-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:264 — `Revalidate: `/transaksi`, `/rekening`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:270 — `Lokasi: `src/actions/transaksi-action.ts`` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:306 — `Revalidate: `/rekening`, `/transaksi`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:323 — `Revalidate: `/rekening`, `/transaksi`, `/rekap`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:422 — `| "/transaksi"` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/server-actions-api.md:452 — `Revalidate: `/settings`, `/transaksi`, `/rekening`, `/rekap`, `/hutang`, dan `/`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/setup-local.md:53 — `Root `/` akan redirect ke `/transaksi`. Jika belum login, proxy akan redirect ke `/login`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:33 — `5. User diarahkan ke `/transactions`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:41 — `4. `redirectTo` diarahkan ke `{allowed-origin}/auth/callback?next=/transactions`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:43 — `6. Jika sukses, callback melakukan smart profile sync untuk nama/avatar kosong, mencatat session, lalu redirect ke `/transactions`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:53 — `5. `emailRedirectTo` diarahkan ke `{allowed-origin}/auth/callback?next=/transactions`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:57 — `9. Jika berhasil, user diarahkan ke route `next`, default `/transactions`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:158 — `http://localhost:3000/auth/callback?next=/transaksi` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:165 — `https://morphing-easeful-starry.ngrok-free.dev/auth/callback?next=/transaksi` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/supabase-auth.md:172 — `{NEXT_PUBLIC_APP_URL}/auth/callback?next=/transaksi` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] docs/troubleshooting.md:83 — `- Pastikan Server Action Google OAuth memakai callback `/auth/callback?next=/transaksi`.` — [BUKAN PATH URL, referensi dokumentasi docs/ (bukan runtime code)]
- [x] public/manifest.json:5 — `"start_url": "/transactions",` — [PATH URL, dimigrasikan ke /transactions]
- [x] public/manifest.json:90 — `"url": "/transactions?new=true",` — [PATH URL, dimigrasikan ke /transactions?new=true]
- [x] public/offline.html:227 — `<li><a href="/transactions">Transaksi</a></li>` — [PATH URL, dimigrasikan ke /transactions]
- [x] public/sw.js:1 — bundle build service worker Serwist — [BUKAN PATH URL LANGSUNG, file build service worker serwist hasil kompilasi]
- [x] src/actions/auth-action.ts:126 — `const callbackUrl = await createAuthCallbackUrl("/transactions");` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/auth-action.ts:173 — `redirect("/transactions");` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/auth-action.ts:277 — `const callbackUrl = await createAuthCallbackUrl("/transactions");` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/kategori-action.ts:6 — `import type { Kategori } from '@/types/transaksi';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/kategori-action.ts:42 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/kategori-action.ts:143 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/kategori-action.ts:199 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/preference-action.ts:73 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/rekap-action.ts:5 — `import type { TipeTransaksi } from '@/types/transaksi';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/rekening-action.ts:215 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/rekening-action.ts:289 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/rekening-action.ts:314 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/transaksi-action.ts:6 — `import type { Transaksi, TransaksiFormValues, TransaksiFilter, Kategori, JudulSuggestion } from '@/types/transaksi';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/transaksi-action.ts:7 — `import { transaksiSchema } from '@/validations/transaksi-validation';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/actions/transaksi-action.ts:133 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/transaksi-action.ts:227 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/actions/transaksi-action.ts:271 — `revalidatePath('/transactions');` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/app/(dashboard)/categories/_components/kategori-dialog.tsx:12 — `import type { Kategori } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/categories/_components/kategori-page-client.tsx:4 — `import type { Kategori } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/categories/page.tsx:2 — `import { getKategori } from '@/actions/transaksi-action';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/reports/_components/rekap-monthly-detail-section.tsx:20 — `import { TIPE_CONFIG } from "@/constants/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/settings/_components/system-preference-section.tsx:321 — `<SelectItem value="/transactions">Transaksi</SelectItem>` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/app/(dashboard)/transactions/_components/transaksi-dialog.tsx:9 — `} from "@/validations/transaksi-validation";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-dialog.tsx:15 — `} from "@/actions/transaksi-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-dialog.tsx:33 — `import type { Transaksi, Kategori, JudulSuggestion } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-dialog.tsx:58 — `import { TIPE_TABS } from "@/constants/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-filter-bar.tsx:5 — `import type { Kategori, TransaksiFilter, TipeTransaksi } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-list-item.tsx:5 — `import { TIPE_CONFIG } from "@/constants/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-list.tsx:6 — `import { TransaksiListItem } from "./transaksi-list-item";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-page-client.tsx:7 — `import type { Kategori, Transaksi } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-page-client.tsx:10 — `import { deleteTransaksi } from "@/actions/transaksi-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-dialog.tsx:31 — `import TransaksiDialog from "./transaksi-dialog";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-filter-bar.tsx:32 — `import { TransaksiFilterBar } from "./transaksi-filter-bar";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-list.tsx:33 — `import { TransaksiList } from "./transaksi-list";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-summary-card.tsx:34 — `import { TransaksiSummaryCard } from "./transaksi-summary-card";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/_components/transaksi-page-client.tsx:104 — `router.replace("/transactions", { scroll: false });` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/app/(dashboard)/transactions/page.tsx:2 — `import { getTransaksi, getKategori } from '@/actions/transaksi-action';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/(dashboard)/transactions/page.tsx:4 — `import TransaksiPageClient from './_components/transaksi-page-client';` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/app/auth/callback/route.ts:8 — `return "/transactions";` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/app/not-found.tsx:26 — `<Link href="/transactions">Ke Transaksi</Link>` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/components/common/app-sidebar.tsx:63 — `{ href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/components/common/app-sidebar.tsx:87 — `href="/transactions"` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/components/common/app-sidebar.tsx:252 — `<Link href="/transactions?new=true">` — [PATH URL, dimigrasikan ke /transactions?new=true]
- [x] src/hooks/use-date-navigation.ts:20 — `import type { TransaksiFilter } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/hooks/use-offline-queue-sync.ts:13 — `import type { Kategori, Transaksi } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/hooks/use-transaksi-filter.ts:18 — `import type { Transaksi, TransaksiFilter } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/lib/offline-queue.ts:9 — `} from "@/actions/transaksi-action";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/lib/offline-queue.ts:10 — `import type { TransaksiFormValues } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/lib/transaction-auto-fill.ts:2 — `import type { Kategori } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]
- [x] src/lib/user-preferences.ts:7 — `"/transactions",` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/lib/user-preferences.ts:41 — `default_landing_page: "/transactions",` — [PATH URL, dimigrasikan ke /transactions]
- [x] src/migrations/009-user-preferences.sql:13 — `default_landing_page  TEXT DEFAULT '/transaksi',` — [BUKAN PATH URL, file migrasi SQL lama (GR-7)]
- [x] tests/e2e/mobile-layout.spec.ts:15 — `await expect(page).toHaveURL(/\/transactions$/);` — [PATH URL, dimigrasikan ke /transactions]
- [x] tests/e2e/mock-supabase.mjs:133 — `default_landing_page: "/transactions",` — [PATH URL, dimigrasikan ke /transactions]
- [x] tests/unit/transaction-auto-fill.test.ts:5 — `import type { Kategori } from "@/types/transaksi";` — [BUKAN PATH URL, import path modul/tipe/komponen TypeScript (GR-1)]

