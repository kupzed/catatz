import { z } from 'zod'

export const kategoriSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi').max(100),
  ikon: z.string().min(1, 'Ikon wajib diisi').max(10),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
  tipe: z.enum(['income', 'expense', 'all']),
})

export type KategoriSchema = z.infer<typeof kategoriSchema>
