import { z } from "zod";
import { parseDateString, compareDates } from "@/lib/rekap-period";
import type { Dictionary } from "@/i18n/types";

export type RekapValidationDict = Dictionary["errors"]["validation"];

/**
 * Nilai default pengaturan rekapitulasi keuangan
 */
export const DEFAULT_REKAP_SETTINGS = {
  cutoff_day: 1,
  akumulasi_saldo: false,
} as const;

/**
 * Schema factory validasi pengaturan siklus dan akumulasi saldo rekap
 */
export function getRekapSettingsSchema(dict?: Dictionary | RekapValidationDict) {
  const v = dict ? ("errors" in dict ? dict.errors.validation : dict) : undefined;
  return z.object({
    cutoff_day: z
      .number({
        error: v?.cutoffDayNumber ?? "Cut-off hari harus berupa angka",
      })
      .int(v?.cutoffDayInteger ?? "Cut-off hari harus berupa bilangan bulat")
      .min(1, v?.cutoffDayMin ?? "Cut-off hari minimal 1")
      .max(31, v?.cutoffDayMax ?? "Cut-off hari maksimal 31"),
    akumulasi_saldo: z.boolean({
      error:
        v?.accumulateBalanceBoolean ?? "Akumulasi saldo harus bernilai boolean",
    }),
  });
}

export const rekapSettingsSchema = getRekapSettingsSchema();
export type RekapSettingsSchema = z.infer<typeof rekapSettingsSchema>;

/**
 * Helper schema factory untuk string tanggal ISO YYYY-MM-DD yang valid kalendernya
 */
export function getDateStringSchema(dict?: Dictionary | RekapValidationDict) {
  const v = dict ? ("errors" in dict ? dict.errors.validation : dict) : undefined;
  return z
    .string({
      error: v?.dateRequired ?? "Tanggal wajib diisi",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, v?.dateFormatYMD ?? "Format tanggal harus YYYY-MM-DD")
    .refine((val) => parseDateString(val) !== null, {
      message: v?.invalidDateFormat ?? "Format tanggal tidak valid",
    });
}

export const dateStringSchema = getDateStringSchema();

/**
 * Schema factory validasi rentang tanggal dari dan sampai (YYYY-MM-DD valid, sampai >= dari)
 */
export function getDateRangeSchema(dict?: Dictionary | RekapValidationDict) {
  const v = dict ? ("errors" in dict ? dict.errors.validation : dict) : undefined;
  const dSchema = getDateStringSchema(dict);

  return z
    .object({
      dari: dSchema,
      sampai: dSchema,
    })
    .refine(
      (data) => {
        if (!parseDateString(data.dari) || !parseDateString(data.sampai)) {
          return true;
        }
        return compareDates(data.sampai, data.dari) >= 0;
      },
      {
        message:
          v?.endDateBeforeStartDateRange ??
          "Tanggal sampai tidak boleh lebih awal dari tanggal dari",
        path: ["sampai"],
      },
    );
}

export const dateRangeSchema = getDateRangeSchema();
export type DateRangeSchema = z.infer<typeof dateRangeSchema>;

/**
 * Schema factory validasi periode kustom rekap
 */
export function getCustomPeriodSchema(dict?: Dictionary | RekapValidationDict) {
  const v = dict ? ("errors" in dict ? dict.errors.validation : dict) : undefined;
  const dSchema = getDateStringSchema(dict);

  return z
    .object({
      nama: z
        .string({
          error: v?.periodNameRequired ?? "Nama periode wajib diisi",
        })
        .trim()
        .min(1, v?.periodNameRequired ?? "Nama periode wajib diisi")
        .max(100, v?.periodNameMaxLength ?? "Nama periode maksimal 100 karakter"),
      tanggal_mulai: dSchema,
      tanggal_selesai: dSchema,
    })
    .refine(
      (data) => {
        if (
          !parseDateString(data.tanggal_mulai) ||
          !parseDateString(data.tanggal_selesai)
        ) {
          return true;
        }
        return compareDates(data.tanggal_selesai, data.tanggal_mulai) >= 0;
      },
      {
        message:
          v?.endDateBeforeStartDate ??
          "Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
        path: ["tanggal_selesai"],
      },
    );
}

export const customPeriodSchema = getCustomPeriodSchema();
export type CustomPeriodSchema = z.infer<typeof customPeriodSchema>;

/**
 * Schema factory validasi query parameter halaman detail rekap (/reports/detail)
 * Format query: ?dari=YYYY-MM-DD&sampai=YYYY-MM-DD&jenis=bulanan|custom[&id=uuid]
 */
export function getRekapDetailQuerySchema(dict?: Dictionary | RekapValidationDict) {
  const v = dict ? ("errors" in dict ? dict.errors.validation : dict) : undefined;
  const dSchema = getDateStringSchema(dict);

  return z
    .object({
      dari: dSchema,
      sampai: dSchema,
      jenis: z.enum(["bulanan", "custom"], {
        error:
          v?.periodTypeInvalid ?? "Jenis periode harus 'bulanan' atau 'custom'",
      }),
      id: z
        .string()
        .uuid(
          v?.invalidCustomPeriodId ??
            "ID periode kustom harus berupa UUID yang valid",
        )
        .optional(),
    })
    .refine(
      (data) => {
        if (!parseDateString(data.dari) || !parseDateString(data.sampai)) {
          return true;
        }
        return compareDates(data.sampai, data.dari) >= 0;
      },
      {
        message:
          v?.endDateBeforeStartDateRange ??
          "Tanggal sampai tidak boleh lebih awal dari tanggal dari",
        path: ["sampai"],
      },
    );
}

export const rekapDetailQuerySchema = getRekapDetailQuerySchema();
export type RekapDetailQuerySchema = z.infer<typeof rekapDetailQuerySchema>;
