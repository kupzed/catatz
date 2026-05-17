# Architecture

## High-Level Architecture

```txt
User
  |
  v
Next.js 16 App Router
  |
  +-- Server Components untuk initial data loading
  +-- Client Components untuk UI interaktif
  +-- Server Actions untuk mutasi dan query Supabase
  +-- Route Handler /auth/callback untuk OAuth/email callback Supabase
  |
  v
Supabase SSR Client
  |
  +-- Supabase Auth
  +-- Supabase PostgreSQL
  +-- Supabase Storage bucket avatars
```

## Stack Aplikasi

- Routing menggunakan Next.js App Router di `src/app`.
- Route group `(auth)` memuat `/login` dan `/register`.
- Route group `(dashboard)` memuat route protected seperti `/transaksi`, `/rekening`, `/rekap`, `/hutang`, `/kategori`, dan `/settings`.
- Data awal page dashboard diambil di Server Component, lalu diteruskan ke Client Component.
- Operasi CRUD dilakukan melalui Server Actions di `src/actions`.
- Supabase browser client berada di `src/configs/supabase/client.ts`.
- Supabase server client berada di `src/configs/supabase/server.ts`.
- Session refresh/protection ditangani oleh `src/proxy.ts` yang memanggil `src/configs/supabase/middleware.ts`.

## Alur Frontend ke Backend

```txt
Page Server Component
  |
  v
Server Action get*
  |
  v
createClient() dari src/configs/supabase/server.ts
  |
  v
Supabase Auth cookie/session
  |
  v
PostgREST query ke tabel Supabase
  |
  v
Client Component menerima initial data
```

Untuk mutasi data:

```txt
Client Component form/dialog
  |
  v
Server Action create/update/delete
  |
  v
Supabase query
  |
  v
revalidatePath(route terkait)
  |
  v
UI update melalui state lokal atau refresh data berikutnya
```

## Alur Supabase Auth

```txt
Login/Register form
  |
  v
src/actions/auth-action.ts
  |
  v
supabase.auth.signInWithPassword / signUp
  |
  v
Supabase Auth session cookie
  |
  v
redirect ke /transaksi
```

Register mengirim `emailRedirectTo` ke:

```txt
{NEXT_PUBLIC_APP_URL}/auth/callback?next=/transaksi
```

Callback diproses oleh `src/app/auth/callback/route.ts` dengan `exchangeCodeForSession`.

## Alur Protected Route

Project ini tidak memiliki `middleware.ts`. Next.js proxy berada di `src/proxy.ts`.

```txt
Request
  |
  v
src/proxy.ts
  |
  v
updateSession(request)
  |
  v
supabase.auth.getUser()
  |
  +-- Tidak login dan bukan / atau auth page -> redirect /login
  +-- Sudah login dan membuka /login atau /register -> redirect /transaksi
  +-- Selain itu -> allow
```

Dashboard layout juga melakukan check user ulang di `src/app/(dashboard)/layout.tsx` dan redirect ke `/login` jika session tidak ada.

## Alur Data User dengan RLS

Mayoritas tabel menyimpan `user_id` yang mengarah ke `profiles.id`. RLS memastikan query hanya mengakses data milik user yang sedang login:

```sql
auth.uid() = user_id
```

Pengecualian utama:

- `profiles` memakai `id` sebagai user id dan policy `auth.uid() = id`.
- `kategori` memiliki kategori system dengan `user_id = NULL` dan `is_system = TRUE`, sehingga bisa dibaca bersama kategori user.
- `hutang_cicilan` tidak memiliki `user_id` langsung; aksesnya divalidasi melalui parent table `hutang`.
- Storage bucket `avatars` memperbolehkan read public untuk bucket avatars, sedangkan upload/update/delete dibatasi ke folder user sendiri.

## Alur Saldo dan Business Rule Database

Saldo rekening tidak hanya dihitung di UI. Database memiliki trigger:

- `trg_transaksi_saldo` menjalankan `update_saldo_rekening`.
- `trg_rekening_hutang` menjalankan `update_saldo_rekening_hutang`.
- `trg_update_sisa_hutang` menjalankan `update_sisa_hutang`.
- `trg_rekening_cicilan` menjalankan `update_saldo_rekening_cicilan`.

Action layer juga menangani kasus khusus:

- Koreksi saldo rekening membuat transaksi `correction`.
- Transaksi `correction` tidak diproses trigger transaksi, sehingga saldo diperbarui manual oleh action.
- Edit/delete transaksi `correction` membalik atau menerapkan perubahan saldo secara manual.

## Alur PWA

```txt
Root layout
  |
  +-- SwProvider -> register /sw.js
  +-- PWAComponents -> install banner + iOS guide + update prompt
  +-- OfflineIndicator -> status offline/online
  |
  v
Serwist service worker
  |
  +-- Cache app shell assets
  +-- NetworkOnly untuk POST dan /api/*
  +-- Fallback document ke /offline.html
```

## Alur Deployment Production

```txt
Git repository
  |
  v
Vercel build
  |
  v
npm install
  |
  v
npm run build -> next build --webpack
  |
  v
Next.js output + public/sw.js
  |
  v
Vercel region sin1
  |
  v
Supabase production project
```

Production membutuhkan environment variable Supabase, app URL production, dan AI API key server-side. Supabase Auth Site URL dan Redirect URLs harus disesuaikan dengan domain production.
