# Security Checklist

## Supabase

- [ ] RLS aktif di semua tabel user-owned.
- [ ] Policy INSERT memakai `WITH CHECK`.
- [ ] Policy UPDATE/DELETE membatasi row milik user.
- [ ] Table yang diberi `GRANT` tetap dilindungi RLS.
- [ ] `anon` hanya mendapat akses yang benar-benar diperlukan.
- [ ] Schema/table baru tidak dibiarkan tanpa RLS.
- [ ] Migration production direview sebelum dijalankan.
- [ ] Function `SECURITY DEFINER` direview berkala.

## Next.js

- [ ] Route protected dicek oleh `src/proxy.ts`.
- [ ] Dashboard layout tetap memvalidasi user.
- [ ] Action mutasi memastikan user login sebelum insert user-owned data.
- [ ] Error boundary tidak membocorkan detail internal.
- [ ] Security headers di `next.config.ts` tetap aktif.
- [ ] POST dan route auth-sensitive tidak di-cache oleh service worker.

Security headers saat ini:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: frame-ancestors 'none'`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=(), usb=()`

## Environment Variables

- [ ] `.env` dan `.env.local` tidak ter-commit.
- [ ] Secret tidak memakai prefix `NEXT_PUBLIC_`.
- [ ] `AI_API_KEY` hanya server-side.
- [ ] Service role key tidak digunakan di client.
- [ ] Production env di Vercel lengkap.
- [ ] `NEXT_PUBLIC_APP_URL` sesuai domain production.

## Auth

- [ ] Supabase Auth Site URL sesuai domain production.
- [ ] Redirect URLs berisi domain production dan URL development yang diperlukan.
- [ ] Login/register flow sudah dites.
- [ ] Logout membersihkan session dan redirect ke `/login`.
- [ ] Password update hanya untuk user login.
- [ ] Reset password email belum ada; jangan klaim tersedia sebelum diimplementasikan.
- [ ] Google OAuth belum ada; jangan klaim tersedia sebelum diimplementasikan.

## Storage

- [ ] Bucket `avatars` hanya menyimpan avatar publik.
- [ ] Upload avatar dibatasi ukuran dan tipe file.
- [ ] Policy write bucket membatasi folder berdasarkan `auth.uid()`.
- [ ] Jangan menyimpan file privat di bucket public.

## Deployment

- [ ] Build production berhasil.
- [ ] RLS dan grant sudah berjalan di Supabase production.
- [ ] HTTPS aktif.
- [ ] Service worker tidak meng-cache POST atau `/api/*`.
- [ ] Vercel region sesuai kebutuhan.

## Security Notes

- Function `SECURITY DEFINER` saat ini berada di schema `public`: `handle_new_user`, `update_saldo_rekening`, `update_sisa_hutang`, `update_saldo_rekening_hutang`, dan `update_saldo_rekening_cicilan`. Ini perlu review keamanan berkala karena `public` adalah exposed schema di Supabase.
- Bucket `avatars` public read. Ini cocok untuk avatar, tetapi tidak cocok untuk dokumen privat.
- `kategori` memberi SELECT kepada `anon`; RLS hanya memperbolehkan kategori system untuk anon karena `auth.uid()` null tidak cocok dengan kategori user.
- Tidak ada service role key di codebase saat ini. Pertahankan kondisi ini kecuali ada kebutuhan server-only yang kuat.
