import { z } from 'zod';
import type { Dictionary } from '@/i18n/types';

export type KategoriValidationDict = Dictionary['errors']['validation'];

export function getKategoriSchema(dict?: Dictionary | KategoriValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    nama: z.string().min(1, v?.nameRequired ?? 'Nama wajib diisi').max(100),
    ikon: z.string().min(1, v?.iconRequired ?? 'Ikon wajib diisi').max(10),
    warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, v?.invalidColorFormat ?? 'Format warna tidak valid'),
    tipe: z.enum(['income', 'expense', 'all']),
  });
}

export const kategoriSchema = getKategoriSchema();

export type KategoriSchema = z.infer<typeof kategoriSchema>;
