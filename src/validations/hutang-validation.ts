import { z } from 'zod';

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
  rekening_id: z.string().uuid().optional(),
  nominal: z
    .number({ error: 'Nominal harus berupa angka' })
    .positive('Nominal harus lebih dari 0'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  waktu: z.string().optional().or(z.literal("")),
  catatan: z.string().max(200).optional().or(z.literal("")),
});

export type HutangSchema = z.infer<typeof hutangSchema>;
export type CicilanSchema = z.infer<typeof cicilanSchema>;
