# Server Actions dan API Routes

Project ini terutama memakai Server Actions di `src/actions`. Route Handler yang terlihat saat ini hanya `/auth/callback`.

Tidak ada folder `src/app/api` pada kondisi repository saat dokumentasi ini dibuat.

## Supabase Client

Semua Server Actions yang mengakses database memakai:

```ts
import { createClient } from "@/configs/supabase/server";
```

Client tersebut membaca cookie session Supabase melalui `next/headers`.

## Auth Actions

### `signUp`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: membuat user Supabase Auth baru.

Input:

```ts
FormData {
  email: string;
  password: string;
  name: string;
}
```

Output: `ActionResult` dengan message sukses atau error.

Auth requirement: public.

Supabase access: `supabase.auth.signUp`.

Catatan: mengirim `emailRedirectTo` ke `/auth/callback?next=/transaksi` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`.

### `signIn`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: login email/password.

Input: `FormData` dengan `email` dan `password`.

Output: redirect ke `/transaksi` jika sukses, `ActionResult` error jika gagal.

Auth requirement: public.

Supabase access: `supabase.auth.signInWithPassword`.

### `signOut`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: logout user dan redirect ke `/login`.

Auth requirement: authenticated.

Supabase access: `supabase.auth.signOut`.

### `getUser`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: mengambil user Supabase dari session saat ini.

Auth requirement: optional, return bisa null.

Supabase access: `supabase.auth.getUser`.

### `resetPasswordRequest`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: mengirim email reset password.

Input: `FormData` dengan `email`.

Output: `ActionResult` dengan message netral agar tidak membocorkan apakah email terdaftar.

Auth requirement: public.

Supabase access: `supabase.auth.resetPasswordForEmail`.

Catatan: redirect reset diarahkan ke `/auth/callback?next=/reset-password` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`.

### `updatePassword`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: menyimpan password baru setelah user masuk melalui callback reset password.

Input: `FormData` dengan `password` dan `confirmPassword`.

Output: redirect ke `/login?message=reset-success` jika sukses.

Auth requirement: authenticated session dari reset-password callback.

Supabase access: `supabase.auth.updateUser`, lalu `supabase.auth.signOut`.

### `signInWithGoogle`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: memulai OAuth login/register Google.

Output: `ActionResult<{ url: string }>` berisi URL OAuth Supabase.

Auth requirement: public.

Supabase access: `supabase.auth.signInWithOAuth`.

Catatan: redirect OAuth diarahkan ke `/auth/callback?next=/transaksi` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`. Jika origin development belum diizinkan, action mengembalikan error dan tidak membuat URL OAuth.

### `linkGoogleIdentity`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: memulai manual Link Identity Google untuk user yang sedang login.

Output: `ActionResult<{ url: string }>` berisi URL OAuth Supabase.

Auth requirement: authenticated.

Supabase access: `supabase.auth.getUser`, `supabase.auth.getUserIdentities`, `supabase.auth.linkIdentity`.

Catatan: redirect OAuth diarahkan ke `/auth/callback?next=/settings&flow=link_google` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`. Action mengirim `login_hint` berisi email utama user.

### `unlinkGoogleIdentity`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: memutus identity Google jika user masih memiliki minimal satu identity login lain.

Output: `ActionResult`.

Auth requirement: authenticated.

Supabase access: `supabase.auth.getUser`, `supabase.auth.getUserIdentities`, `supabase.auth.unlinkIdentity`.

Revalidate: `/settings`.

## Route Handler

### `GET /auth/callback`

Lokasi: `src/app/auth/callback/route.ts`

Deskripsi: menukar `code` dari Supabase Auth menjadi session.

Input query:

- `code`: auth code dari Supabase.
- `next`: path redirect internal. Divalidasi agar hanya path lokal yang diawali `/` dan bukan `//`.
- `flow`: optional. Nilai `link_google` menandai callback Link Identity Google dari Settings.

Output:

- Redirect ke `next` jika sukses.
- Untuk `flow=link_google`, callback memvalidasi email identity Google sama dengan email utama user. Jika cocok, redirect ke `/settings?message=google-linked`; jika berbeda, callback mencoba `unlinkIdentity` dan redirect dengan message error.
- Redirect ke `/login?message=auth-callback-failed` jika gagal.
- Middleware memperlakukan route ini sebagai public dan memindahkan `/login?code=...` atau `/register?code=...` ke route ini sebagai recovery fallback.

Auth requirement: public callback.

## Transaksi Actions

### `getKategori`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: mengambil kategori system dan kategori user.

Output: `Kategori[]`.

Tabel: `kategori`.

### `getTransaksi`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: mengambil transaksi dengan relasi kategori, rekening asal, dan rekening tujuan.

Input:

```ts
type TransaksiFilter = {
  tipe?: "income" | "expense" | "transfer" | "correction" | "all";
  rekening_id?: string;
  kategori_id?: string;
  dari?: string;
  sampai?: string;
  q?: string;
  sortBy?: "tanggal" | "nominal" | "created_at";
  sortOrder?: "asc" | "desc";
};
```

Output: `Transaksi[]`.

Tabel: `transaksi`, `kategori`, `rekening`.

Auth requirement: authenticated via RLS/proxy.

### `createTransaksi`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: membuat transaksi baru untuk user saat ini.

Input: `TransaksiFormValues`.

Validasi:

- UI memakai `transaksiSchema` di `src/validations/transaksi-validation.ts`.
- Server action memastikan user login.
- Database constraint memastikan nominal positif, transfer punya rekening tujuan, dan correction tidak punya judul.

Output: `ActionResult<Transaksi>`.

Revalidate: `/transaksi`, `/rekening`, `/rekap`.

Tabel: `transaksi`.

### `updateTransaksi`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: mengubah transaksi. Untuk tipe `correction`, action menghitung ulang saldo rekening secara manual sebelum update data transaksi.

Input:

```ts
id: string;
values: Partial<TransaksiFormValues>;
```

Output: `ActionResult<Transaksi>`.

Revalidate: `/transaksi`, `/rekening`, `/rekap`.

Tabel: `transaksi`, `rekening`.

### `deleteTransaksi`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: menghapus transaksi. Untuk tipe `correction`, action membalik saldo rekening secara manual sebelum delete.

Input: `id: string`.

Output: `ActionResult`.

Revalidate: `/transaksi`, `/rekening`, `/rekap`.

Tabel: `transaksi`, `rekening`.

### Suggestion Actions

Lokasi: `src/actions/transaksi-action.ts`

| Action                       | Tujuan                                                                        | Tabel       |
| ---------------------------- | ----------------------------------------------------------------------------- | ----------- |
| `getJudulSuggestions(query)` | Suggest judul berdasarkan riwayat transaksi dan kategori yang sering dipakai. | `transaksi` |
| `getRecentJudul()`           | Mengambil judul transaksi terbaru untuk initial suggestion.                   | `transaksi` |
| `suggestKategori(catatan)`   | Legacy auto-kategorisasi berbasis catatan.                                    | `transaksi` |
| `getNamaSuggestions(query)`  | Deprecated, backward compatibility untuk suggestion catatan.                  | `transaksi` |

## Rekening Actions

### `getRekening`

Lokasi: `src/actions/rekening-action.ts`

Deskripsi: mengambil rekening user, urut berdasarkan `urutan`.

Tabel: `rekening`.

### `createRekening`

Deskripsi: membuat rekening baru. `saldo_saat_ini` diinisialisasi dari `saldo_awal`.

Input: `RekeningFormValues`.

Validasi UI: `rekeningCreateSchema`.

Tabel: `rekening`.

Revalidate: `/rekening`, `/transaksi`.

### `updateRekening`

Deskripsi: mengubah rekening. Jika `saldo_saat_ini` berubah, action membuat transaksi `correction` dan mengubah saldo rekening secara manual.

Input:

```ts
id: string;
values: Partial<RekeningFormValues & { saldo_saat_ini?: number }>;
```

Validasi UI: `rekeningEditSchema`.

Tabel: `rekening`, `transaksi`.

Revalidate: `/rekening`, `/transaksi`.

### `deleteRekening`

Deskripsi: menghapus rekening.

Tabel: `rekening`.

Catatan: FK transaksi/hutang ke rekening memakai `ON DELETE SET NULL`.

### `toggleExcludeTotal`

Deskripsi: mengubah flag `exclude_total`.

Tabel: `rekening`.

## Kategori Actions

Lokasi: `src/actions/kategori-action.ts`

| Action           | Tujuan                          | Validasi                        | Tabel      |
| ---------------- | ------------------------------- | ------------------------------- | ---------- |
| `createKategori` | Membuat kategori custom user.   | `kategoriSchema`                | `kategori` |
| `updateKategori` | Mengubah kategori custom user.  | `kategoriSchema`                | `kategori` |
| `deleteKategori` | Menghapus kategori custom user. | Auth user + `is_system = false` | `kategori` |

Action update/delete menambahkan filter `user_id = user.id` dan `is_system = false`, selain proteksi RLS.

## Hutang Actions

Lokasi: `src/actions/hutang-action.ts`

| Action            | Tujuan                                                                | Tabel                      |
| ----------------- | --------------------------------------------------------------------- | -------------------------- |
| `getHutang`       | Mengambil hutang/piutang dengan relasi cicilan.                       | `hutang`, `hutang_cicilan` |
| `createHutang`    | Membuat hutang/piutang dan mengisi `sisa_tagihan = total_pinjaman`.   | `hutang`                   |
| `updateHutang`    | Mengubah hutang/piutang dan menghitung ulang sisa jika total berubah. | `hutang`, `hutang_cicilan` |
| `deleteHutang`    | Menghapus hutang/piutang.                                             | `hutang`                   |
| `createCicilan`   | Membuat cicilan.                                                      | `hutang_cicilan`           |
| `deleteCicilan`   | Menghapus cicilan.                                                    | `hutang_cicilan`           |
| `markHutangLunas` | Set status lunas dan sisa tagihan 0.                                  | `hutang`                   |

Validasi UI:

- `hutangSchema`.
- `cicilanSchema`.

Catatan: UI saat ini melunaskan hutang dengan membuat cicilan sebesar sisa tagihan, bukan memanggil `markHutangLunas` langsung.

## Rekap Actions

Lokasi: `src/actions/rekap-action.ts`

| Action                             | Tujuan                                                                          | Tabel                             |
| ---------------------------------- | ------------------------------------------------------------------------------- | --------------------------------- |
| `getRekapBulanan(tahun)`           | Menghitung income, expense, dan net per bulan. Transfer dikecualikan.           | `transaksi`                       |
| `getRekapKategori(bulan, tahun)`   | Breakdown expense per kategori untuk bulan tertentu.                            | `transaksi`, `kategori`           |
| `getBudgetWithUsage(bulan, tahun)` | Mengambil budget dan menghitung pemakaian expense.                              | `budget`, `transaksi`, `kategori` |
| `upsertBudget(...)`                | Membuat/mengubah budget berdasarkan unique `(user_id,kategori_id,bulan,tahun)`. | `budget`                          |

Catatan: `upsertBudget` belum terlihat dipakai oleh UI route yang ada.

## Export Actions

Lokasi: `src/actions/export-action.ts`

### `getExportData`

Deskripsi: mengambil transaksi user untuk laporan PDF, optional filter tanggal, summary income/expense/net, count, periode, dan top kategori expense.

Input:

```ts
filter?: {
  dari?: string;
  sampai?: string;
}
```

Output:

```ts
ActionResult<{
  transaksi: ExportTransaksi[];
  summary: ExportSummary;
  userName: string;
}>;
```

Tabel: `profiles`, `transaksi`, `kategori`, `rekening`.

### `getExportCount`

Deskripsi: menghitung jumlah transaksi user untuk tab export.

Tabel: `transaksi`.

## Profile Actions

Lokasi: `src/actions/profile-action.ts`

| Action           | Tujuan                                                              | Supabase Access               |
| ---------------- | ------------------------------------------------------------------- | ----------------------------- |
| `updateProfile`  | Mengubah nama profil user.                                          | `profiles`                    |
| `uploadAvatar`   | Upload avatar image max 2 MB, update `profiles.avatar_url`.         | Storage `avatars`, `profiles` |
| `removeAvatar`   | Hapus semua file avatar di folder user dan set `avatar_url = null`. | Storage `avatars`, `profiles` |
| `changePassword` | Verifikasi password lama lalu update password baru.                 | Supabase Auth                 |

## Voice Actions

Lokasi:

- `src/actions/voice-action.ts`
- `src/lib/voice-parser.ts`
- `src/hooks/use-voice-input.ts`

### `processVoiceInput`

Deskripsi: menerima transcript suara, memanggil parser AI server-side, lalu mengembalikan hasil parsing transaksi.

Input:

```ts
rawTranscript: string;
```

Output:

```ts
ActionResult<VoiceParseResult>;
```

Dependency:

- Browser Speech Recognition di client.
- Gemini API melalui `@google/genai` di server.
- `AI_API_KEY` dan optional `AI_MODEL`.

## Error Handling

Pola umum action:

- Return `{ success: false, error }` untuk mutasi yang gagal.
- Throw `new Error(error.message)` untuk query initial data di beberapa `get*`.
- UI menampilkan error dengan `sonner` toast.
- `revalidatePath` dipakai setelah mutasi penting.

## Auth Requirement Ringkas

- Route dashboard dilindungi proxy/layout.
- Action mutasi yang membuat row user-owned mengambil user dengan `supabase.auth.getUser()`.
- RLS tetap menjadi batas keamanan utama di database.
