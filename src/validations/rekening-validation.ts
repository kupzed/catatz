import { z } from 'zod';

/** Schema untuk membuat rekening baru */
export const rekeningCreateSchema = z.object({
  nama: z.string().min(1, 'Nama rekening wajib diisi').max(100),
  jenis: z.enum(['Tunai', 'Bank', 'E-Wallet', 'Investasi']),
  saldo_awal: z.number({ error: 'Saldo harus berupa angka' }).min(0),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
  logo: z.string().optional(),
  exclude_total: z.boolean(),
});

/** Schema untuk mengedit rekening — saldo_saat_ini bisa diubah, saldo_awal readonly */
export const rekeningEditSchema = z.object({
  nama: z.string().min(1, 'Nama rekening wajib diisi').max(100),
  jenis: z.enum(['Tunai', 'Bank', 'E-Wallet', 'Investasi']),
  /** Saldo saat ini bisa diedit untuk membuat koreksi saldo */
  saldo_saat_ini: z.number({ error: 'Saldo harus berupa angka' }).min(0),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
  logo: z.string().optional(),
  exclude_total: z.boolean(),
});

/** @deprecated Gunakan rekeningCreateSchema atau rekeningEditSchema */
export const rekeningSchema = rekeningCreateSchema;

export type RekeningCreateSchema = z.infer<typeof rekeningCreateSchema>;
export type RekeningEditSchema = z.infer<typeof rekeningEditSchema>;
export type RekeningSchema = RekeningCreateSchema;
