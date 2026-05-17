# Audit Settings, Authentication, dan Profile (CatatZ)

Dokumen ini berisi hasil audit menyeluruh terhadap fitur Settings, Authentication, Profile, dan integrasi Supabase pada project CatatZ, sebagai persiapan untuk pengembangan fase selanjutnya (lebih lengkap, modern, aman, dan production-ready).

## 1. Analisa Struktur Folder dan Flow Saat Ini

- **Settings Page & Tabs:**
  Berada di `src/app/(dashboard)/settings`. Menggunakan struktur *client component* untuk navigasi tab (`settings-page-client.tsx` memanggil `profil-tab.tsx`, `keamanan-tab.tsx`, `tampilan-tab.tsx`, dan `export-tab.tsx`).
- **Auth Flow & Pages:**
  Halaman utama ada di `src/app/(auth)/login` dan `src/app/(auth)/register`. Logic backend untuk Sign Up, Sign In, dan Sign Out terpusat di `src/actions/auth-action.ts`.
- **Middleware & Protected Route:**
  CatatZ memakai `src/proxy.ts` sebagai middleware yang memanggil `updateSession` dari `src/configs/supabase/middleware.ts`. Ini memastikan route `/login` dan `/register` tidak bisa diakses saat sudah login, dan melindungi semua route di bawah dashboard.
- **Supabase Integration:**
  Client dan Server terpisah dengan rapi di `src/configs/supabase/server.ts` dan `client.ts`. Server actions memanfaatkan `createServerClient` dari `@supabase/ssr`.
- **Profile & Storage:**
  Database menggunakan tabel `profiles` (merujuk ke `auth.users`). Migration sudah ada di `src/migrations/001-profiles.sql`. Penyimpanan Avatar menggunakan bucket `avatars` (migration `008-avatars-storage.sql`) dengan fungsi update profile dan upload terpusat di `src/actions/profile-action.ts`.
- **Theme Preference:**
  Dikelola oleh `next-themes` dan komponen `TampilanTab` tanpa masalah.
- **Logout Flow:**
  Diletakkan di `src/components/common/app-sidebar.tsx`, memanggil server action `signOut()`.

## 2. File Terkait (Source of Truth)

**Halaman & UI:**
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/_components/settings-page-client.tsx`
- `src/app/(dashboard)/settings/_components/profil-tab.tsx`
- `src/app/(dashboard)/settings/_components/keamanan-tab.tsx`
- `src/app/(dashboard)/settings/_components/tampilan-tab.tsx`
- `src/app/(dashboard)/settings/_components/export-tab.tsx`
- `src/components/common/app-sidebar.tsx`
- `src/app/(auth)/login/page.tsx` & `src/app/(auth)/register/page.tsx`

**Logic & Data:**
- `src/actions/auth-action.ts`
- `src/actions/profile-action.ts`
- `src/configs/supabase/middleware.ts` & `server.ts`
- `src/proxy.ts`

**Database:**
- `src/migrations/001-profiles.sql`
- `src/migrations/008-avatars-storage.sql`

## 3. Hasil Audit Teknis

### A. Komponen yang Masih Bisa Dipakai
1. **`TampilanTab` dan `ExportTab`**: Keduanya sudah cukup matang, berfungsi baik (`next-themes` dan fitur eksport PDF `pdf-generator.ts`).
2. **`profile-action.ts`**: Fungsi update profile dan `uploadAvatar` sudah ada validasi file type dan size limits.
3. **Middleware Flow**: Mekanisme auth redirect di `proxy.ts` + `@supabase/ssr` sudah aman dan menggunakan best practice Next.js App Router.

### B. Komponen yang Perlu Di-refactor
1. **Inkonsistensi Form Validation**:
   Di `keamanan-tab.tsx`, validasi form memakai `react-hook-form` dan `zod`, namun di `profil-tab.tsx` masih menggunakan `useState` biasa tanpa standar validasi Zod.
2. **Duplikasi Komponen UI**:
   Terdapat komponen lokal `SettingRow` di dalam `profil-tab.tsx` dan `keamanan-tab.tsx`. Ini harus dipindahkan menjadi reusable component (misal di `src/components/ui` atau `common/settings-row.tsx`) agar style seragam.
3. **Avatar Cache**:
   Avatar menggunakan query parameter cache-buster `?t=...` saat di-update. Ini bisa direfactor ke implementasi React Cache atau *revalidateTag* jika dibutuhkan, namun sistem saat ini *acceptable*.

### C. Fitur Settings/Auth yang Belum Berfungsi / Kurang
1. **Lupa Password (Forgot Password)**: Belum ada flow untuk user yang lupa password. (Perlu route `/forgot-password`, `/reset-password`, dan fungsi di `auth-action.ts`).
2. **Delete Account**: Tidak ada opsi bagi user untuk menghapus akunnya sendiri beserta seluruh datanya secara permanen.
3. **Session Management**: User tidak bisa melihat di perangkat mana saja akun mereka sedang *logged in* (Active sessions monitoring).

### D. Risiko Keamanan (Security Audit)
1. **Change Password via Old Password**:
   Di `profile-action.ts` fungsi `changePassword`, sistem melakukan verifikasi password lama dengan menjalankan `supabase.auth.signInWithPassword`. Pendekatan ini berisiko terkena *rate limit* dari Supabase jika ada percobaan *brute-force* pada form ganti password. Supabase menyediakan flow Reauthentication (walaupun lebih kompleks untuk SPA) atau sebaiknya diimbangi dengan pemberitahuan email ketika password berubah.
2. **Session Hijacking Guard**:
   Jika user sign out, Supabase SSR secara default menghapus session cookie. Akan lebih aman bila dilengkapi *Active Session Termination* ketika melakukan ganti password, agar semua sesi di device lain *forced out*.
3. **No SUPABASE_SERVICE_ROLE_KEY leak**: Audit mengonfirmasi tidak ada eksposur API key berbahaya di sisi client atau action secara eksplisit. Semua masih terjaga di backend actions dan environment variables.

### E. Risiko Breaking Change
- Mengubah fungsi di `auth-action.ts` atau `proxy.ts` dapat mematahkan flow login yang berjalan saat ini (menyebabkan *infinite redirect loop*). Testing manual sangat penting setiap kali mengupdate file ini.
- Merubah struktur table `profiles` di masa depan harus melalui migration file baru di `src/migrations`, bukan merusak `001-profiles.sql` (Aturan Repository: Jangan mengubah migration lama).

## 4. Rekomendasi Urutan Implementasi (Phase Berikutnya)

Demi menjaga kestabilan aplikasi, implementasi perubahan sebaiknya mengikuti urutan berikut:

1. **Refactor UI Settings (Low Risk)**
   - Buat komponen reusable `SettingRow`.
   - Implementasikan *Zod* & *react-hook-form* pada halaman `profil-tab.tsx`.
2. **Implementasi Lupa Password & Reset (Medium Risk)**
   - Buat page `/forgot-password` dan `/reset-password`.
   - Tambahkan action terkait di `auth-action.ts`.
   - Update `proxy.ts` jika route baru butuh status publik.
3. **Penyempurnaan Fitur Keamanan (Medium Risk)**
   - Perbaiki mekanisme ganti password (tambahkan notifikasi perubahan).
   - Buat list "Active Sessions" di `keamanan-tab.tsx`.
4. **Fitur Delete Account (High Risk)**
   - Tambahkan button Delete Account di settings.
   - Buat logic yang aman menggunakan trigger database atau service role key di backend untuk membersihkan *auth.users*, *profiles*, *transaksi*, dan storage avatar milik user.
