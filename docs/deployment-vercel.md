# Deployment Vercel

## Platform

Project disiapkan untuk deployment ke Vercel.

File terkait:

- `vercel.json`
- `package.json`
- `next.config.ts`
- `src/configs/environment.ts`

## Konfigurasi Vercel

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "regions": ["sin1"]
}
```

Region production diset ke `sin1`.
`buildCommand` dikunci di repository agar setting dashboard Vercel tidak menjalankan default `next build` yang memakai Turbopack pada Next.js 16.

## Package Manager

Repository memakai npm karena ada `package-lock.json`.

## Build Command

```bash
npm run build
```

Script build aktual:

```bash
next build --webpack
```

Catatan: webpack dipakai agar Serwist menghasilkan `public/sw.js`.

Serwist dikonfigurasi dengan `disable: process.env.NODE_ENV !== "production"`. Build production tetap mengaktifkan Serwist, sehingga Vercel wajib menjalankan `npm run build` yang meneruskan flag `--webpack`.

## Output Directory

Tidak ada output directory custom di `vercel.json`. Gunakan default Next.js/Vercel.

## Environment Variables di Vercel

Set minimal:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `AI_API_KEY`
- `AI_MODEL`

Jangan set `ALLOWED_DEV_ORIGINS` di Vercel Production.

## Supabase Production Settings

Pastikan Supabase production memiliki:

- Schema dan migration sesuai `src/migrations`.
- RLS aktif untuk table user-owned.
- Grant API sesuai pernyataan `GRANT` di masing-masing migration table.
- Bucket `avatars` dan policy storage sesuai migration.

## Supabase Auth Site URL

Set ke domain production aplikasi.

Contoh:

```txt
https://catatz.example.com
```

## Supabase Redirect URLs

Tambahkan minimal:

```txt
https://catatz.example.com/auth/callback
http://localhost:3000/auth/callback
```

Tambahkan URL local network jika memang dipakai untuk testing mobile.

## Pre-deployment Checklist

- [ ] Environment variable production sudah lengkap.
- [ ] `.env.local` tidak ter-commit.
- [ ] Build local berhasil.
- [ ] Lint/typecheck berhasil sesuai script yang tersedia.
- [ ] Supabase Auth Site URL sudah sesuai domain production.
- [ ] Redirect URL OAuth/email verification sudah sesuai domain production.
- [ ] RLS aktif untuk tabel user-owned.
- [ ] Service role key tidak digunakan di client.
- [ ] `npm run build` menghasilkan `public/sw.js`.
- [ ] `NEXT_PUBLIC_APP_URL` memakai origin production.
- [ ] `AI_API_KEY` tersedia untuk fitur voice parsing.
- [ ] `AI_API_KEY` dan model Gemini mendukung parsing gambar/PDF untuk Auto Fill transaksi.
- [ ] Server Action body limit tetap `4.5mb`; UI/action membatasi file Auto Fill maksimal 4 MB agar request beserta multipart overhead tetap di bawah batas Vercel.

## Post-deployment Checklist

- [ ] Buka domain production.
- [ ] Register user baru dan cek email verification.
- [ ] Login dan logout.
- [ ] Buat rekening pertama.
- [ ] Buat transaksi income/expense.
- [ ] Uji Auto Fill dengan satu gambar dan satu PDF di bawah 4 MB; pastikan file tidak tersimpan dan transaksi baru dibuat hanya setelah menekan `Simpan`.
- [ ] Cek saldo rekening berubah.
- [ ] Cek rekap menampilkan data.
- [ ] Coba export PDF, XLSX, dan CSV.
- [ ] Upload dan hapus avatar.
- [ ] Cek install prompt/PWA di browser yang mendukung.
- [ ] Cek service worker aktif di HTTPS.

## Troubleshooting Deployment

### Build gagal karena env kosong

Pastikan semua env wajib tersedia di Vercel. `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` wajib ada karena divalidasi saat config/module dievaluasi.

### Auth callback gagal

Cek:

- `NEXT_PUBLIC_APP_URL`.
- Supabase Site URL.
- Supabase Redirect URLs.
- Domain production memakai HTTPS.

### Service worker tidak muncul

Cek:

- `vercel.json` memiliki `"buildCommand": "npm run build"`.
- Build log menampilkan `Running "npm run build"` dan `Next.js ... (webpack)`, bukan `Running "next build"` atau `(Turbopack)`.
- `next build --webpack` berhasil.
- `next.config.ts` hanya menonaktifkan Serwist saat `NODE_ENV` bukan `production`.
- File `public/sw.js` ada setelah build.
- Browser mengakses aplikasi melalui HTTPS.

### Data tidak muncul di production

Cek:

- Migration sudah dijalankan.
- RLS policy sesuai.
- Grant API untuk `authenticated` sudah ada.
- User login benar dan `auth.uid()` cocok dengan `user_id`.
