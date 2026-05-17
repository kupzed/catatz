# Feature: Auth

## Status

Status: Aktif untuk email/password login dan register. Reset password email dan Google OAuth belum terlihat di codebase.

## Route

- `/login`
- `/register`
- `/auth/callback`

## Lokasi File

- Auth layout: `src/app/(auth)/layout.tsx`
- Login page: `src/app/(auth)/login/page.tsx`
- Register page: `src/app/(auth)/register/page.tsx`
- Callback route handler: `src/app/auth/callback/route.ts`
- Auth actions: `src/actions/auth-action.ts`
- Supabase middleware/proxy: `src/configs/supabase/middleware.ts`, `src/proxy.ts`

## Provider

- Email/password Supabase Auth.

Tidak ada pemanggilan `signInWithOAuth` di repository saat ini.

## Server Action Terkait

- `signUp`
- `signIn`
- `signOut`
- `getUser`

## Business Rules

- Register mengirim metadata `name`.
- Register mengirim email verification redirect ke `/auth/callback?next=/transaksi`.
- Login sukses redirect ke `/transaksi`.
- Auth page akan redirect ke `/transaksi` jika user sudah login.
- Route selain `/`, `/login`, dan `/register` diperlakukan protected oleh proxy.

## UI Behavior

- Login memakai `useActionState`.
- Register memakai client submit handler dan menampilkan state "Cek Email Anda" setelah sukses.
- Login/register memiliki toggle show password.
- Register menampilkan indikator kekuatan password sederhana.

## TODO / Improvement

- Tambahkan flow lupa password/reset password jika diperlukan.
- Tambahkan OAuth provider hanya jika sudah dikonfigurasi di Supabase dan codebase.
