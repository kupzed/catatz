import { z } from 'zod';

export const rekeningSchema = z.object({
  nama: z.string().min(1, 'Nama rekening wajib diisi').max(100),
  jenis: z.enum(['Tunai', 'Bank', 'E-Wallet', 'Investasi']),
  saldo_awal: z.number({ error: 'Saldo harus berupa angka' }).min(0),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
  logo: z.string().optional(),
  exclude_total: z.boolean(),
});

export type RekeningSchema = z.infer<typeof rekeningSchema>;
