# Setup Local

## Prasyarat

- Node.js 24.x sesuai field `engines` di `package.json`.
- npm, karena repository memakai `package-lock.json`.
- Akses ke project Supabase yang sudah memiliki schema sesuai `src/migrations`.
- Environment variable Supabase dan Gemini API.

## Install Dependency

```bash
npm install
```

## Setup Environment

Buat file `.env.local` dari `.env.example`.

```powershell
Copy-Item .env.example .env.local
```

Untuk shell lain:

```bash
cp .env.example .env.local
```

Isi minimal:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Jangan menaruh service role key di variable `NEXT_PUBLIC_*`.

## Menjalankan Development Server

```bash
npm run dev
```

Buka:

```txt
http://localhost:3000
```

Root `/` akan redirect ke `/transaksi`. Jika belum login, proxy akan redirect ke `/login`.

## Command Validasi

```bash
npm run lint
npm run build
```

Tidak ada script `type-check` dan tidak ada script `test` di `package.json` saat dokumentasi ini dibuat.

## Supabase Local

Repository saat ini tidak memiliki folder `supabase/`, `supabase/config.toml`, atau migration CLI di `supabase/migrations`. Migration SQL manual berada di `src/migrations`.

Jika ingin memakai Supabase CLI local di masa depan:

- Buat setup `supabase/` secara eksplisit.
- Jangan memindahkan atau mengubah migration production lama tanpa rencana migrasi.
- Buat migration baru untuk perubahan schema berikutnya.
- Sinkronkan dokumentasi database setelah migration baru dibuat.

## PWA Local

- Development mode menonaktifkan Serwist melalui `disable: process.env.NODE_ENV === "development"`.
- Service worker production dibuat saat `npm run build`.
- Untuk test PWA lengkap, gunakan build production dan akses via HTTPS/domain yang valid.

## Local Network/Mobile Testing

Jika development server diakses dari perangkat lain di jaringan lokal, set `NEXT_PUBLIC_APP_URL` dan `ALLOWED_DEV_ORIGINS` secara konsisten.

Contoh:

```env
NEXT_PUBLIC_APP_URL=http://192.168.1.10:3000
ALLOWED_DEV_ORIGINS=192.168.1.10:3000,localhost:3000
```

Pastikan Supabase Redirect URLs juga mengizinkan URL yang sama.

## Masalah Umum

- Env berubah tetapi tidak terbaca: restart `npm run dev`.
- Login callback gagal: cek `NEXT_PUBLIC_APP_URL` dan Redirect URLs di Supabase.
- Mobile local login gagal: cek domain/IP lokal, cookie origin, dan `ALLOWED_DEV_ORIGINS`.
- Build gagal karena env wajib kosong: isi `.env.local` atau env Vercel.
- Service worker tidak muncul setelah build: pastikan command build adalah `npm run build` yang menjalankan `next build --webpack`.
