import { z } from 'zod';

export const hutangContactSchema = z.object({
  nama_entitas: z.string().min(1, 'Nama wajib diisi').max(200),
  catatan: z.string().max(500).optional().or(z.literal("")),
});

export const hutangTransactionSchema = z.object({
  hutang_id: z.string().uuid(),
  jenis_transaksi: z.enum(['pembayaran', 'pinjaman']),
  nominal: z
    .number({ error: 'Nominal harus berupa angka' })
    .positive('Nominal harus lebih dari 0'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  waktu: z.string().optional().or(z.literal("")),
  rekening_id: z.string().uuid().optional().or(z.literal("")),
  catatan: z.string().max(200).optional().or(z.literal("")),
});

export const hutangSchema = z.object({
  tipe: z.enum(['memberi', 'menerima']),
  nama_entitas: z.string().min(1, 'Nama wajib diisi').max(200),
  total_pinjaman: z
    .number({ error: 'Nominal harus berupa angka' })
    .positive('Nominal harus lebih dari 0'),
  tanggal_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tanggal_jatuh_tempo: z.string().optional().or(z.literal("")),
  waktu: z.string().optional().or(z.literal("")),
  rekening_id: z.string().uuid().optional().or(z.literal("")),
  catatan: z.string().max(500).optional().or(z.literal("")),
});

export const cicilanSchema = z.object({
  hutang_id: z.string().uuid(),
  jenis_transaksi: z.enum(['pembayaran', 'pinjaman']).optional(),
  rekening_id: z.string().uuid().optional(),
  nominal: z
    .number({ error: 'Nominal harus berupa angka' })
    .positive('Nominal harus lebih dari 0'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  waktu: z.string().optional().or(z.literal("")),
  catatan: z.string().max(200).optional().or(z.literal("")),
});

export const hutangToggleStatusSchema = z.object({
  id: z.string().uuid(),
  is_lunas: z.boolean(),
});

export type HutangContactSchema = z.infer<typeof hutangContactSchema>;
export type HutangTransactionSchema = z.infer<typeof hutangTransactionSchema>;
export type HutangSchema = z.infer<typeof hutangSchema>;
export type CicilanSchema = z.infer<typeof cicilanSchema>;
export type HutangToggleStatusSchema = z.infer<typeof hutangToggleStatusSchema>;

