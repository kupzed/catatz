# Supabase Auth

## Provider

Provider yang terlihat di codebase:

- Email/password.

Tidak terlihat implementasi Google OAuth atau provider OAuth lain di repository saat ini.

## File Terkait

- `src/actions/auth-action.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/configs/supabase/client.ts`
- `src/configs/supabase/server.ts`
- `src/configs/supabase/middleware.ts`
- `src/proxy.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/migrations/001-profiles.sql`

## Login Flow

1. User membuka `/login`.
2. Form memanggil Server Action `signIn`.
3. `signIn` memanggil `supabase.auth.signInWithPassword({ email, password })`.
4. Jika berhasil, action menjalankan `revalidatePath("/", "layout")`.
5. User diarahkan ke `/transaksi`.
6. Session disimpan melalui mekanisme cookie Supabase SSR.

## Register Flow

1. User membuka `/register`.
2. Form memanggil Server Action `signUp`.
3. `signUp` memanggil `supabase.auth.signUp`.
4. Metadata yang dikirim: `name`.
5. `emailRedirectTo` diarahkan ke `{NEXT_PUBLIC_APP_URL}/auth/callback?next=/transaksi`.
6. User diminta mengecek email verifikasi.
7. Setelah link diklik, Supabase mengarahkan ke `/auth/callback`.
8. Route Handler callback menukar `code` menjadi session.
9. Jika berhasil, user diarahkan ke route `next`, default `/transaksi`.

## Logout Flow

1. User memilih keluar dari menu akun/sidebar.
2. Server Action `signOut` memanggil `supabase.auth.signOut()`.
3. Layout di-revalidate.
4. User diarahkan ke `/login`.

Ada juga `useAuthStore` di `src/stores/auth-store.ts` yang memiliki method `signOut` client-side, tetapi flow sidebar memakai Server Action `signOut`.

## Reset Password

Status: Belum ada flow reset password via email di route auth.

Yang tersedia saat ini:

- Tab `Keamanan` di `/settings`.
- Server Action `changePassword`.
- User harus sudah login.
- Password lama diverifikasi dengan `signInWithPassword`.
- Password baru disimpan dengan `supabase.auth.updateUser({ password })`.

## Google OAuth

Status: Tidak terlihat digunakan di codebase.

Tidak ada pemanggilan `signInWithOAuth` atau konfigurasi Google OAuth di route/action saat dokumentasi ini dibuat.

## Session Handling

Supabase SSR client:

- Browser client: `src/configs/supabase/client.ts`.
- Server client: `src/configs/supabase/server.ts`.
- Middleware/proxy client: `src/configs/supabase/middleware.ts`.

Server client memakai `cookies()` dari `next/headers` dan mengatur cookie `secure` berdasarkan `environment.isProduction`.

## Middleware/Proxy Protection

Project memakai `src/proxy.ts`.

Protected route rule:

- Auth page: `/login`, `/register`.
- Public route: `/`.
- Selain itu dianggap protected.

Behavior:

- Protected route tanpa user -> redirect `/login`.
- Auth page dengan user -> redirect `/transaksi`.
- Dashboard layout juga melakukan check `supabase.auth.getUser()`.

Matcher proxy mengecualikan:

- `_next`
- `api`
- `favicon.ico`
- `manifest.json`
- `offline.html`
- `sw.js`
- `swe-worker*.js`
- `icons/`
- asset static umum

## Redirect URL

Development default:

```txt
http://localhost:3000/auth/callback?next=/transaksi
```

Production:

```txt
{NEXT_PUBLIC_APP_URL}/auth/callback?next=/transaksi
```

Supabase Auth Site URL dan Redirect URLs harus memasukkan domain production dan URL local yang dipakai untuk development/mobile testing.

## Profile Creation Flow

Migration `001-profiles.sql` membuat:

- Function `public.handle_new_user()`.
- Trigger `on_auth_user_created`.

Setelah user baru masuk ke `auth.users`, trigger membuat row `public.profiles` dengan:

- `id = NEW.id`
- `name = NEW.raw_user_meta_data ->> 'name'`
- `avatar_url = NEW.raw_user_meta_data ->> 'avatar_url'`

## Security Notes

- Jangan gunakan `raw_user_meta_data` untuk authorization. Saat ini metadata hanya dipakai untuk mengisi profile awal.
- Auth dan akses data tetap bergantung pada session Supabase dan RLS.
- Jangan menaruh service role key di client atau `NEXT_PUBLIC_*`.
