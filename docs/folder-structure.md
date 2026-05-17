# Folder Structure

## Tree Utama

```txt
catatz/
├── public/
│   ├── icons/
│   ├── manifest.json
│   ├── offline.html
│   ├── catatz.svg
│   └── sw.js
├── src/
│   ├── actions/
│   ├── app/
│   ├── components/
│   ├── configs/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── migrations/
│   ├── providers/
│   ├── scripts/
│   ├── stores/
│   ├── types/
│   └── validations/
├── docs/
├── next.config.ts
├── package.json
├── package-lock.json
├── vercel.json
├── components.json
├── eslint.config.mjs
└── tsconfig.json
```

## Penjelasan Folder

- `src/app`: route Next.js App Router, layout, loading state, error boundary route, route handler, robots, sitemap, dan service worker source.
- `src/app/(auth)`: halaman auth user-facing, yaitu `/login` dan `/register`.
- `src/app/(dashboard)`: halaman protected setelah login.
- `src/app/auth/callback/route.ts`: Route Handler untuk menukar auth code Supabase menjadi session.
- `src/actions`: Server Actions untuk auth, transaksi, rekening, kategori, hutang, rekap, profil, export, dan voice parsing.
- `src/components`: komponen reusable, termasuk shadcn/ui di `components/ui`, common component, error boundary, dan PWA components.
- `src/configs`: konfigurasi environment dan Supabase client.
- `src/constants`: data konstan seperti daftar bank/e-wallet.
- `src/hooks`: hook client untuk mobile, online status, PWA install, dan voice input.
- `src/lib`: helper umum seperti formatter, PDF generator, offline queue, service worker registration, dan voice parser.
- `src/migrations`: SQL migration manual untuk schema, RLS, trigger, storage bucket, dan grant API.
- `src/providers`: provider global untuk theme dan React Query.
- `src/scripts`: script maintenance, saat ini generator icon PWA.
- `src/stores`: state store client, saat ini auth store Zustand.
- `src/types`: deklarasi TypeScript lintas modul.
- `src/validations`: schema validasi Zod untuk form.
- `public`: asset static, PWA manifest, icons, offline page, dan generated service worker.
- `docs`: dokumentasi teknis project.
- `AGENTS.md`: instruksi repository-level untuk workflow Codex, documentation gate, final response, dan suggested Conventional Commit message.

## Routing

Route aktual:

```txt
/                      -> redirect ke /transaksi
/login                 -> form login
/register              -> form register
/auth/callback         -> Supabase auth callback
/transaksi             -> transaksi
/rekening              -> rekening
/rekap                 -> laporan/rekap
/hutang                -> hutang/piutang
/kategori              -> kategori
/settings              -> pengaturan
/robots.txt            -> MetadataRoute robots
/sitemap.xml           -> MetadataRoute sitemap
```

Tidak ada folder `src/app/api` pada kondisi repo saat ini.

## Aturan Penempatan File Baru

- Route baru ditempatkan di `src/app`.
- Fitur dashboard yang perlu login ditempatkan di bawah `src/app/(dashboard)`.
- Server Action baru ditempatkan di `src/actions` dan diberi directive `"use server"`.
- Helper murni ditempatkan di `src/lib`.
- Konfigurasi runtime/env ditempatkan di `src/configs`.
- Type reusable ditempatkan di `src/types`.
- Schema validasi form ditempatkan di `src/validations`.
- Komponen reusable lintas fitur ditempatkan di `src/components`.
- Komponen yang hanya dipakai satu route boleh ditempatkan di folder `_components` route tersebut.

## Aturan Component

- Server Component adalah default di App Router dan cocok untuk initial data fetching.
- Client Component wajib memakai `"use client"` jika menggunakan state, effect, event handler, browser API, localStorage, IndexedDB, atau hook client.
- Komponen UI primitive mengikuti pola shadcn/ui di `src/components/ui`.
- Dialog/form fitur sebaiknya memakai React Hook Form dan Zod seperti pola transaksi, rekening, kategori, dan hutang.

## Catatan Struktur

- Project memakai `src/proxy.ts`, bukan `middleware.ts`.
- Migration SQL berada di `src/migrations`, bukan folder `supabase/migrations`.
- Root `AGENTS.md` menjadi operating instructions untuk Codex dan merujuk ke `docs/ai-development-rules.md`.
- File `env-example` masih ada sebagai contoh lama. `.env.example` menjadi contoh env yang lebih konvensional untuk dokumentasi baru.
