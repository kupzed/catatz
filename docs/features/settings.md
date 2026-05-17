# Feature: Settings

## Status

Status: Aktif.

## Deskripsi

Settings mengelola profil, avatar, password, tema, dan export data.

## Route

- `/settings`

## Lokasi File

- Page: `src/app/(dashboard)/settings/page.tsx`
- Client shell: `src/app/(dashboard)/settings/_components/settings-page-client.tsx`
- Profil tab: `src/app/(dashboard)/settings/_components/profil-tab.tsx`
- Keamanan tab: `src/app/(dashboard)/settings/_components/keamanan-tab.tsx`
- Tampilan tab: `src/app/(dashboard)/settings/_components/tampilan-tab.tsx`
- Export tab: `src/app/(dashboard)/settings/_components/export-tab.tsx`
- Profile actions: `src/actions/profile-action.ts`
- Export actions: `src/actions/export-action.ts`

## Tabs

| Tab | Fungsi |
|---|---|
| `Profil` | Update nama, upload avatar, hapus avatar, lihat email readonly. |
| `Keamanan` | Ganti password setelah memasukkan password lama. |
| `Tampilan` | Pilih tema terang/gelap/system dan quick toggle dark mode. |
| `Export Data` | Export laporan transaksi ke PDF dengan optional filter tanggal. |

## Data Source

Settings page mengambil user dan profile dari Supabase server client:

- `supabase.auth.getUser()`
- `profiles.select("*").eq("id", user.id).single()`

## Tabel/Bucket Terkait

- `profiles`
- Storage bucket `avatars`
- `transaksi`, `kategori`, `rekening` untuk export PDF

## Server Action Terkait

- `updateProfile`
- `uploadAvatar`
- `removeAvatar`
- `changePassword`
- `getExportData`
- `getExportCount`

## Business Rules

- Nama profile harus 1 sampai 100 karakter di UI.
- Avatar harus image dan maksimal 2 MB.
- Avatar disimpan di bucket `avatars` dengan path `{user.id}/avatar.{ext}`.
- Password baru minimal 8 karakter dan harus sama dengan konfirmasi.
- Password lama diverifikasi sebelum `updateUser`.
- Export PDF tidak berjalan jika tidak ada transaksi.

## UI Behavior

- Desktop memakai sidebar tab settings.
- Mobile memakai tab strip horizontal.
- Upload avatar menampilkan preview lokal sebelum hasil upload.
- Export PDF menampilkan jumlah transaksi siap export.
- Theme memakai `next-themes`.

## TODO / Improvement

- Belum ada flow reset password via email dari halaman auth.
- Pertimbangkan validasi MIME/extension avatar server-side yang lebih ketat jika security requirement naik.
