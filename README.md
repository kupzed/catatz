# CatatZ

CatatZ adalah aplikasi pencatatan keuangan pribadi berbasis Next.js dan Supabase PostgreSQL. Aplikasi ini membantu user mencatat pemasukan, pengeluaran, transfer, koreksi saldo, rekening, kategori, hutang/piutang, rekap keuangan, dan export laporan PDF.

## Tech Stack

- Next.js 16 App Router
- React 19 dan TypeScript
- Supabase Auth, Supabase PostgreSQL, dan Supabase Storage
- Server Actions dan Route Handler Next.js
- Tailwind CSS v4 dan shadcn/ui
- React Hook Form, Zod, Sonner, Recharts, date-fns
- Serwist untuk PWA/service worker
- Vercel untuk deployment

## Fitur Utama

- Auth email/password dengan session Supabase.
- Manajemen transaksi income, expense, transfer, dan correction.
- Manajemen rekening dengan saldo, logo, warna, dan opsi exclude dari total.
- Kategori system dan kategori custom user.
- Hutang/piutang dengan cicilan dan status pelunasan.
- Rekap bulanan, breakdown kategori, dan tampilan budget jika data budget tersedia.
- Pengaturan profil, avatar, password, tema, dan export PDF.
- PWA install prompt, offline shell, update prompt, dan offline queue untuk aksi transaksi.
- Input suara transaksi menggunakan browser Speech Recognition dan Gemini API server-side.

## Quick Start

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Untuk shell non-PowerShell, gunakan command copy yang setara, misalnya `cp .env.example .env.local`.

## Environment Setup

Isi `.env.local` berdasarkan `.env.example`.

Variable wajib minimal:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `AI_API_KEY`

Jangan commit `.env.local`, `.env`, token, service role key, atau credential production.

## Command Penting

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run generate-icons
```

Catatan build: script production menggunakan `next build --webpack` karena service worker Serwist dihasilkan melalui konfigurasi webpack.

## Documentation

Dokumentasi teknis lengkap tersedia di [docs/README.md](./docs/README.md).

Mulai dari:

- [Project Overview](./docs/overview.md)
- [Architecture](./docs/architecture.md)
- [Setup Local](./docs/setup-local.md)
- [Database Schema](./docs/database-schema.md)
- [Supabase Auth](./docs/supabase-auth.md)
- [Security Checklist](./docs/security-checklist.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Status Project

Status: aktif dikembangkan. Dokumentasi ini mengikuti kondisi repository saat ini dan perlu ikut diperbarui setiap ada perubahan fitur, database, auth, environment variable, deployment, security, atau struktur folder.
