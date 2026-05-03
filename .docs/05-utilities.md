# Utilitas & Library

## `src/lib/utils.ts`

Semua helper function yang dipakai di seluruh aplikasi.

### `cn(...inputs: ClassValue[]): string`
Menggabungkan Tailwind class dengan benar, menghindari konflik.
```ts
import { cn } from '@/lib/utils';
cn('px-4 py-2', isActive && 'bg-indigo-500', 'text-white')
```

### `formatRupiah(value: number, compact?: boolean): string`
Format angka ke mata uang Rupiah Indonesia.
```ts
formatRupiah(25000)         // "Rp 25.000"
formatRupiah(1500000)       // "Rp 1.500.000"
formatRupiah(1500000, true) // "Rp 1,5 Jt"
formatRupiah(2000000000, true) // "Rp 2,0 M"
```

### `formatTanggal(date: string, fmt?: string): string`
Format tanggal ISO ke format Indonesia menggunakan `date-fns` locale `id`.
```ts
formatTanggal('2025-05-01')              // "1 Mei 2025"
formatTanggal('2025-05-01', 'd MMM yyyy') // "1 Mei 2025"
formatTanggal('2025-05-01', 'EEEE, d MMMM') // "Kamis, 1 Mei"
```

### `todayISODate(): string`
Mengembalikan tanggal hari ini dalam format `YYYY-MM-DD` (local time, bukan UTC).
```ts
todayISODate() // "2025-05-01"
```

### `parseNominal(value: string): number`
Parse string angka format Indonesia ke number.
```ts
parseNominal('1.500.000') // 1500000
parseNominal('25,5')      // 25.5
```

### `percentage(value: number, total: number): number`
Hitung persentase, max 100, handle division by zero.
```ts
percentage(750000, 1000000) // 75
percentage(0, 0)            // 0
percentage(1100, 1000)      // 100 (capped)
```

### `waReminderUrl(phone: string, message: string): string`
Generate URL WhatsApp untuk kirim pesan pengingat hutang.
```ts
waReminderUrl('08123456789', 'Halo, mengingatkan...')
// "https://wa.me/628123456789?text=Halo%2C..."
```

---

## `src/lib/ai-parser.ts`

Parser AI menggunakan Google Gemini untuk input transaksi natural language.

### `parseTransaksiFromText(input: string): Promise<ParsedTransaksi>`

Mengubah teks bebas menjadi data transaksi terstruktur.

```ts
import { parseTransaksiFromText } from '@/lib/ai-parser';

const result = await parseTransaksiFromText('Beli nasi padang 25rb pakai GoPay');
// {
//   tipe: 'expense',
//   nominal: 25000,
//   kategori_hint: 'Makan & Minum',
//   rekening_hint: 'GoPay',
//   catatan: 'Beli nasi padang 25rb pakai GoPay'
// }
```

**Return type `ParsedTransaksi`:**
```ts
type ParsedTransaksi = {
  tipe: 'income' | 'expense' | 'transfer';
  nominal: number;
  kategori_hint: string;  // hint untuk match ke kategori existing
  rekening_hint: string;  // hint untuk match ke rekening existing
  catatan: string;
}
```

**Cara kerja:**
1. Kirim input ke Gemini dengan `systemInstruction` yang ketat (JSON-only output)
2. Gunakan `responseMimeType: 'application/json'` + `responseSchema` untuk structured output
3. Sanitasi: validasi `tipe`, pastikan `nominal` positif
4. Di `transaksi-dialog.tsx`, hasil dicocokkan ke kategori/rekening yang ada secara fuzzy match

**Konfigurasi via `.env`:**
```env
AI_API_KEY=AIza...          # Google AI Studio key
AI_MODEL=gemini-2.5-flash-lite  # Model yang digunakan
```

> 💡 Untuk mengganti model, cukup ubah `AI_MODEL` di `.env`. Model tersedia: `gemini-2.5-flash`, `gemini-2.5-pro`, dll.

---

## `src/configs/supabase/`

### `client.ts` — Browser Client
Digunakan di Client Components (jarang dibutuhkan langsung).
```ts
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(URL, ANON_KEY);
```

### `server.ts` — Server Client
Digunakan di **Server Actions** dan **Server Components**.
```ts
import { createClient } from '@/configs/supabase/server';
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### `middleware.ts` — Session Management
Digunakan oleh `src/proxy.ts`. Fungsi:
1. Refresh session cookie Supabase
2. Redirect ke `/login` jika halaman protected tanpa auth
3. Redirect ke `/transaksi` jika sudah login tapi akses halaman auth

**Protected routes**: semua kecuali `/login`, `/register`, `/`

---

## `src/constants/banks.ts`

Daftar bank dan e-wallet Indonesia dengan metadata.

```ts
type BankConfig = {
  slug: string;   // 'bca', 'gopay', 'tunai'
  nama: string;   // 'BCA', 'GoPay', 'Tunai'
  jenis: JenisRekening;
  warna: string;  // hex color brand
  emoji?: string; // opsional emoji
}

// Diakses via:
import { DAFTAR_BANK, BANK_BY_JENIS } from '@/constants/banks';
BANK_BY_JENIS['Bank']     // BCA, Mandiri, BNI, BRI, ...
BANK_BY_JENIS['E-Wallet'] // GoPay, OVO, Dana, ShopeePay, ...
```

---

## `src/validations/`

Semua Zod schema menggunakan **Zod v4** syntax.

> ⚠️ **Zod v4 Breaking Change**: Gunakan `error:` bukan `invalid_type_error:` untuk error message pada `.number()`.

```ts
// ✅ Zod v4 (benar)
z.number({ error: 'Harus berupa angka' })

// ❌ Zod v3 (salah, akan error di proyek ini)
z.number({ invalid_type_error: 'Harus berupa angka' })
```

### Schema yang tersedia:

| File | Schema | Dipakai di |
|---|---|---|
| `transaksi-validation.ts` | `transaksiSchema`, `TransaksiSchema` | `transaksi-dialog.tsx` |
| `rekening-validation.ts` | `rekeningSchema`, `RekeningSchema` | `rekening-dialog.tsx` |
| `hutang-validation.ts` | `hutangSchema`, `cicilanSchema` | `hutang-dialog.tsx` |
