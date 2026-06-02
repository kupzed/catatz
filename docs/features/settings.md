# Feature: Settings

## Status

Status: Aktif.

## Deskripsi

Settings mengelola profil, avatar, preferensi sistem, akun Google terhubung, password, sesi aktif, logout, hapus akun, dan export data.

## Route

- `/settings`

## Lokasi File

- Page: `src/app/(dashboard)/settings/page.tsx`
- Client shell: `src/app/(dashboard)/settings/_components/settings-page-client.tsx`
- Umum tab: `src/app/(dashboard)/settings/_components/umum-tab.tsx`
- Keamanan tab: `src/app/(dashboard)/settings/_components/keamanan-tab.tsx`
- Profile section: `src/app/(dashboard)/settings/_components/profile-section.tsx`
- System preference section: `src/app/(dashboard)/settings/_components/system-preference-section.tsx`
- Connected account section: `src/app/(dashboard)/settings/_components/connected-account-section.tsx`
- Password section: `src/app/(dashboard)/settings/_components/password-section.tsx`
- Active sessions section: `src/app/(dashboard)/settings/_components/active-sessions-section.tsx`
- Export section: `src/app/(dashboard)/settings/_components/export-section.tsx`
- Profile actions: `src/actions/profile-action.ts`
- Preference actions: `src/actions/preference-action.ts`
- Auth actions: `src/actions/auth-action.ts`
- Export actions: `src/actions/export-action.ts`
- Preference helper: `src/lib/user-preferences.ts`
- Dashboard preference provider: `src/providers/system-preference-provider.tsx`

## Tabs

| Tab | Fungsi |
|---|---|
| `Umum` | Update profil/avatar, preferensi sistem, akun Google terhubung, dan export data. |
| `Keamanan` | Ganti password, lihat sesi aktif, logout, dan hapus akun. |

## Data Source

Settings page mengambil user dan profile dari Supabase server client:

- `supabase.auth.getUser()`
- `supabase.auth.getUserIdentities()`
- `profiles.select("*").eq("id", user.id).single()`
- `user_preferences.select(...)` untuk preferensi tampilan dan redirect default.

## Tabel/Bucket Terkait

- `profiles`
- `user_preferences`
- Storage bucket `avatars`
- `transaksi`, `kategori`, `rekening` untuk export PDF, XLSX, dan CSV

## Server Action Terkait

- `updateProfile`
- `uploadAvatar`
- `removeAvatar`
- `getUserPreferences`
- `updateUserPreferences`
- `changePassword`
- `linkGoogleIdentity`
- `unlinkGoogleIdentity`
- `getExportData`
- `getExportCount`

## Business Rules

- Nama profile harus 1 sampai 100 karakter di UI.
- Avatar harus image dan maksimal 2 MB.
- Avatar disimpan di bucket `avatars` dengan path `{user.id}/avatar.{ext}`.
- Password baru minimal 8 karakter dan harus sama dengan konfirmasi.
- Password lama diverifikasi sebelum `updateUser`.
- Connected Account memakai Supabase Auth identities aktual, bukan hanya `app_metadata.providers`.
- Tombol Hubungkan Google memakai `linkIdentity` dan callback hanya menerima link jika email Google sama dengan email utama user.
- Tombol Putuskan Google hanya tersedia jika user masih punya metode login lain.
- Preferensi sistem disimpan per user di `user_preferences`.
- `updateUserPreferences` hanya menerima key yang ada di whitelist `src/lib/user-preferences.ts`.
- Format angka mendukung `id-ID` dan `en-US`; nominal penuh mengikuti separator ribuan/desimal dan opsi 2 angka desimal.
- Nominal compact tetap ringkas dan tidak dipaksa 2 angka desimal.
- Format tanggal mendukung `id-ID` dan `en-US`.
- Format waktu mendukung `24h` dan `12h`; value database tetap disimpan sebagai `HH:mm`.
- `default_landing_page` dipakai oleh route root `/` untuk menentukan redirect dashboard user.
- Export file tidak berjalan jika tidak ada transaksi pada filter aktif.
- Export PDF/XLSX/CSV mengikuti preferensi tanggal, waktu, format angka, dan opsi desimal user.
- Export XLSX berisi sheet `Ringkasan` dan `Transaksi`; nominal memakai numeric cell dengan `numFmt`.
- Export CSV berisi baris transaksi dengan delimiter koma; nominal ditulis sebagai teks angka tanpa simbol mata uang agar mudah diproses ulang.

## UI Behavior

- Desktop memakai sidebar tab settings.
- Mobile memakai tab strip horizontal.
- Upload avatar menampilkan preview lokal sebelum hasil upload.
- Akun Terhubung menampilkan status Google dan toast hasil callback `google-linked` / error.
- Export data menampilkan jumlah transaksi siap export.
- Theme memakai `next-themes`.
- System Preference menyimpan perubahan secara optimistic, menyinkronkan `SystemPreferenceProvider`, lalu refresh server boundary setelah action sukses.
- Section System Preference menampilkan preview nominal, tanggal, dan waktu berdasarkan pilihan aktif.
- Input waktu transaksi, hutang, dan cicilan memakai `TimeInput`; mode `24h` memakai native time input, sedangkan mode `12h` memakai pilihan jam, menit, dan AM/PM.

## TODO / Improvement

- Pertimbangkan validasi MIME/extension avatar server-side yang lebih ketat jika security requirement naik.
- Pastikan konfigurasi Supabase Manual Linking aktif sebelum QA Connected Account.
