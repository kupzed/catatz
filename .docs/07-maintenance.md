# Panduan Maintenance & Pengembangan Lanjut

## Menambah Fitur Baru — Template

Ikuti pola ini setiap menambah modul baru (misal: "Tabungan"):

### 1. Buat SQL Migration
```sql
-- src/migrations/008-tabungan.sql
CREATE TABLE IF NOT EXISTS public.tabungan (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nama      TEXT NOT NULL,
  target    NUMERIC(15,2) NOT NULL,
  terkumpul NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tabungan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tabungan: select own" ON public.tabungan
  FOR SELECT USING (auth.uid() = user_id);
-- ... insert, update, delete policies
```

### 2. Buat Types
```ts
// src/types/tabungan.d.ts
export type Tabungan = {
  id: string;
  user_id: string;
  nama: string;
  target: number;
  terkumpul: number;
  created_at: string;
};
```

### 3. Buat Zod Validation
```ts
// src/validations/tabungan-validation.ts
import { z } from 'zod';
export const tabunganSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  target: z.number({ error: 'Harus angka' }).positive(),
});
export type TabunganSchema = z.infer<typeof tabunganSchema>;
```

### 4. Buat Server Actions
```ts
// src/actions/tabungan-action.ts
'use server';
import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';

export async function getTabungan() { ... }
export async function createTabungan(values): Promise<ActionResult<Tabungan>> { ... }
```

### 5. Buat Halaman
```
src/app/(dashboard)/tabungan/
├── page.tsx                    ← Server Component, fetch data
└── _components/
    ├── tabungan-page-client.tsx ← Client Component, interaktivitas
    └── tabungan-dialog.tsx     ← Form dialog CRUD
```

### 6. Tambah ke Sidebar
```ts
// src/components/common/app-sidebar.tsx
const navItems = [
  // ...existing items
  { label: 'Tabungan', href: '/tabungan', icon: PiggyBank },
];
```

---

## Mengubah Model AI

Ganti di `.env`:
```env
AI_MODEL=gemini-2.5-flash        # Lebih akurat, sedikit lebih lambat
AI_MODEL=gemini-2.5-pro          # Paling akurat
AI_MODEL=gemini-2.5-flash-lite   # Default (cepat, hemat quota)
```

Untuk mengubah prompt AI, edit `SYSTEM_INSTRUCTION` di `src/lib/ai-parser.ts`.

---

## Menambah Bank/E-Wallet Baru

Edit `src/constants/banks.ts`:
```ts
export const DAFTAR_BANK: BankConfig[] = [
  // ...existing
  {
    slug: 'seabank',
    nama: 'SeaBank',
    jenis: 'Bank',
    warna: '#2563eb',
    emoji: '🌊',
  },
];
```

---

## Menambah Kategori Default

Jalankan SQL langsung di Supabase SQL Editor:
```sql
INSERT INTO public.kategori (nama, ikon, warna, tipe, is_system)
VALUES ('Donasi', '❤️', '#ef4444', 'expense', TRUE);
```

---

## Mengubah Skema Budget Progress

Edit di `src/actions/rekap-action.ts`, fungsi `getBudgetWithUsage`:
```ts
// Status threshold (default: 70% waspada, 90% bahaya)
const status =
  persentase >= 90 ? 'bahaya' :
  persentase >= 70 ? 'waspada' : 'aman';
```

---

## Keamanan — Checklist Rutin

- [ ] Jangan expose `SUPABASE_SERVICE_ROLE_KEY` ke client
- [ ] Semua tabel baru harus punya RLS + policies
- [ ] Validasi input dengan Zod sebelum insert ke database
- [ ] Cek `auth.uid()` di setiap Server Action untuk memastikan user terautentikasi
- [ ] Jangan bypass RLS dengan service role di operasi user-facing

**Pattern aman di Server Action:**
```ts
export async function createSomething(values: Schema) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized'); // ← selalu cek ini

  const { data, error } = await supabase
    .from('table')
    .insert({ ...values, user_id: user.id }); // ← selalu include user_id
}
```

---

## Dependency Versions (Penting)

| Package | Version | Catatan |
|---|---|---|
| `next` | 16.2.4 | Gunakan `proxy.ts`, bukan `middleware.ts` |
| `zod` | ^4.x | Gunakan `error:` bukan `invalid_type_error:` |
| `@supabase/ssr` | ^0.10.x | Untuk server-side session |
| `react` | 19.2.4 | React 19 (Server Actions native) |
| `tailwindcss` | ^4 | Config berbeda dari v3 (tidak ada `tailwind.config.js`) |

---

## Update Dependencies

```bash
# Cek update yang tersedia
npm outdated

# Update satu package
npm install next@latest

# ⚠️ Hati-hati update major version (bisa ada breaking changes)
# Selalu baca changelog sebelum update
```

---

## Rencana Pengembangan (Next Steps)

| Fitur | Kompleksitas | Keterangan |
|---|---|---|
| Export CSV/Excel | Rendah | Implementasi `xlsx` sudah di-install |
| Recurring Transactions | Sedang | Schema sudah ada di `007-recurring.sql` |
| Notifikasi jatuh tempo hutang | Sedang | Pakai Supabase Edge Function + cron |
| Grafik tren saldo harian | Sedang | Tambah query ke rekap-action |
| Kategori kustom (CRUD) | Rendah | Tambah form di settings |
| WhatsApp API real-time | Tinggi | Integrasi Fonnte/Wablas |
| Mobile App (PWA) | Sedang | Tambah `manifest.json` + service worker |
| Backup & Import data | Sedang | Parse CSV/Excel dengan `xlsx` |
