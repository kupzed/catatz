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

Catatan: mengirim `emailRedirectTo` ke `/auth/callback?next=/transactions` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`.

### `signIn`

Lokasi: `src/actions/auth-action.ts`

Deskripsi: login email/password.

Input: `FormData` dengan `email` dan `password`.

Output: redirect ke `/transactions` jika sukses, `ActionResult` error jika gagal.

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

Catatan: redirect OAuth diarahkan ke `/auth/callback?next=/transactions` memakai origin production dari `NEXT_PUBLIC_APP_URL` atau origin request development yang ada di `ALLOWED_DEV_ORIGINS`. Jika origin development belum diizinkan, action mengembalikan error dan tidak membuat URL OAuth.

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

Deskripsi: mengambil transaksi dengan relasi kategori, rekening asal, dan rekening tujuan. Filter `q` mencocokkan judul, catatan, dan nama kategori. Field `tipe`, `rekening_id`, dan `kategori_id` mendukung multi-select (array); array kosong berarti "semua".

Input:

```ts
type TransaksiFilter = {
  tipe?: TipeTransaksi[];
  rekening_id?: string[];
  kategori_id?: string[];
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

### `getTransaksiById`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: mengambil detail satu transaksi berdasarkan ID UUID untuk pengguna yang sedang terautentikasi, lengkap dengan relasi joined (`kategori`, `rekening`, `rekening_tujuan_data`).

Input: `id: string`.

Validasi:
- `transaksiIdParamSchema` (Zod UUID validation) di sisi server.
- Verifikasi user login via `supabase.auth.getUser()`.
- Filter `eq('id', id)` dan `eq('user_id', user.id)`.

Output: `ActionResult<Transaksi | null>`.

Tabel: `transaksi`, `kategori`, `rekening`.

Auth requirement: authenticated via RLS & Supabase session.

### `createTransaksi`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: membuat transaksi baru untuk user saat ini.

Input: `TransaksiFormValues`.

Validasi:

- UI dan Server Action memakai `transaksiSchema` di `src/validations/transaksi-validation.ts`.
- Server action memastikan user login.
- `income` dan `expense` wajib memiliki `judul` dan `kategori_id`.
- `transfer` wajib memiliki `rekening_tujuan`, dan rekening asal/tujuan tidak boleh sama.
- Database constraint memastikan nominal positif, transfer punya rekening tujuan, dan correction tidak punya judul.

Output: `ActionResult<Transaksi>`.

Revalidate: `/transactions`, `/wallets`, `/reports`.

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

Validasi: action mengambil data lama, merge dengan payload partial, lalu memvalidasi hasilnya dengan `transaksiSchema` sebelum update.

Revalidate: `/transactions`, `/transactions/${id}`, `/wallets`, `/reports`.

Tabel: `transaksi`, `rekening`.

### `deleteTransaksi`

Lokasi: `src/actions/transaksi-action.ts`

Deskripsi: menghapus transaksi. Untuk tipe `correction`, action membalik saldo rekening secara manual sebelum delete.

Input: `id: string`.

Output: `ActionResult`.

Revalidate: `/transactions`, `/transactions/${id}`, `/wallets`, `/reports`.

Tabel: `transaksi`, `rekening`.

### Suggestion Actions

Lokasi: `src/actions/transaksi-action.ts`

| Action                       | Tujuan                                                                        | Tabel       |
| ---------------------------- | ----------------------------------------------------------------------------- | ----------- |
| `getJudulSuggestions(query)` | Suggest judul berdasarkan riwayat transaksi dan kategori yang sering dipakai. | `transaksi` |
| `getRecentJudul()`           | Mengambil judul transaksi terbaru untuk initial suggestion.                   | `transaksi` |
| `suggestKategori(catatan)`   | Legacy auto-kategorisasi berbasis catatan.                                    | `transaksi` |

## Rekening Actions

### `getRekening`

Lokasi: `src/actions/rekening-action.ts`

Deskripsi: mengambil rekening user, urut berdasarkan `urutan`.

Tabel: `rekening`.

### `getRekeningUsageCountsMap`

Deskripsi: menghitung pemakaian setiap rekening di transaksi, rekening tujuan transfer, hutang/piutang, cicilan, dan template transaksi berulang. Query data riwayat (`transaksi`, `hutang`, `hutang_cicilan`) menggunakan pagination `.range()` (chunk 1.000) agar seluruh data dihitung akurat tanpa terpotong limit default PostgREST (1.000 baris) pada database produksi dengan ribuan data.

Output: `Record<string, RekeningUsageCounts>`.

Tabel: `transaksi`, `hutang`, `hutang_cicilan`, `recurring_transaksi`.

### `createRekening`

Deskripsi: membuat rekening baru. `saldo_saat_ini` diinisialisasi dari `saldo_awal`.

Input: `RekeningFormValues`.

Validasi: `rekeningCreateSchema` dijalankan di sisi server sebelum insert.

Tabel: `rekening`.

Revalidate: `/wallets`, `/transactions`.

### `updateRekening`

Deskripsi: mengubah rekening. Jika `saldo_saat_ini` berubah, action membuat transaksi `correction` dan mengubah saldo rekening secara manual.

Input:

```ts
id: string;
values: Partial<RekeningFormValues & { saldo_saat_ini?: number }>;
```

Validasi: `rekeningEditSchema` dijalankan di sisi server sebelum proses apapun.

Tabel: `rekening`, `transaksi`.

Revalidate: `/wallets`, `/transactions`, `/reports`.

### `deleteRekening`

Deskripsi: menghapus rekening jika belum dipakai oleh data keuangan lain.

Tabel: `rekening`.

Proteksi:

- Action memastikan user login.
- Action menolak delete jika rekening masih dipakai transaksi, rekening tujuan transfer, hutang/piutang, cicilan, atau template transaksi berulang.
- Migration `012-protect-rekening-delete-references.sql` menambahkan trigger database untuk menolak delete langsung pada kondisi yang sama.

### `toggleExcludeTotal`

Deskripsi: mengubah flag `exclude_total`.

Tabel: `rekening`.

## Kategori Actions

Lokasi: `src/actions/kategori-action.ts`

| Action           | Tujuan                          | Validasi                                      | Tabel      |
| ---------------- | ------------------------------- | --------------------------------------------- | ---------- |
| `createKategori` | Membuat kategori custom user.   | `kategoriSchema` (server-side)                | `kategori` |
| `updateKategori` | Mengubah kategori custom user.  | `kategoriSchema` (server-side)                | `kategori` |
| `deleteKategori` | Menghapus kategori custom user. | Auth user + `is_system = false` + usage check | `kategori` |

Action update/delete menambahkan filter `user_id = user.id` dan `is_system = false`, selain proteksi RLS.

Proteksi tambahan:

- **`createKategori`** dan **`updateKategori`**: memvalidasi payload dengan `kategoriSchema` di sisi server sebelum menyentuh database.
- **`updateKategori`**: menolak perubahan `tipe` dari `income` ke `expense` (atau sebaliknya) jika masih ada transaksi atau template transaksi berulang yang menggunakan kategori tersebut dengan tipe yang tidak kompatibel. Perubahan dari/ke `'all'` selalu diizinkan.
- **`deleteKategori`**: menolak penghapusan jika kategori masih dipakai oleh transaksi atau template transaksi berulang (`recurring_transaksi`). Pesan error mencantumkan jumlah data yang perlu diubah terlebih dahulu.

## Hutang Actions

Lokasi: `src/actions/hutang-action.ts`

| Action                   | Tujuan                                                                                                                                                           | Tabel                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `getHutang`              | Mengambil seluruh pihak hutang/piutang dengan relasi cicilan.                                                                                                    | `hutang`, `hutang_cicilan` |
| `getHutangDetail`        | Mengambil satu pihak hutang/piutang beserta seluruh riwayat transaksi untuk halaman `/debts/[id]`.                                                              | `hutang`, `hutang_cicilan` |
| `createHutangContact`    | Membuat pihak baru dari halaman index dengan validasi `hutangContactSchema` (hanya Nama dan Catatan).                                                            | `hutang`                   |
| `updateHutangContact`    | Mengubah nama atau catatan pihak dengan validasi `hutangContactSchema`.                                                                                          | `hutang`                   |
| `toggleHutangStatus`     | Mengubah tag label status Lunas/Belum Lunas tanpa mendistorsi perhitungan saldo nominal riil.                                                                    | `hutang`                   |
| `updateHutangTipe`       | Mengubah tipe hubungan (`memberi`/`menerima`) sebelum catatan memiliki transaksi.                                                                                | `hutang`                   |
| `createHutangTransaction`| Mencatat pinjaman baru atau pembayaran/cicilan dengan validasi `hutangTransactionSchema`.                                                                         | `hutang_cicilan`, `hutang` |
| `createHutang`           | Membuat hutang/piutang langsung (legacy kompatibel). Validasi `hutangSchema` server-side.                                                                        | `hutang`                   |
| `updateHutang`           | Mengubah hutang/piutang. Validasi `hutangSchema.partial()` server-side. Menghitung ulang sisa jika total berubah. Menolak perubahan tipe jika sudah ada cicilan. | `hutang`, `hutang_cicilan` |
| `deleteHutang`           | Menghapus hutang/piutang beserta seluruh riwayat transaksinya dan mengembalikan saldo rekening.                                                                  | `hutang`                   |
| `createCicilan`          | Membuat cicilan/pembayaran (legacy kompatibel). Validasi `cicilanSchema` server-side. Mengembalikan parent `Hutang` terbaru.                                     | `hutang_cicilan`, `hutang` |
| `updateCicilan`          | Mengubah nominal, tanggal, waktu, rekening, jenis transaksi, atau catatan transaksi lalu mengembalikan parent `Hutang` terbaru.                                 | `hutang_cicilan`, `hutang` |
| `deleteCicilan`          | Menghapus transaksi lalu mengembalikan parent `Hutang` terbaru dan mengembalikan saldo rekening.                                                                 | `hutang_cicilan`, `hutang` |
| `markHutangLunas`        | Membuat cicilan sebesar sisa tagihan dengan rekening opsional dan menandai status lunas.                                                                         | `hutang_cicilan`, `hutang` |

Validasi server-side:

- `hutangContactSchema` (Zod) dijalankan di `createHutangContact` dan `updateHutangContact`.
- `hutangTransactionSchema` (Zod) dijalankan di `createHutangTransaction`.
- `hutangToggleStatusSchema` (Zod) dijalankan di `toggleHutangStatus`.
- `hutangSchema` (Zod) dijalankan di `createHutang` dan `hutangSchema.partial()` di `updateHutang`.
- `cicilanSchema` (Zod) dijalankan di `createCicilan`.

Catatan: Operasi mutasi hutang/piutang dan transaksi cicilan/pinjaman mengandalkan trigger database (`015-hutang-piutang-revamp.sql`) untuk memperbarui `sisa_tagihan`, status, dan saldo rekening secara konsisten. Mutasi hutang/piutang merevalidate `/debts`, `/debts/[id]`, `/wallets`, dan `/reports`.

## Rekap Actions

Lokasi: `src/actions/rekap-action.ts`

| Action                                | Tujuan                                                                                                                    | Tabel                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `getRekapBulanan(tahun)`              | Menghitung income, expense, dan net per bulan. Transfer dan correction tidak masuk total utama.                           | `transaksi`                                                     |
| `getRekapDetailBulanan(bulan, tahun)` | Mengambil detail bulan (pembungkus tipis `getRekapDetailByRange`): selisih, breakdown, koreksi, dan hutang/piutang.      | `transaksi`, `kategori`, `rekening`, `hutang`, `hutang_cicilan` |
| `getRekapDetailByRange(dari, sampai)` | Mengambil detail rekap untuk sembarang rentang tanggal `dari` s/d `sampai` (tervalidasi Zod).                              | `transaksi`, `kategori`, `rekening`, `hutang`, `hutang_cicilan` |
| `getRekapRingkasanPeriodeList(periods)` | Mengambil ringkasan batch banyak periode dalam 1 query batch dan bucketing pure logic (income, expense, net, D8 cashflow). | `transaksi`, `hutang`, `hutang_cicilan`                         |
| `getRekapKategori(bulan, tahun)`      | Breakdown expense per kategori untuk bulan tertentu.                                                                      | `transaksi`, `kategori`                                         |
| `getBudgetWithUsage(bulan, tahun)`    | Mengambil budget dan menghitung pemakaian expense.                                                                        | `budget`, `transaksi`, `kategori`                               |
| `upsertBudget(...)`                   | Membuat/mengubah budget berdasarkan unique `(user_id,kategori_id,bulan,tahun)`.                                           | `budget`                                                        |

Catatan: `upsertBudget` belum terlihat dipakai oleh UI route yang ada.

## Rekap Period & Settings Actions

Lokasi: `src/actions/rekap-period-action.ts`

Shared type & validation: `src/types/rekap.d.ts`, `src/validations/rekap-validation.ts`

Tabel yang diakses: `rekap_settings`, `rekap_periode_custom`

| Action | Tujuan | Input | Output | Revalidate |
|---|---|---|---|---|
| `getRekapSettings()` | Mengambil pengaturan cut-off dan akumulasi saldo. Mengembalikan default jika belum ada row tanpa insert. | - | `ActionResult<RekapSettings>` | - |
| `updateRekapSettings(values)` | Menyimpan/memperbarui pengaturan siklus rekap via upsert `user_id`. | `RekapSettingsSchema` | `ActionResult<RekapSettings>` | `/reports` |
| `listCustomPeriods()` | Mengambil daftar periode custom milik user urut `tanggal_mulai DESC`. | - | `ActionResult<CustomPeriod[]>` | - |
| `getCustomPeriod(id)` | Mengambil detail satu periode custom milik user. | `id: string` | `ActionResult<CustomPeriod>` | - |
| `createCustomPeriod(values)` | Membuat periode custom baru setelah validasi rentang tanggal. | `CustomPeriodSchema` | `ActionResult<CustomPeriod>` | `/reports` |
| `updateCustomPeriod(id, values)` | Memperbarui nama atau rentang tanggal periode custom milik user. | `id: string`, `values: CustomPeriodSchema` | `ActionResult<CustomPeriod>` | `/reports` |
| `deleteCustomPeriod(id)` | Menghapus periode custom milik user. | `id: string` | `ActionResult<{ id: string }>` | `/reports` |

Catatan:
- Semua action memeriksa autentikasi user (`auth.getUser()`) dan menyertakan filter eksplisit `.eq('user_id', user.id)` di samping proteksi RLS database.
- Nilai `updated_at` (dan `created_at` saat create) dikelola dari application layer menggunakan ISO timestamp.
- Error ketiadaan tabel di database (sebelum migrasi `014-rekap-periode.sql` dijalankan) ditangkap dan dikembalikan sebagai pesan ramah, bukan *unhandled throw*.

## Rekap Balance Actions

Lokasi: `src/actions/rekap-saldo-action.ts`

Pure calculation engine: `src/lib/rekap-balance.ts`

Tabel yang diakses: `rekening`, `transaksi`, `hutang`, `hutang_cicilan`

| Action | Tujuan | Input | Output | Revalidate |
|---|---|---|---|---|
| `getSaldoPeriodeList(periods)` | Menghitung saldo awal dan saldo akhir historis per periode menggunakan metode ledger hitung mundur (Keputusan D7). | `P extends RekapSaldoPeriodInput[]` | `ActionResult<(P & PeriodSaldoResult)[]>` | - |

Catatan:
- Query database dioptimalkan hanya mengambil transaksi, hutang, dan cicilan bertanggal `> (min(startDate) - 1 hari)`.
- Rekonsiliasi saldo akhir untuk tanggal hari ini dijamin identik dengan total `saldo_saat_ini` rekening yang disertakan (`exclude_total = false`).

## Preference Actions

Lokasi: `src/actions/preference-action.ts`

Shared type/default/validation: `src/lib/user-preferences.ts`

### `getUserPreferences`

Deskripsi: mengambil preferensi sistem user saat ini. Jika row `user_preferences` belum ada, action mengembalikan default aplikasi tanpa membuat row baru.

Output:

```ts
ActionResult<UserPreferences>;
```

`UserPreferences`:

```ts
type UserPreferences = {
  theme: "light" | "dark" | "system";
  currency: "IDR";
  date_format: "id-ID" | "en-US";
  number_format: "id-ID" | "en-US";
  default_landing_page:
    | "/transactions"
    | "/wallets"
    | "/reports"
    | "/debts"
    | "/categories";
  show_decimal_places: boolean;
  time_format: "24h" | "12h";
};
```

Tabel: `user_preferences`.

### `updateUserPreferences`

Deskripsi: mengubah sebagian preferensi sistem user dengan runtime validation whitelist. Action menolak key yang tidak dikenal dan value yang tidak ada di daftar opsi.

Input:

```ts
Partial<UserPreferences>;
```

Output:

```ts
ActionResult<UserPreferences>;
```

Tabel: `user_preferences`.

Revalidate: `/settings`, `/transactions`, `/wallets`, `/reports`, `/debts`, dan `/`.

Catatan: preferensi format memengaruhi tampilan dashboard dan export, tetapi tidak mengubah kontrak data transaksi/hutang; waktu tetap disimpan sebagai `HH:mm`.

## Export Actions

Lokasi: `src/actions/export-action.ts`

### `getExportData`

Deskripsi: mengambil transaksi user untuk export PDF/XLSX/CSV, optional filter tanggal, summary income/expense/net, count, periode, top kategori expense, dan preferensi format user.

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
  preferences: UserPreferences;
}>;
```

Tabel: `profiles`, `user_preferences`, `transaksi`, `kategori`, `rekening`.

Catatan: action ini memformat tanggal/waktu transaksi dan periode sesuai preferensi user sebelum data dikirim ke browser. Pembuatan file PDF, XLSX, dan CSV tetap berjalan di browser melalui generator client-side; generator memakai `preferences` untuk format nominal PDF/XLSX/CSV.

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

## AI Input Actions

Lokasi:

- `src/actions/voice-action.ts`
- `src/lib/voice-parser.ts`
- `src/hooks/use-voice-input.ts`
- `src/actions/transaction-file-action.ts`
- `src/lib/transaction-file-parser.ts`
- `src/lib/transaction-parser.ts`

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
- Permission microphone dan audio stream client melalui `navigator.mediaDevices.getUserMedia`.
- Gemini API melalui `@google/genai` di server.
- `AI_API_KEY` dan optional `AI_MODEL`.

### `processTransactionFile`

Deskripsi: menerima satu file transaksi melalui `FormData`, memvalidasi user, ukuran, MIME, dan signature file, lalu meminta Gemini mengekstrak data transaksi untuk mengisi form.

Input:

```ts
FormData {
  file: File;
}
```

Output:

```ts
ActionResult<FileAutoFillResult>;
```

Aturan:

- User wajib terautentikasi sebelum request Gemini dijalankan.
- Format yang diterima: JPEG, PNG, WebP, HEIC/HEIF, dan PDF.
- Ukuran aplikasi maksimal 4 MB. `next.config.ts` memakai `serverActions.bodySizeLimit: "4.5mb"` untuk menyisakan multipart overhead di bawah batas request deployment.
- File dikonversi menjadi Gemini `inlineData` di memory dan tidak disimpan ke Storage, database, cache, atau log produksi.
- Isi dokumen diperlakukan sebagai input tidak tepercaya; parser mengabaikan instruksi di dalam dokumen dan tidak boleh mengarang field yang tidak tersedia.
- Parser membedakan nominal transaksi utama dari saldo, subtotal, biaya, cashback, dan angka referensi.
- Output memakai bentuk transaksi terstruktur yang sama dengan Voice Input dan melalui sanitasi server bersama.
- Action hanya mengembalikan hasil ekstraksi. Penyimpanan transaksi tetap melalui `createTransaksi` setelah user memeriksa form dan menekan `Simpan`.

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
