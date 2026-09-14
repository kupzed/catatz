# Feature: Auth

## Status

Status: Aktif untuk email/password login/register, reset password email, Google OAuth, dan Google Link Identity dari Settings.

## Route

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`

## Lokasi File

- Auth layout: `src/app/(auth)/layout.tsx`
- Login page: `src/app/(auth)/login/page.tsx`
- Register page: `src/app/(auth)/register/page.tsx`
- Forgot password page: `src/app/(auth)/forgot-password/page.tsx`
- Reset password page: `src/app/(auth)/reset-password/page.tsx`
- Callback route handler: `src/app/auth/callback/route.ts`
- Auth actions: `src/actions/auth-action.ts`
- Supabase middleware/proxy: `src/configs/supabase/middleware.ts`, `src/proxy.ts`
- Connected account UI: `src/app/(dashboard)/settings/_components/connected-account-section.tsx`

## Provider

- Email/password Supabase Auth.
- Google OAuth via Supabase Auth.

## Server Action Terkait

- `signUp`
- `signIn`
- `signOut`
- `getUser`
- `resetPasswordRequest`
- `updatePassword`
- `signInWithGoogle`
- `linkGoogleIdentity`
- `unlinkGoogleIdentity`

## Business Rules

- Register mengirim metadata `name`.
- Register mengirim email verification redirect ke `/auth/callback?next=/transactions` memakai origin production atau origin development yang sudah diizinkan.
- Login sukses redirect ke `/transactions`.
- Google login/daftar memakai `signInWithOAuth` dan redirect ke `/auth/callback?next=/transactions` memakai origin production atau origin development yang sudah diizinkan.
- Link Identity Google dari Settings memakai `linkIdentity` dan redirect ke `/auth/callback?next=/settings&flow=link_google` memakai origin production atau origin development yang sudah diizinkan.
- Callback flow `link_google` hanya mempertahankan identity Google jika email Google sama dengan email utama user. Jika berbeda, callback mencoba `unlinkIdentity` dan mengembalikan message error ke `/settings`.
- Supabase automatic linking tetap ditangani oleh Supabase Auth saat OAuth sign-in menemukan user existing dengan email terverifikasi yang sama.
- Auth page akan redirect ke `/transactions` jika user sudah login.
- Route selain `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, dan `/auth/callback` diperlakukan protected oleh proxy.
- Jika auth code salah mendarat di `/login` atau `/register`, middleware mengalihkan request ke `/auth/callback` dengan query yang sama.

## UI Behavior

- Login memakai `useActionState`.
- Register memakai client submit handler dan menampilkan state "Cek Email Anda" setelah sukses.
- Login/register menampilkan tombol Google.
- Settings menampilkan status akun Google di bagian Akun Terhubung dan menyediakan tombol Hubungkan/Putuskan.
- Login/register memiliki toggle show password.
- Register menampilkan indikator kekuatan password sederhana.

## TODO / Improvement

- Pastikan Google provider, Redirect URLs, dan Manual Linking aktif di Supabase Dashboard sebelum menguji flow Link Identity.
- Untuk ngrok development, pastikan host ngrok ada di `ALLOWED_DEV_ORIGINS`, Supabase Redirect URLs, dan Google Cloud Authorized JavaScript origins.
