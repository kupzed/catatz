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
- [ ] File Auto Fill divalidasi ukuran, MIME, dan signature sebelum dikirim ke Gemini.
- [ ] File Auto Fill tidak disimpan ke Storage, database, cache, atau log produksi.
- [ ] Service role key terisolasi di serverEnvironment ('server-only') dan tidak diexport dari module publik environment.ts.
- [ ] Production env di Vercel lengkap.
- [ ] `NEXT_PUBLIC_APP_URL` sesuai domain production.

## Auth

- [ ] Supabase Auth Site URL sesuai domain production.
- [ ] Redirect URLs berisi domain production dan URL development yang diperlukan.
- [ ] Origin development tambahan untuk OAuth hanya diizinkan lewat `ALLOWED_DEV_ORIGINS` dan tidak diset di production.
- [ ] Login/register flow sudah dites.
- [ ] Logout membersihkan session dan redirect ke `/login`.
- [ ] Session revocation dicek di middleware dan mewajibkan cookie `device_id` pada protected routes (mencegah bypass revocation via omission).
- [ ] Password update mewajibkan verifikasi password lama (`currentPassword` mandatory re-authentication).
- [ ] Action AI (voice input & file parsing) memvalidasi session user aktif sebelum memanggil API eksternal.
- [ ] Reset password email memakai callback Supabase dan Redirect URLs yang valid.
- [ ] Google OAuth provider aktif di Supabase Dashboard sebelum flow Google dipakai.
- [ ] Manual Linking aktif di Supabase Dashboard sebelum fitur Link Identity Google dipakai.
- [ ] Link Identity Google hanya dianggap sukses jika email Google sama dengan email utama user.

## Storage

- [ ] Bucket `avatars` hanya menyimpan avatar publik.
- [ ] Upload avatar dibatasi ukuran (maks 2MB) dan tipe file strict whitelist (JPG, PNG, WebP; SVG diblokir untuk mencegah Stored XSS).
- [ ] Policy write bucket membatasi folder berdasarkan `auth.uid()`.
- [ ] Jangan menyimpan file privat di bucket public.

## Deployment

- [ ] Build production berhasil.
- [ ] RLS dan grant sudah berjalan di Supabase production.
- [ ] HTTPS aktif.
- [ ] Service worker tidak meng-cache POST atau `/api/*`.
- [ ] Vercel region sesuai kebutuhan.

## Security Notes

- Function `SECURITY DEFINER` saat ini berada di schema `public`: `handle_new_user` dan `update_saldo_rekening`. Function hutang/cicilan dari migration 011 dan guard delete rekening dari migration 012 memakai `SECURITY INVOKER` dan fully qualified object names supaya operasi saldo/sisa hutang dan proteksi referensi rekening tetap mengikuti RLS user yang sedang login.
- `hutang_cicilan` memiliki policy UPDATE via parent `hutang`; pastikan edit cicilan tetap hanya dilakukan untuk row milik user.
- Delete rekening diproteksi di Server Action dan trigger database agar transaksi, hutang/piutang, cicilan, atau template berulang tidak kehilangan referensi rekening.
- Kolom baru `cutoff_day` dan `akumulasi_saldo` pada `user_preferences` serta tabel baru `rekap_periode_custom` (migration `014-rekap-periode.sql`) dilindungi RLS penuh dengan `(select auth.uid()) = user_id`, grant API dibatasi hanya untuk role `authenticated` (tanpa akses `anon`), dan tanpa `SECURITY DEFINER` maupun trigger database (`updated_at` dikelola di application layer).
- Bucket `avatars` public read. Ini cocok untuk avatar, tetapi tidak cocok untuk dokumen privat.
- Bukti transaksi Auto Fill diproses sementara di memory request dan tidak menggunakan bucket `avatars` atau bucket public lain.
- `kategori` memberi SELECT kepada `anon`; RLS hanya memperbolehkan kategori system untuk anon karena `auth.uid()` null tidak cocok dengan kategori user.
- Tidak ada service role key di codebase saat ini. Pertahankan kondisi ini kecuali ada kebutuhan server-only yang kuat.
