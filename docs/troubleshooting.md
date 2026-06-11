# Troubleshooting

## Gagal login

Kemungkinan penyebab:

- Email/password salah.
- Email belum diverifikasi di Supabase.
- `NEXT_PUBLIC_SUPABASE_URL` atau `NEXT_PUBLIC_SUPABASE_ANON_KEY` salah.
- Supabase Auth setting belum sesuai.

Solusi:

- Cek user di Supabase Auth.
- Cek env local/production.
- Restart dev server setelah mengubah env.
- Cek browser console dan server terminal tanpa membagikan secret.

## Gagal login di mobile device saat local development

Kemungkinan penyebab:

- Aplikasi dibuka dari IP lokal, tetapi `NEXT_PUBLIC_APP_URL` masih `localhost`.
- Supabase Redirect URLs belum berisi IP lokal.
- `ALLOWED_DEV_ORIGINS` belum berisi host lokal.
- Cookie/session berada di origin berbeda.

Solusi:

- Set `NEXT_PUBLIC_APP_URL=http://IP_LOCAL:3000`.
- Set `ALLOWED_DEV_ORIGINS=IP_LOCAL:3000,localhost:3000`.
- Tambahkan `http://IP_LOCAL:3000/auth/callback` ke Supabase Redirect URLs.
- Gunakan URL yang konsisten dari login sampai callback.

## Session tidak tersimpan

Kemungkinan penyebab:

- Cookie tidak terset karena origin berubah.
- Redirect dari Supabase memakai domain berbeda.
- Proxy/session refresh tidak berjalan untuk route tersebut.

Solusi:

- Cek `src/proxy.ts` matcher.
- Cek `src/configs/supabase/middleware.ts`.
- Pastikan domain callback sama dengan domain app.
- Di production, gunakan HTTPS.

## Redirect URL Supabase salah

Kemungkinan penyebab:

- `NEXT_PUBLIC_APP_URL` salah.
- Supabase Site URL salah.
- Redirect URLs belum berisi `/auth/callback`.
- Development/ngrok memakai origin request yang belum ada di `ALLOWED_DEV_ORIGINS`.
- `/auth/callback` belum masuk allowlist Redirect URLs Supabase untuk origin yang sedang dipakai.

Solusi:

- Update `NEXT_PUBLIC_APP_URL`.
- Update Supabase Auth Site URL.
- Untuk ngrok development, set `ALLOWED_DEV_ORIGINS=morphing-easeful-starry.ngrok-free.dev,localhost:3000`, lalu restart dev server.
- Tambahkan Redirect URL:

```txt
http://localhost:3000/auth/callback
https://morphing-easeful-starry.ngrok-free.dev/auth/callback
https://domain-production/auth/callback
```

## OAuth code mendarat di `/login?code=...`

Kemungkinan penyebab:

- Supabase Auth Site URL atau redirect target masih mengarah ke halaman auth, bukan `/auth/callback`.
- Origin ngrok/local belum diizinkan di `ALLOWED_DEV_ORIGINS`.
- `/auth/callback` belum ada di Supabase Redirect URLs untuk origin tersebut.

Solusi:

- Pastikan Server Action Google OAuth memakai callback `/auth/callback?next=/transaksi`.
- Pastikan Supabase Redirect URLs berisi origin yang dipakai, misalnya `https://morphing-easeful-starry.ngrok-free.dev/auth/callback`.
- Restart dev server setelah mengubah `.env.local`.
- Middleware memiliki safety net yang memindahkan `/login?code=...` dan `/register?code=...` ke `/auth/callback` dengan query yang sama, tetapi konfigurasi Supabase tetap harus dibetulkan.

## `bad-precaching-response` dari `/sw.js` saat development

Kemungkinan penyebab:

- Service worker production lama masih terdaftar di origin development/ngrok.
- Browser mencoba precache asset `_next/static/media/*` dari build lama yang sudah tidak tersedia.

Solusi:

- Jalankan app dalam development seperti biasa; hook PWA akan mencoba unregister service worker lama dan menghapus cache `serwist-*`/`catatz-*`.
- Reload halaman setelah cleanup berjalan.
- Jika browser masih memakai service worker lama, hapus site data untuk origin ngrok/local dari DevTools.
- Service worker penuh hanya divalidasi di production build melalui `npm run build`.

## Warning Serwist tentang `next dev --turbopack` di Vercel

Penyebab:

- `@serwist/next` menampilkan warning saat environment `TURBOPACK` tersedia dan opsi `disable` bernilai false.
- Vercel dapat menjalankan phase deteksi/config non-production dengan environment tersebut sebelum build webpack dimulai.
- Warning ini tidak berarti `npm run build` memakai Turbopack; script production tetap `next build --webpack`.

Solusi:

- Pertahankan `disable: process.env.NODE_ENV !== "production"` di `next.config.ts`.
- Pertahankan script build `next build --webpack`.
- Jangan menambahkan suppression global jika warning dapat dihindari dengan menonaktifkan Serwist pada phase non-production.

## Build error

Kemungkinan penyebab:

- Env wajib kosong.
- Type/lint error.
- Dependency belum terinstall.
- Build tidak memakai webpack sehingga service worker tidak ter-generate.

Solusi:

- Jalankan `npm install`.
- Isi `.env.local`.
- Jalankan `npm run lint`.
- Jalankan `npm run build`.
- Pastikan script build tetap `next build --webpack`.

## Environment variable tidak terbaca

Kemungkinan penyebab:

- File env salah nama.
- Dev server belum direstart.
- Variable public tidak memakai `NEXT_PUBLIC_`.
- Variable server-only diakses dari client.

Solusi:

- Gunakan `.env.local` untuk local development.
- Restart `npm run dev`.
- Cek dokumentasi [Environment Variables](./environment-variables.md).
- Jangan expose secret dengan `NEXT_PUBLIC_`.

## RLS menolak query

Kemungkinan penyebab:

- User belum login.
- Row tidak memiliki `user_id` yang sama dengan `auth.uid()`.
- Grant API belum dijalankan.
- Policy belum ada untuk action tersebut.

Solusi:

- Cek session dengan `supabase.auth.getUser()`.
- Cek nilai `user_id` row.
- Cek policy di [RLS Policies](./rls-policies.md).
- Review pernyataan `GRANT` pada migration table terkait di `src/migrations`.

## Migration gagal

Kemungkinan penyebab:

- Migration dijalankan tidak sesuai urutan.
- Object sudah ada.
- Ada duplicate prefix `008`.
- Operation recreate table konflik dengan data/constraint.

Solusi:

- Review `src/migrations` sebelum menjalankan.
- Jangan ubah migration lama yang sudah production.
- Jalankan di staging/local dulu.
- Backup database sebelum migration production.
- Cek [Database Migrations](./database-migrations.md).

## Data tidak muncul karena `user_id` atau `auth.uid()`

Kemungkinan penyebab:

- Row dibuat tanpa `user_id`.
- Row dibuat dengan user berbeda.
- Profile belum dibuat oleh trigger `handle_new_user`.

Solusi:

- Cek row `profiles`.
- Cek `user_id` di table terkait.
- Cek trigger `on_auth_user_created`.
- Pastikan insert lewat Server Action mengambil user dari session.

## Avatar gagal upload

Kemungkinan penyebab:

- Bucket `avatars` belum ada.
- Policy storage belum dijalankan.
- File bukan image.
- File lebih dari 2 MB.

Solusi:

- Jalankan/review migration `008-avatars-storage.sql`.
- Pastikan bucket `avatars` public.
- Upload file image di bawah 2 MB.

## Export file gagal

Kemungkinan penyebab:

- Tidak ada transaksi pada filter tanggal.
- Dynamic import generator PDF atau spreadsheet gagal.
- Dependency export seperti `jspdf`, `jspdf-autotable`, atau `exceljs` gagal dimuat.
- Data transaksi tidak bisa dibaca karena RLS/session.

Solusi:

- Cek jumlah transaksi di tab Export Data.
- Coba filter semua waktu.
- Pastikan user login.
- Cek error console/server.

## Error deployment Vercel

Kemungkinan penyebab:

- Env production belum lengkap.
- Supabase Redirect URL belum mengarah ke domain production.
- Build gagal.
- Service worker tidak dibuat.

Solusi:

- Isi env Vercel.
- Jalankan build lokal.
- Cek `public/sw.js` setelah build.
- Cek [Deployment Vercel](./deployment-vercel.md).
