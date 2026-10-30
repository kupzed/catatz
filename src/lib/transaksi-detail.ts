import { TIPE_CONFIG, getTipeConfig } from "@/constants/transaksi";
import type { Transaksi } from "@/types/transaksi";
import type { Dictionary } from "@/i18n/types";

const SYSTEM_TAG_PREFIXES = ["correction_"];
const SYSTEM_TAGS = new Set(["correction_add", "correction_sub"]);

/**
 * Menyaring tag internal/sistem (seperti `correction_add`, `correction_sub`)
 * agar hanya tag buatan pengguna yang tampil di UI.
 */
export function filterSystemTags(tags?: string[] | null): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  return tags.filter(
    (tag) =>
      typeof tag === "string" &&
      !SYSTEM_TAGS.has(tag) &&
      !SYSTEM_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix)),
  );
}

/**
 * Mengidentifikasi arah koreksi saldo dari tag sistem internal.
 */
export function getCorrectionDirection(
  tags?: string[] | null,
): "add" | "sub" | null {
  if (!tags || !Array.isArray(tags)) return null;
  if (tags.includes("correction_add")) return "add";
  if (tags.includes("correction_sub")) return "sub";
  return null;
}

export type TransaksiNominalDisplay = {
  sign: string;
  label: string;
  colorClass: string;
  badgeClass: string;
  isNegative: boolean;
};

/**
 * Menghasilkan metadata tampilan nominal (sign prefix, label tipe, dan class warna semantik)
 * sesuai DESIGN.md dan tipe transaksi.
 */
export function getTransaksiNominalDisplay(
  transaksi: Pick<Transaksi, "tipe"> & {
    tags?: string[] | null;
  },
  dict?: Dictionary,
): TransaksiNominalDisplay {
  const { tipe, tags } = transaksi;
  const config = getTipeConfig(dict);

  if (tipe === "income") {
    return {
      sign: "+",
      label: config.income.label,
      colorClass: "text-semantic-up",
      badgeClass: TIPE_CONFIG.income.badge,
      isNegative: false,
    };
  }

  if (tipe === "expense") {
    return {
      sign: "-",
      label: config.expense.label,
      colorClass: "text-semantic-down",
      badgeClass: TIPE_CONFIG.expense.badge,
      isNegative: true,
    };
  }

  if (tipe === "transfer") {
    return {
      sign: "",
      label: config.transfer.label,
      colorClass: "text-foreground",
      badgeClass: TIPE_CONFIG.transfer.badge,
      isNegative: false,
    };
  }

  if (tipe === "correction") {
    const direction = getCorrectionDirection(tags);
    if (direction === "add") {
      return {
        sign: "+",
        label: dict?.transactions.types.correctionAdd ?? "Koreksi (Penambahan)",
        colorClass: "text-accent-yellow",
        badgeClass: TIPE_CONFIG.correction.badge,
        isNegative: false,
      };
    }
    if (direction === "sub") {
      return {
        sign: "-",
        label: dict?.transactions.types.correctionSub ?? "Koreksi (Pengurangan)",
        colorClass: "text-accent-yellow",
        badgeClass: TIPE_CONFIG.correction.badge,
        isNegative: true,
      };
    }
    return {
      sign: "",
      label: config.correction.label,
      colorClass: "text-accent-yellow",
      badgeClass: TIPE_CONFIG.correction.badge,
      isNegative: false,
    };
  }

  return {
    sign: "",
    label: dict?.transactions.title ?? "Transaksi",
    colorClass: "text-foreground",
    badgeClass: "bg-surface-strong text-muted-foreground",
    isNegative: false,
  };
}

/**
 * Menentukan nama tampilan utama transaksi.
 * Untuk tipe transfer dan koreksi saldo, nama tampilan selalu label default (bukan catatan).
 */
export function getTransaksiDisplayName(
  transaksi: Pick<Transaksi, "tipe"> & {
    judul?: string | null;
    catatan?: string | null;
  },
  dict?: Dictionary,
): string {
  const config = getTipeConfig(dict);
  if (transaksi.tipe === "transfer" || transaksi.tipe === "correction") {
    return config[transaksi.tipe]?.label ?? dict?.transactions.title ?? "Transaksi";
  }
  if (transaksi.judul?.trim()) return transaksi.judul.trim();
  if (transaksi.catatan?.trim()) return transaksi.catatan.trim();
  return config[transaksi.tipe]?.label ?? dict?.transactions.title ?? "Transaksi";
}
