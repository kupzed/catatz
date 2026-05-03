# Setup, Konfigurasi & Deployment

## Environment Variables

File: `c:\laragon\www\catatz\.env`

```env
# ─── Supabase ─────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...    # Public, aman di browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...        # RAHASIA, hanya server

# ─── AI (Google Gemini) ───────────────────────────────────
AI_API_KEY=AIzaSy...
AI_MODEL=gemini-2.5-flash-lite   # Ganti model di sini

# ─── App ──────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CatatZ
```

> ⚠️ **JANGAN** commit `.env` ke Git. File ini sudah ada di `.gitignore`.

---

## Setup Lokal (Pertama Kali)

### 1. Install dependencies
```bash
cd c:\laragon\www\catatz
npm install
```

### 2. Buat Supabase Project
1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Pilih region: **Southeast Asia (Singapore)**
3. Catat Database Password Anda

### 3. Ambil API Keys
Dashboard Supabase → **Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Jalankan SQL Migrations
Dashboard Supabase → **SQL Editor** → Run (urutan 001–007):

```
src/migrations/001-profiles.sql
src/migrations/002-rekening.sql
src/migrations/003-kategori.sql   ← includes seed 18 default kategori
src/migrations/004-transaksi.sql  ← includes balance trigger
src/migrations/005-hutang.sql     ← includes cicilan trigger
src/migrations/006-budget.sql
src/migrations/007-recurring.sql
```

### 5. Konfigurasi Auth
Dashboard Supabase → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: tambahkan `http://localhost:3000/**`

### 6. Jalankan Dev Server
```bash
npm run dev
# App berjalan di http://localhost:3000
```

---

## Scripts

| Command | Keterangan |
|---|---|
| `npm run dev` | Dev server dengan hot reload |
| `npm run build` | Build production bundle |
| `npm run start` | Jalankan production build |
| `npm run lint` | Cek kode dengan ESLint |
| `npx tsc --noEmit` | Type check tanpa build |

---

## Deploy ke Vercel

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit: CatatZ v0.1"
git remote add origin https://github.com/username/catatz.git
git push -u origin main
```

### 2. Connect ke Vercel
1. Buka [vercel.com](https://vercel.com) → **New Project**
2. Import repository GitHub Anda
3. Framework: **Next.js** (auto-detected)

### 3. Set Environment Variables di Vercel
Dashboard Vercel → **Settings → Environment Variables**. Tambahkan semua variable dari `.env`, kecuali ubah:
```
NEXT_PUBLIC_APP_URL=https://catatz.vercel.app  ← URL production Anda
```

### 4. Update Supabase Auth
Dashboard Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://catatz.vercel.app`
- **Redirect URLs**: tambahkan `https://catatz.vercel.app/**`

### 5. Deploy
Vercel auto-deploy setiap push ke `main` branch.

---

## Menambah User Baru

CatatZ sudah multi-user. User bisa:
- Daftar sendiri via `/register`
- Atau dibuat manual di Supabase → **Authentication → Users → Add User**

Setiap user punya data terpisah karena RLS.

---

## Troubleshooting

### Error: "Your project's URL and Key are required"
→ `.env` belum diisi. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Error: relation "public.profiles" does not exist
→ SQL migration belum dijalankan. Jalankan `001-profiles.sql` di Supabase SQL Editor.

### Error: "Both middleware file and proxy file are detected"
→ Hapus `src/middleware.ts` (hanya boleh ada `src/proxy.ts` di Next.js 16).

### Saldo tidak ter-update setelah tambah transaksi
→ Pastikan trigger `trg_transaksi_saldo` sudah berjalan (ada di `004-transaksi.sql`). Cek di Supabase → **Database → Functions**.

### AI Parser tidak berfungsi
→ Cek `AI_API_KEY` di `.env`. Pastikan key valid dari [aistudio.google.com](https://aistudio.google.com).

### Turbopack workspace warning
→ Tambahkan `turbopack: { root: __dirname }` di `next.config.ts` (sudah dilakukan).
