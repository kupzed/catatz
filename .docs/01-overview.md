# CatatZ — Dokumentasi Proyek

## 1. Overview

**CatatZ** adalah aplikasi pencatatan keuangan pribadi berbasis web yang dibangun dengan:

| Layer | Teknologi |
|---|---|
| Frontend & Backend | Next.js 16 (App Router, React 19) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password, multi-user) |
| AI | Google Gemini API (`gemini-2.5-flash-lite`) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State Management | Zustand (auth) + React Query (server state) |
| Form Validation | React Hook Form + Zod v4 |
| Charts | Recharts |

---

## 2. Struktur Folder

```
catatz/
├── src/
│   ├── actions/                # Server Actions (CRUD ke Supabase)
│   │   ├── auth-action.ts      # signIn, signUp, signOut, getUser
│   │   ├── transaksi-action.ts # CRUD transaksi + suggestKategori
│   │   ├── rekening-action.ts  # CRUD rekening + toggleExcludeTotal
│   │   ├── hutang-action.ts    # CRUD hutang + cicilan + markLunas
│   │   └── rekap-action.ts     # Analitik: bulanan, kategori, budget
│   │
│   ├── app/
│   │   ├── (auth)/             # Route group: login, register
│   │   │   ├── layout.tsx      # Auth layout (dark glassmorphism)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (dashboard)/        # Route group: semua halaman app
│   │   │   ├── layout.tsx      # Dashboard layout (sidebar + header)
│   │   │   ├── _components/    # Komponen khusus dashboard
│   │   │   │   └── dashboard-breadcrumb.tsx
│   │   │   ├── transaksi/      # Modul transaksi
│   │   │   ├── rekening/       # Modul rekening
│   │   │   ├── rekap/          # Modul rekap/analitik
│   │   │   ├── hutang/         # Modul hutang/piutang
│   │   │   └── settings/       # Pengaturan
│   │   │
│   │   ├── layout.tsx          # Root layout (providers)
│   │   ├── page.tsx            # Redirect ke /transaksi
│   │   └── globals.css         # Global styles
│   │
│   ├── components/
│   │   ├── common/             # Komponen shared
│   │   │   ├── app-sidebar.tsx # Sidebar navigasi utama
│   │   │   └── darkmode-toggle.tsx
│   │   └── ui/                 # shadcn/ui components (auto-generated)
│   │
│   ├── configs/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase browser client
│   │       ├── server.ts       # Supabase server client (SSR)
│   │       └── middleware.ts   # Session refresh + route protection
│   │
│   ├── constants/
│   │   └── banks.ts            # Daftar bank/e-wallet dengan warna & slug
│   │
│   ├── lib/
│   │   ├── utils.ts            # Helper: formatRupiah, formatTanggal, dll
│   │   └── ai-parser.ts        # Gemini AI natural language parser
│   │
│   ├── migrations/             # SQL schema (jalankan di Supabase)
│   │   ├── 001-profiles.sql
│   │   ├── 002-rekening.sql
│   │   ├── 003-kategori.sql    # Includes default category seed
│   │   ├── 004-transaksi.sql   # Includes balance trigger
│   │   ├── 005-hutang.sql      # Includes cicilan trigger
│   │   ├── 006-budget.sql
│   │   └── 007-recurring.sql
│   │
│   ├── providers/
│   │   ├── react-query-provider.tsx
│   │   └── theme-provider.tsx
│   │
│   ├── stores/
│   │   └── auth-store.ts       # Zustand store untuk user session
│   │
│   ├── types/
│   │   ├── general.d.ts        # ActionResult<T> generic type
│   │   ├── transaksi.d.ts
│   │   ├── rekening.d.ts
│   │   └── hutang.d.ts
│   │
│   ├── validations/
│   │   ├── transaksi-validation.ts  # Zod schema
│   │   ├── rekening-validation.ts
│   │   └── hutang-validation.ts
│   │
│   └── proxy.ts                # Next.js 16 proxy (session management)
│
├── .env                        # Environment variables
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Arsitektur Alur Data

```
User Request
    │
    ▼
proxy.ts (session refresh + auth guard)
    │
    ▼
Next.js App Router
    │
    ├─► Server Component (page.tsx)
    │       │  fetch data via Server Actions
    │       ▼
    │   Supabase PostgreSQL
    │       │  RLS memfilter berdasarkan user_id
    │       ▼
    │   Kirim data sebagai props ke Client Component
    │
    └─► Client Component (_components/*.tsx)
            │  mutasi via Server Actions
            │  validasi via Zod + React Hook Form
            ▼
        Supabase PostgreSQL (UPDATE/INSERT/DELETE)
            │  trigger otomatis update saldo/sisa
            ▼
        State lokal diperbarui (optimistic update)
```

---

## 4. Konvensi Penamaan

| Pola | Contoh | Keterangan |
|---|---|---|
| `*-action.ts` | `transaksi-action.ts` | Server Actions per modul |
| `*-page-client.tsx` | `transaksi-page-client.tsx` | Client component utama halaman |
| `*-dialog.tsx` | `transaksi-dialog.tsx` | Dialog form CRUD |
| `*-validation.ts` | `transaksi-validation.ts` | Zod schema form |
| `*.d.ts` | `transaksi.d.ts` | TypeScript type definitions |

---

## 5. Pola Server vs Client Component

- **Server Component** (`page.tsx`): fetch data awal, tidak ada interaktivitas
- **Client Component** (`_components/*-page-client.tsx`): state lokal, event handler
- **Server Actions** (`actions/*.ts`): semua operasi database (wajib `'use server'`)

> ⚠️ **Aturan penting**: Jangan pernah membuat Supabase client di Client Component. Selalu gunakan Server Actions untuk operasi database.
