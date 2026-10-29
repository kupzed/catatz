import { z } from 'zod';
import type { Dictionary } from '@/i18n/types';

export type HutangValidationDict = Dictionary['errors']['validation'];

export function getHutangContactSchema(dict?: Dictionary | HutangValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    nama_entitas: z.string().min(1, v?.nameRequired ?? 'Nama wajib diisi').max(200),
    catatan: z.string().max(500).optional().or(z.literal('')),
  });
}

export function getHutangTransactionSchema(dict?: Dictionary | HutangValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    hutang_id: z.string().uuid(),
    jenis_transaksi: z.enum(['pembayaran', 'pinjaman']),
    nominal: z
      .number({
        error:
          v?.nominalMustBeNumber ?? v?.mustBeNumber ?? 'Nominal harus berupa angka',
      })
      .positive(v?.mustBePositive ?? 'Nominal harus lebih dari 0'),
    tanggal: z.string().min(1, v?.dateRequired ?? 'Tanggal wajib diisi'),
    waktu: z.string().optional().or(z.literal('')),
    rekening_id: z.string().uuid().optional().or(z.literal('')),
    catatan: z.string().max(200).optional().or(z.literal('')),
  });
}

export function getHutangSchema(dict?: Dictionary | HutangValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    tipe: z.enum(['memberi', 'menerima']),
    nama_entitas: z.string().min(1, v?.nameRequired ?? 'Nama wajib diisi').max(200),
    total_pinjaman: z
      .number({ error: v?.mustBeNumber ?? 'Nominal harus berupa angka' })
      .positive(v?.mustBePositive ?? 'Nominal harus lebih dari 0'),
    tanggal_mulai: z.string().min(1, v?.startDateRequired ?? 'Tanggal mulai wajib diisi'),
    tanggal_jatuh_tempo: z.string().optional().or(z.literal('')),
    waktu: z.string().optional().or(z.literal('')),
    rekening_id: z.string().uuid().optional().or(z.literal('')),
    catatan: z.string().max(500).optional().or(z.literal('')),
  });
}

export function getCicilanSchema(dict?: Dictionary | HutangValidationDict) {
  const v = dict ? ('errors' in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    hutang_id: z.string().uuid(),
    jenis_transaksi: z.enum(['pembayaran', 'pinjaman']).optional(),
    rekening_id: z.string().uuid().optional(),
    nominal: z
      .number({
        error:
          v?.nominalMustBeNumber ?? v?.mustBeNumber ?? 'Nominal harus berupa angka',
      })
      .positive(v?.mustBePositive ?? 'Nominal harus lebih dari 0'),
    tanggal: z.string().min(1, v?.dateRequired ?? 'Tanggal wajib diisi'),
    waktu: z.string().optional().or(z.literal('')),
    catatan: z.string().max(200).optional().or(z.literal('')),
  });
}

export function getHutangToggleStatusSchema() {
  return z.object({
    id: z.string().uuid(),
    is_lunas: z.boolean(),
  });
}

export const hutangContactSchema = getHutangContactSchema();
export const hutangTransactionSchema = getHutangTransactionSchema();
export const hutangSchema = getHutangSchema();
export const cicilanSchema = getCicilanSchema();
export const hutangToggleStatusSchema = getHutangToggleStatusSchema();

export type HutangContactSchema = z.infer<typeof hutangContactSchema>;
export type HutangTransactionSchema = z.infer<typeof hutangTransactionSchema>;
export type HutangSchema = z.infer<typeof hutangSchema>;
export type CicilanSchema = z.infer<typeof cicilanSchema>;
export type HutangToggleStatusSchema = z.infer<typeof hutangToggleStatusSchema>;
