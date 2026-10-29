import { z } from "zod";
import type { Dictionary } from "@/i18n/types";

export type TransaksiValidationDict = Dictionary["errors"]["validation"];

export function getTransaksiSchema(dict?: Dictionary | TransaksiValidationDict) {
  const v = dict ? ("errors" in dict ? dict.errors.validation : dict) : undefined;

  return z
    .object({
      tipe: z.enum(["income", "expense", "transfer", "correction"]),
      judul: z
        .string()
        .max(200, v?.titleMaxLength ?? "Judul maksimal 200 karakter")
        .optional()
        .nullable(),
      nominal: z
        .number({
          error:
            v?.nominalMustBeNumber ?? v?.mustBeNumber ?? "Nominal harus berupa angka",
        })
        .positive(v?.mustBePositive ?? "Nominal harus lebih dari 0"),
      tanggal: z.string().min(1, v?.dateRequired ?? "Tanggal wajib diisi"),
      waktu: z.string().optional(),
      kategori_id: z.string().uuid().optional(),
      rekening_id: z.string().uuid(v?.selectWallet ?? "Pilih rekening terlebih dahulu"),
      rekening_tujuan: z.string().uuid().optional(),
      catatan: z.string().max(500).optional(),
      tags: z.array(z.string()).optional(),
      is_recurring: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.tipe === "income" || data.tipe === "expense") {
          return !!data.judul?.trim();
        }
        return true;
      },
      {
        message: v?.titleRequired ?? "Judul wajib diisi",
        path: ["judul"],
      },
    )
    .refine(
      (data) => {
        if (data.tipe === "income" || data.tipe === "expense") {
          return !!data.kategori_id;
        }
        return true;
      },
      {
        message: v?.selectCategory ?? "Kategori wajib dipilih",
        path: ["kategori_id"],
      },
    )
    .refine(
      (data) => {
        if (data.tipe === "transfer") return !!data.rekening_tujuan;
        return true;
      },
      {
        message:
          v?.destinationWalletRequired ??
          "Rekening tujuan wajib dipilih untuk transfer",
        path: ["rekening_tujuan"],
      },
    )
    .refine(
      (data) => {
        if (data.tipe !== "transfer") return !data.rekening_tujuan;
        return true;
      },
      {
        message:
          v?.destinationWalletOnlyForTransfer ??
          "Rekening tujuan hanya boleh diisi untuk transfer",
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
        message:
          v?.sameWalletTransfer ?? "Rekening asal dan tujuan tidak boleh sama",
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
        message:
          v?.transferOrCorrectionNoTitle ??
          "Transaksi koreksi & transfer tidak boleh memiliki judul",
        path: ["judul"],
      },
    )
    .refine(
      (data) => {
        // Transaksi correction & transfer tidak boleh memiliki kategori
        if (data.tipe === "correction" || data.tipe === "transfer") {
          return !data.kategori_id;
        }
        return true;
      },
      {
        message:
          v?.transferOrCorrectionNoCategory ??
          "Transaksi transfer & koreksi tidak boleh memiliki kategori",
        path: ["kategori_id"],
      },
    );
}

export function getTransaksiIdParamSchema(
  dict?: Dictionary | TransaksiValidationDict,
) {
  const v = dict ? ("errors" in dict ? dict.errors.validation : dict) : undefined;
  return z.string().uuid(v?.invalidTransactionId ?? "ID transaksi tidak valid");
}

export const transaksiSchema = getTransaksiSchema();
export const transaksiIdParamSchema = getTransaksiIdParamSchema();

export type TransaksiSchema = z.infer<typeof transaksiSchema>;
