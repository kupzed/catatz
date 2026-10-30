import { z } from 'zod';
import type { Dictionary } from '@/i18n/types';

export type RekeningValidationDict = Dictionary['errors']['validation'];

/** Schema factory untuk membuat rekening baru */
export function getRekeningCreateSchema(dict?: Dictionary | RekeningValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    nama: z.string().min(1, v?.walletNameRequired ?? 'Nama rekening wajib diisi').max(100),
    jenis: z.enum(['Tunai', 'Bank', 'E-Wallet', 'Investasi']),
    saldo_awal: z.number({ error: v?.balanceMustBeNumber ?? 'Saldo harus berupa angka' }).min(0),
    warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, v?.invalidColorFormat ?? 'Format warna tidak valid'),
    logo: z.string().optional(),
    exclude_total: z.boolean(),
  });
}

/** Schema factory untuk mengedit rekening — saldo_saat_ini bisa diubah, saldo_awal readonly */
export function getRekeningEditSchema(dict?: Dictionary | RekeningValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    nama: z.string().min(1, v?.walletNameRequired ?? 'Nama rekening wajib diisi').max(100),
    jenis: z.enum(['Tunai', 'Bank', 'E-Wallet', 'Investasi']),
    saldo_saat_ini: z.number({ error: v?.balanceMustBeNumber ?? 'Saldo harus berupa angka' }).min(0),
    warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, v?.invalidColorFormat ?? 'Format warna tidak valid'),
    logo: z.string().optional(),
    exclude_total: z.boolean(),
  });
}

export function getRekeningIdParamSchema(dict?: Dictionary | RekeningValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.string().uuid(v?.invalidWalletId ?? 'ID rekening tidak valid');
}

/** Schema untuk membuat rekening baru */
export const rekeningCreateSchema = getRekeningCreateSchema();

/** Schema untuk mengedit rekening — saldo_saat_ini bisa diubah, saldo_awal readonly */
export const rekeningEditSchema = getRekeningEditSchema();

/** @deprecated Gunakan rekeningCreateSchema atau rekeningEditSchema */
export const rekeningSchema = rekeningCreateSchema;

export const rekeningIdParamSchema = getRekeningIdParamSchema();

export type RekeningCreateSchema = z.infer<typeof rekeningCreateSchema>;
export type RekeningEditSchema = z.infer<typeof rekeningEditSchema>;
export type RekeningSchema = RekeningCreateSchema;
