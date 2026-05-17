# Panduan Manual Setup Supabase Dashboard (Settings & Auth)

Dokumen ini merupakan referensi esensial bagi pengembang atau *administrator* proyek **CatatZ** untuk mengonfigurasi *dashboard* Supabase agar fitur-fitur **Settings & Authentication** yang baru saja diimplementasikan (seperti *Google OAuth*, *Reset Password*, *Active Sessions*, dan *Avatar Upload*) dapat berfungsi secara optimal.

---

## 1. Supabase Auth Settings

Konfigurasi ini memastikan agar sistem otentikasi dapat mendeteksi asal _request_ yang valid dan mengizinkan transisi antar URL.

Masuk ke **Authentication > URL Configuration** di Supabase Dashboard:

- **Site URL (Development):** `http://localhost:3000`
- **Site URL (Production):** `https://domain-anda.com` (Ubah jika sudah _deploy_)
- **Redirect URLs:** Tambahkan daftar *wildcard* atau URL spesifik untuk memastikan *redirect* login, reset password, dan OAuth berjalan lancar. Tambahkan nilai berikut:
  - `http://localhost:3000/**` (Wajib untuk *development*)
  - `https://domain-anda.com/**` (Wajib untuk *production*)

---

## 2. Email Reset Password

Agar _flow_ lupa sandi (*Forgot Password*) mengarahkan pengguna ke halaman pembuatan sandi baru yang tepat, template bawaan Supabase perlu disesuaikan.

Masuk ke **Authentication > Email Templates > Reset Password**:

- **Subject:** `Reset Password CatatZ Anda`
- **Body:** Anda bisa menggunakan format HTML atau Text. Pastikan Anda menyematkan tautan (link) yang mengarahkan pengguna ke *callback handler* bawaan proyek:
  
  ```html
  <h2>Reset Password</h2>
  <p>Klik tautan di bawah ini untuk mereset kata sandi Anda:</p>
  <a href="{{ .SiteURL }}/auth/callback?next=/reset-password&code={{ .TokenHash }}">Reset Kata Sandi</a>
  ```
  > **Catatan Penting:** Proyek ini menggunakan arsitektur PKCE di App Router Next.js. Pastikan tautan menyertakan parameter `next=/reset-password` agar setelah sesi disahkan oleh `auth/callback/route.ts`, pengguna langsung diarahkan ke layar `/reset-password`.

---

## 3. Google OAuth

Fitur *Login with Google* dan *Connected Account* membutuhkan persetujuan integrasi dari Google Cloud Console.

Masuk ke **Authentication > Providers > Google**:

- **Enable Provider:** Nyalakan (Toggle ON).
- **Client ID:** Masukkan *Client ID* yang didapat dari Google Cloud Console.
- **Client Secret:** Masukkan *Client Secret* yang didapat dari Google Cloud Console.
- **Authorized Redirect URI:** Salin URL yang diberikan oleh Supabase (format: `https://<project-ref>.supabase.co/auth/v1/callback`) dan tempel di *Authorized redirect URIs* pada layar OAuth Google Cloud Console Anda.
- *(Tidak ada environment variable tambahan di proyek ini untuk Google Client ID, sebab semuanya dikelola langsung di Supabase Dashboard).*

---

## 4. Supabase Storage

Fitur unggah *Avatar* membutuhkan *bucket* penyimpanan yang terbuka secara publik namun aman dari manipulasi.

Masuk ke **Storage > Buckets**:

- **Buat Bucket Baru:**
  - **Name:** `avatars`
  - **Public:** `True` (Disarankan agar gambar dapat dimuat di UI tanpa token URL).
- **Storage Policy:**
  Pastikan bahwa *Row Level Security* (RLS) diaktifkan. Anda hanya perlu menjalankan migrasi `009-avatars-storage.sql` di SQL Editor, atau memastikan aturan berikut secara manual:
  - **SELECT:** `FOR SELECT USING (bucket_id = 'avatars');`
  - **INSERT/UPDATE/DELETE:** Policy berbasis kepemilikan folder (`auth.uid()::text = (storage.foldername(name))[1]`).
- **Rekomendasi File:**
  - Pada UI aplikasi sudah dibatasi maksimal 2MB dengan format `jpeg, png, webp`. Anda boleh menambahkan batas serupa di pengaturan *bucket* Supabase secara opsional.

---

## 5. Environment Variables

Pastikan variabel-variabel berikut tersedia pada `.env` (untuk *local*) atau *Environment Variables* di platform *hosting* (seperti Vercel):

- `NEXT_PUBLIC_SUPABASE_URL` = URL proyek Supabase (berawalan `https://`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *Anon public key* Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` = *Service role key* rahasia Supabase. (Sangat wajib diisi untuk fitur *Delete Account* via Admin API).
- `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` (atau URL produksi di Vercel).

---

## 6. Security Notes

Perhatikan peringatan keamanan yang mengikat konfigurasi _Auth_ & _Database_ Anda:

1. **Service Role Hanya untuk Server**: Variabel `SUPABASE_SERVICE_ROLE_KEY` **TIDAK BOLEH** diawali dengan `NEXT_PUBLIC_`. Hal ini dapat menyebabkan bypass penuh terhadap RLS jika sampai bocor ke browser pengguna.
2. **Jangan Commit `.env`**: Seluruh _secrets_ harus berada di `.env.local` yang masuk ke `.gitignore`. Gunakan `.env.example` sekadar untuk dokumentasi format.
3. **Rahasiakan OAuth Secret**: Google Client Secret harus di-input langsung ke *dashboard* Supabase, jangan dituliskan dalam _source code_.
4. **Wajib RLS Aktif**: Semua tabel pengguna (seperti `user_sessions`, `user_preferences`, dan tabel transaksi) *WAJIB* di-*Enable* RLS-nya.
5. **Policy Owner-Only**: Jangan sembarangan menggunakan `USING (true)`. Semua tabel data pribadi bertumpu pada pemeriksaan konstan `auth.uid() = user_id`.

---

## 7. Production Deployment Notes

Panduan akhir ketika akan menaikkan status proyek ke *Production* (seperti via Vercel):

- **Perbedaan URL**: 
  - Pastikan `NEXT_PUBLIC_APP_URL` diubah menjadi domain Vercel.
  - Tambahkan domain Vercel ke **Site URL** dan **Redirect URLs** di *dashboard* Supabase Anda.
  - Tambahkan domain Vercel ke **Authorized Javascript Origins** di Google Cloud Console.
- **Checklist Sebelum Deploy**:
  - `npm run build` berhasil di mesin lokal.
  - _Environment Variables_ komplit sudah dimasukkan ke halaman _Project Settings_ Vercel.
  - *Database migrations* sudah tersinkronisasi murni dengan *database production* Supabase (`npx supabase db push` atau jalankan manual lewat SQL Editor).
- **Testing Setelah Deploy**:
  - Buat satu akun uji coba (*dummy*).
  - Unggah foto profil *avatar*.
  - *Login* pakai *device* berbeda dan pantau kemunculannya di bilah *Active Sessions*.
  - Lakukan *Delete Account* akun uji coba tersebut dan validasi apakah data transaksi dan akunnya benar-benar hangus dari *dashboard* Supabase Anda.
