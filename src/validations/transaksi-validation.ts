import { z } from "zod";

export const transaksiSchema = z
  .object({
    tipe: z.enum(["income", "expense", "transfer", "correction"]),
    judul: z.string().max(200, "Judul maksimal 200 karakter").optional().nullable(),
    nominal: z
      .number({ error: "Nominal harus berupa angka" })
      .positive("Nominal harus lebih dari 0"),
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    waktu: z.string().optional(),
    kategori_id: z.string().uuid().optional(),
    rekening_id: z.string().uuid("Pilih rekening terlebih dahulu"),
    rekening_tujuan: z.string().uuid().optional(),
    catatan: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),
    is_recurring: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.tipe === "transfer") return !!data.rekening_tujuan;
      return true;
    },
    {
      message: "Rekening tujuan wajib dipilih untuk transfer",
      path: ["rekening_tujuan"],
    },
  )
  .refine(
    (data) => {
      if (data.tipe === "transfer")
        return data.rekening_id !== data.rekening_tujuan;
      return true;
    },
    {
      message: "Rekening asal dan tujuan tidak boleh sama",
      path: ["rekening_tujuan"],
    },
  )
  .refine(
    (data) => {
      // Transaksi correction & transfer tidak boleh memiliki judul
      if (data.tipe === "correction" || data.tipe === "transfer") return !data.judul;
      return true;
    },
    {
      message: "Transaksi koreksi & transfer tidak boleh memiliki judul",
      path: ["judul"],
    },
  );

export type TransaksiSchema = z.infer<typeof transaksiSchema>;
