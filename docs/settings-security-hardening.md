# Settings & Auth Security Hardening

Dokumen ini merangkum hasil audit keamanan dan langkah-langkah *hardening* yang diterapkan pada skema database, Row Level Security (RLS), dan mekanisme aplikasi terkait fitur *Settings* dan *Auth* di CatatZ.

## 1. Audit Migrasi & Schema

Seluruh riwayat SQL di dalam `src/migrations/` telah diaudit secara menyeluruh untuk memastikan tidak ada celah keamanan.

- **Urutan Migrasi**: Konflik penamaan yang ada akibat file `008-reorder-columns-production.sql` dan `009-grant-api-access.sql` ganda (unused) telah diselesaikan dengan menghapus kedua file tersebut karena fungsinya sudah tidak diperlukan (berdasarkan instruksi). Skema sekarang berjalan teratur dari `001` sampai `011`.
- **Konsistensi Foreign Key**: Seluruh tabel turunan pengguna (termasuk `user_preferences` di migrasi `009`) kini memiliki konstrain *Foreign Key* ke `public.profiles(id)` dengan `ON DELETE CASCADE`. Ini menjamin pembersihan data otomatis saat *User* dihapus tanpa membebani server dan tidak akan menyisakan *orphan data*.
- **PostgREST API Grants**: Telah divalidasi bahwa untuk mematuhi breaking change Supabase v1.26.05+, seluruh tabel di _schema_ `public` memiliki pernyataan `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table_name> TO authenticated;`. Pengecualian pada tabel yang hanya dibaca atau tabel esensial yang tidak diizinkan dihapus sembarangan (misalnya `user_sessions`).

## 2. Row Level Security (RLS)

- **Kepemilikan Mandiri**: Semua *policy* tabel seperti `user_sessions`, `user_preferences`, `profiles`, `transaksi`, `rekening`, dll. menggunakan batasan ketat `auth.uid() = user_id`.
- **Zero "Loose" Policies**: Audit membuktikan **tidak ada** *policy* yang secara sembarangan menggunakan klausa `USING (true)` atau `WITH CHECK (true)` pada tabel dengan data sensitif. Satu-satunya pengecualian adalah pada tabel `kategori` khusus untuk baris di mana `is_system = TRUE`, yang mana terbuka untuk `anon` agar dapat dibaca sebelum pengguna masuk (login).

## 3. Storage Security
- **Bucket `avatars`**: File diisolasi berdasarkan *folder name* yang harus sama dengan _UID_ pengguna.
- Kebijakan RLS storage menjamin pengguna tidak bisa menimpa (*overwrite*), mengubah, maupun menghapus avatar milik *user* lain.

## 4. Keamanan Tingkat Aplikasi (Server & API)

- **Service Role Key Isolation**: Fitur *Delete Account* yang bergantung pada _Supabase Admin API_ (`supabase.auth.admin.deleteUser`) menggunakan `SUPABASE_SERVICE_ROLE_KEY`. Variabel lingkungan ini **tidak** diekspos ke klien (tanpa prefix `NEXT_PUBLIC_`) sehingga mustahil diakses oleh pihak luar.
- **Payload Spoofing Prevention**: Baik pada *Active Sessions*, *Logout Account*, maupun *Delete Account*, `user_id` tidak pernah diambil dari isian form (body request). Target diekstrak mandiri oleh server action melalui token autentikasi (`supabase.auth.getUser()`).
- **Timestamp Handling**: Pembaruan waktu (kolom `updated_at`) sengaja dieksekusi secara asinkron dari _Application Layer_ (Next.js Server Actions dengan `new Date().toISOString()`), bukan via _Database Trigger_. Ini menghindari duplikasi *update event* maupun konflik rekursi saat aksi berjalan.
- **Middleware Guard**: *Middleware* memastikan halaman rahasia terlindungi dengan mengecek validitas status sesi dan menghentikan interupsi masuk untuk sesi yang masa pakainya habis atau secara eksplisit memiliki flag `revoked_at`.
