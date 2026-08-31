# Folder Structure

## Tree Utama

```txt
catatz/
├── .agents/skills/          # canonical Agent Skills
├── .claude/                 # Claude agents, wrappers, hooks, settings
├── .codex/                  # Codex agents, hooks, config, MCP declaration
├── .ecc/                    # manifest dan shared hook implementation
├── .github/workflows/       # CI quality dan E2E
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
├── tests/
│   ├── unit/
│   └── e2e/
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
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
- `src/actions`: Server Actions untuk auth, transaksi, rekening, kategori, hutang, rekap, profil, export, voice parsing, dan file Auto Fill.
- `src/components`: komponen reusable, termasuk shadcn/ui di `components/ui`, common component, error boundary, dan PWA components.
- `src/configs`: konfigurasi environment dan Supabase client.
- `src/constants`: data konstan seperti daftar bank/e-wallet.
- `src/hooks`: hook client untuk mobile, online status, PWA install, dan voice input.
- `src/lib`: helper umum seperti formatter, PDF/spreadsheet generator, offline queue, service worker registration, parser AI bersama, voice parser, dan parser file transaksi.
- `src/migrations`: SQL migration manual untuk schema, RLS, trigger, storage bucket, dan grant API.
- `src/providers`: provider global untuk theme dan React Query.
- `src/scripts`: script maintenance, saat ini generator icon PWA.
- `src/stores`: state store client, saat ini auth store Zustand.
- `src/types`: deklarasi TypeScript lintas modul.
- `src/validations`: schema validasi Zod untuk form.
- `public`: asset static, PWA manifest, icons, offline page, dan generated service worker.
- `docs`: dokumentasi teknis project.
- `tests/unit`: unit test Vitest untuk helper, policy hook, dan modul pure.
- `tests/e2e`: smoke test Playwright dan mock service lokal; tidak memakai Supabase production.
- `.agents/skills`: canonical skills, termasuk skills Supabase dan subset ECC yang relevan.
- `.claude`: project agents read-only, skill wrappers, dan hook adapter untuk Claude Code.
- `.codex`: project agents read-only, hook lifecycle, serta konfigurasi Chrome DevTools MCP untuk Codex.
- `.ecc`: manifest instalasi dan shared hook implementation. `.ecc/runtime` bersifat lokal dan diabaikan Git.
- `.github/workflows`: CI lint, typecheck, unit coverage, build, dan Playwright smoke test.
- `AGENTS.md`: instruksi repository-level lintas agent, documentation gate, ECC workflow, final response, dan suggested Conventional Commit message.

## Routing

Route aktual:

```txt
/                      -> redirect ke /transaksi
/login                 -> form login
/register              -> form register
/auth/callback         -> Supabase auth callback
/transaksi             -> transaksi
/rekening              -> rekening
/reports               -> laporan/rekap
/debts                 -> hutang/piutang
/categories            -> kategori
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
- `CLAUDE.md` mendelegasikan instruksi repository ke `AGENTS.md`; skill Claude hanya wrapper ke `.agents/skills`.
- File `env-example` masih ada sebagai contoh lama. `.env.example` menjadi contoh env yang lebih konvensional untuk dokumentasi baru.
