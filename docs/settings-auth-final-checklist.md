# Settings & Auth Final Checklist

Dokumen ini adalah rekapitulasi status *Quality Assurance* (QA) dan *Testing* untuk modul **Settings & Auth** di CatatZ. Seluruh fitur telah divalidasi kelengkapannya dari sisi fungsionalitas, status antarmuka (UI), penanganan *edge case*, serta *build & linting*.

## 1. Fitur yang Sudah Selesai

| Fitur | Status | Catatan |
|---|---|---|
| **Forgot & Reset Password** | ✅ Selesai | Mengamankan *email guessing* (selalu merespons "Terkirim" terlepas email terdaftar atau tidak). Validasi panjang password minimum (8). |
| **Login Google (OAuth)** | ✅ Selesai | Redirect aman. Proses *link* akun lama & pembuatan *profile* untuk akun baru berjalan via Supabase Auth Triggers. |
| **Profile & Avatar** | ✅ Selesai | Mendukung *update* nama. *Avatar upload* memiliki pengecekan nama file (*uid/filename*) sehingga selalu _up-to-date_ dan menghalangi penumpukan *cache*. |
| **System Preference** | ✅ Selesai | Preferensi tersimpan otomatis (Theme, Currency, Date Format). |
| **Connected Account** | ✅ Selesai | Tampilan dinamis antara *Not Connected* dan *Google Connected*. |
| **Active Sessions** | ✅ Selesai | Menampilkan detail *device* (UA-Parser), lokasi, & waktu login. Membedakan *current device* dan memungkinkan pencabutan sesi parsial maupun total. |
| **Logout & Security** | ✅ Selesai | *Logout* membersihkan *cookie device*. Fitur *Delete Account* diamankan melalui Server Action dengan `SUPABASE_SERVICE_ROLE_KEY` dan validasi proteksi input kata "DELETE". |

## 2. Cara Testing Manual

Bagi Anda yang akan melakukan pengujian (*User Acceptance Testing*):

1. **Active Sessions**: 
   - *Login* dari 2 *browser* berbeda (misal: Chrome desktop dan Safari mobile). Buka Settings > Security. Pastikan daftar "Other Sessions" muncul.
   - Klik "Logout All" pada satu *browser*, pastikan *browser* kedua langsung ter-*redirect* ke halaman _login_ pada navigasi (*request*) berikutnya akibat _middleware_ yang mendeteksi `revoked_at`.
2. **Avatar Upload**:
   - Ganti avatar 3x berturut-turut. Pastikan tampilan langsung berubah (tidak menunggu proses lama).
3. **Delete Account**:
   - Buat akun _dummy_, masukkan beberapa transaksi asal. Buka Settings > Danger Zone, lalu hapus akun.
   - Pastikan Anda ditendang ke halaman login.
   - Cek database Anda di Supabase, pastikan baris `auth.users`, `public.profiles`, dan `public.transaksi` terkait lenyap (efek relasi CASCADE).

## 3. Environment Variables yang Dibutuhkan

Pastikan _environment variables_ berikut telah diset dengan benar baik di lokal (`.env`) maupun di platform *hosting* (Vercel):

```bash
# Untuk koneksi utama (Client & Server)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Untuk bypass RLS & Admin Tasks (PENTING untuk Delete Account!)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Untuk Gemini AI (fitur di masa depan)
AI_API_KEY=your_gemini_key
```

## 4. Manual Setup Supabase Dashboard yang Perlu Dilakukan

Agar keseluruhan sistem Settings & Auth berjalan optimal, Anda *wajib* memeriksa konfigurasi di *dashboard* Supabase:

1. **Authentication > Providers**: Pastikan **Google** diaktifkan (memerlukan *Client ID* dan *Secret* dari Google Cloud Console).
2. **Authentication > URL Configuration**: Tambahkan _Site URL_ (misal: `http://localhost:3000` atau URL Vercel) dan `/**` di _Redirect URLs_.
3. **Storage > Buckets**: Pastikan _bucket_ `avatars` bersifat **Public**. Jika belum ada, jalankan migrasi `009-avatars-storage.sql`.

## 5. Catatan Risiko / Limitation

- **Geolocation Deteksi Sesi**: Deteksi sesi saat ini menggunakan `x-forwarded-for` dan parser sederhana. Untuk _location_ spesifik (seperti nama negara/kota), masih memerlukan API eksternal (contoh: *ip-api* atau *MaxMind*) yang saat ini belum diintegrasikan secara *native*.
- **Syncing Theme**: Saat menggunakan `System Theme`, *toggle* bergantung penuh pada mode OS/Browser *user*. Jika *user* tidak login, tema akan menggunakan *default browser*.
- **Delay Email**: Supabase pada paket *Free* memiliki batasan jumlah email pengiriman *Reset Password* (sekitar 3 per jam per IP/user). Sangat disarankan untuk menyiapkan *Custom SMTP* (misal: Resend) jika masuk ke tahap *production*.
