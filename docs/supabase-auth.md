# Supabase Auth

## Provider

Provider yang terlihat di codebase:

- Email/password.
- Google OAuth.
- Google Link Identity untuk user login dari `/settings`.

## File Terkait

- `src/actions/auth-action.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/(dashboard)/settings/_components/connected-account-section.tsx`
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
5. User diarahkan ke `/transactions`.
6. Session disimpan melalui mekanisme cookie Supabase SSR.

## Google OAuth Login/Register Flow

1. User memilih tombol Google di `/login` atau `/register`.
2. Client memanggil Server Action `signInWithGoogle`.
3. Action memanggil `supabase.auth.signInWithOAuth({ provider: "google" })`.
4. `redirectTo` diarahkan ke `{allowed-origin}/auth/callback?next=/transactions`.
5. Setelah Google dan Supabase selesai, `/auth/callback` menukar `code` dengan session.
6. Jika sukses, callback melakukan smart profile sync untuk nama/avatar kosong, mencatat session, lalu redirect ke `/transactions`.

Jika user email/password sudah ada dan user masuk via Google dengan email terverifikasi yang sama, automatic identity linking ditangani oleh Supabase Auth.

## Register Flow

1. User membuka `/register`.
2. Form memanggil Server Action `signUp`.
3. `signUp` memanggil `supabase.auth.signUp`.
4. Metadata yang dikirim: `name`.
5. `emailRedirectTo` diarahkan ke `{allowed-origin}/auth/callback?next=/transactions`.
6. User diminta mengecek email verifikasi.
7. Setelah link diklik, Supabase mengarahkan ke `/auth/callback`.
8. Route Handler callback menukar `code` menjadi session.
9. Jika berhasil, user diarahkan ke route `next`, default `/transactions`.

## Logout Flow

1. User memilih keluar dari menu akun/sidebar.
2. Server Action `signOut` memanggil `supabase.auth.signOut()`.
3. Layout di-revalidate.
4. User diarahkan ke `/login`.

Ada juga `useAuthStore` di `src/stores/auth-store.ts` yang memiliki method `signOut` client-side, tetapi flow sidebar memakai Server Action `signOut`.

## Reset Password

Status: Aktif.

Yang tersedia saat ini:

- Route `/forgot-password` mengirim email reset password melalui `resetPasswordForEmail`.
- Route `/reset-password` menyimpan password baru melalui `updateUser({ password })` setelah callback Supabase membuat session reset.
- Tab `Keamanan` di `/settings`.
- Server Action `changePassword`.
- User harus sudah login.
- Password lama diverifikasi dengan `signInWithPassword`.
- Password baru disimpan dengan `supabase.auth.updateUser({ password })`.

## Google OAuth

Status: Aktif untuk login/register dan Link Identity.

Implementasi terkait:

- `signInWithGoogle` untuk OAuth login/register.
- `linkGoogleIdentity` untuk menghubungkan Google dari Settings.
- `unlinkGoogleIdentity` untuk memutus Google jika user masih punya identity login lain.
- `/auth/callback` mendukung query `flow=link_google`.

Flow Link Identity:

1. User login email/password membuka `/settings`.
2. `SettingsPage` mengambil identity aktual via `supabase.auth.getUserIdentities()`.
3. Bagian Akun Terhubung menampilkan status Google.
4. Tombol Hubungkan memanggil `linkGoogleIdentity`.
5. Action memanggil `supabase.auth.linkIdentity({ provider: "google" })` dengan redirect ke `{allowed-origin}/auth/callback?next=/settings&flow=link_google`.
6. Callback memvalidasi identity Google yang baru terhubung.
7. Jika email Google sama dengan email utama user, user kembali ke `/settings?message=google-linked`.
8. Jika email Google berbeda, callback mencoba `unlinkIdentity` dan user kembali ke `/settings` dengan message error.

Catatan konfigurasi: Manual Linking harus aktif di Supabase Dashboard Authentication > Providers agar `linkIdentity` dapat digunakan.

## Session Handling

Supabase SSR client:

- Browser client: `src/configs/supabase/client.ts`.
- Server client: `src/configs/supabase/server.ts`.
- Middleware/proxy client: `src/configs/supabase/middleware.ts`.

Server client memakai `cookies()` dari `next/headers` dan mengatur cookie `secure` berdasarkan `environment.isProduction`.

## Middleware/Proxy Protection

Project memakai `src/proxy.ts`.

Protected route rule:

- Auth page: `/login`, `/register`, `/forgot-password`, `/reset-password`.
- Auth callback: `/auth/callback`.
- Public route: `/`.
- Selain itu dianggap protected.

Behavior:

- Protected route tanpa user -> redirect `/login`.
- Auth page dengan user -> redirect `/`.
- `/auth/callback` tetap public agar auth code Supabase bisa ditukar menjadi session.
- Jika `/login` atau `/register` menerima query `code`, middleware mengalihkan request ke `/auth/callback` dengan query yang sama. Ini safety net untuk konfigurasi Supabase yang masih mengirim auth code ke halaman auth.
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

Auth actions membuat callback URL dengan helper server-side:

- Production selalu memakai `NEXT_PUBLIC_APP_URL`.
- Development memilih origin request jika host tersebut ada di `ALLOWED_DEV_ORIGINS`.
- Jika origin request development tidak diizinkan, action mengembalikan error jelas dan tidak memulai redirect OAuth ke URL yang salah.

Development default:

```txt
http://localhost:3000/auth/callback?next=/transactions
http://localhost:3000/auth/callback?next=/settings&flow=link_google
```

Development dengan ngrok:

```txt
https://morphing-easeful-starry.ngrok-free.dev/auth/callback?next=/transactions
https://morphing-easeful-starry.ngrok-free.dev/auth/callback?next=/settings&flow=link_google
```

Production:

```txt
{NEXT_PUBLIC_APP_URL}/auth/callback?next=/transactions
{NEXT_PUBLIC_APP_URL}/auth/callback?next=/settings&flow=link_google
```

Supabase Auth Site URL dan Redirect URLs harus memasukkan domain production dan URL local yang dipakai untuk development/mobile testing.

Untuk Google Cloud OAuth, Authorized redirect URI tetap callback Supabase:

```txt
https://<project-ref>.supabase.co/auth/v1/callback
```

Authorized JavaScript origin harus berisi origin app yang sedang dipakai, misalnya `https://morphing-easeful-starry.ngrok-free.dev`.

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
