import { describe, expect, it } from "vitest";
import {
  filterSystemTags,
  getCorrectionDirection,
  getTransaksiNominalDisplay,
  getTransaksiDisplayName,
} from "@/lib/transaksi-detail";
import enDict from "@/i18n/dictionaries/en";

describe("transaksi-detail pure helpers", () => {
  describe("filterSystemTags", () => {
    it("returns empty array when tags are null, undefined, or empty", () => {
      expect(filterSystemTags(null)).toEqual([]);
      expect(filterSystemTags(undefined)).toEqual([]);
      expect(filterSystemTags([])).toEqual([]);
    });

    it("returns user tags intact when there are no system tags", () => {
      const tags = ["makan", "liburan", "gaji"];
      expect(filterSystemTags(tags)).toEqual(["makan", "liburan", "gaji"]);
    });

    it("filters out correction_add, correction_sub and any correction_ prefixed tags", () => {
      const mixed = ["tag1", "correction_add", "tag2", "correction_sub", "correction_other"];
      expect(filterSystemTags(mixed)).toEqual(["tag1", "tag2"]);
    });
  });

  describe("getCorrectionDirection", () => {
    it("returns null for null, undefined, or empty tags", () => {
      expect(getCorrectionDirection(null)).toBeNull();
      expect(getCorrectionDirection(undefined)).toBeNull();
      expect(getCorrectionDirection([])).toBeNull();
    });

    it("identifies correction_add correctly", () => {
      expect(getCorrectionDirection(["correction_add", "user-tag"])).toBe("add");
    });

    it("identifies correction_sub correctly", () => {
      expect(getCorrectionDirection(["correction_sub", "user-tag"])).toBe("sub");
    });

    it("returns null when no correction system tag is present", () => {
      expect(getCorrectionDirection(["normal-tag"])).toBeNull();
    });
  });

  describe("getTransaksiNominalDisplay", () => {
    it("formats income correctly", () => {
      const result = getTransaksiNominalDisplay({ tipe: "income" });
      expect(result.sign).toBe("+");
      expect(result.label).toBe("Pemasukan");
      expect(result.colorClass).toBe("text-semantic-up");
      expect(result.isNegative).toBe(false);
    });

    it("formats expense correctly", () => {
      const result = getTransaksiNominalDisplay({ tipe: "expense" });
      expect(result.sign).toBe("-");
      expect(result.label).toBe("Pengeluaran");
      expect(result.colorClass).toBe("text-semantic-down");
      expect(result.isNegative).toBe(true);
    });

    it("formats transfer correctly", () => {
      const result = getTransaksiNominalDisplay({ tipe: "transfer" });
      expect(result.sign).toBe("");
      expect(result.label).toBe("Transfer");
      expect(result.colorClass).toBe("text-foreground");
      expect(result.isNegative).toBe(false);
    });

    it("formats correction with addition direction", () => {
      const result = getTransaksiNominalDisplay({
        tipe: "correction",
        tags: ["correction_add"],
      });
      expect(result.sign).toBe("+");
      expect(result.label).toBe("Koreksi (Penambahan)");
      expect(result.colorClass).toBe("text-accent-yellow");
      expect(result.isNegative).toBe(false);
    });

    it("formats correction with subtraction direction", () => {
      const result = getTransaksiNominalDisplay({
        tipe: "correction",
        tags: ["correction_sub"],
      });
      expect(result.sign).toBe("-");
      expect(result.label).toBe("Koreksi (Pengurangan)");
      expect(result.colorClass).toBe("text-accent-yellow");
      expect(result.isNegative).toBe(true);
    });

    it("formats correction without direction tags as fallback", () => {
      const result = getTransaksiNominalDisplay({
        tipe: "correction",
        tags: [],
      });
      expect(result.sign).toBe("");
      expect(result.label).toBe("Koreksi Saldo");
      expect(result.colorClass).toBe("text-accent-yellow");
      expect(result.isNegative).toBe(false);
    });

    it("formats labels using English dictionary when provided", () => {
      expect(getTransaksiNominalDisplay({ tipe: "income" }, enDict).label).toBe("Income");
      expect(getTransaksiNominalDisplay({ tipe: "expense" }, enDict).label).toBe("Expense");
      expect(getTransaksiNominalDisplay({ tipe: "transfer" }, enDict).label).toBe("Transfer");
      expect(
        getTransaksiNominalDisplay(
          { tipe: "correction", tags: ["correction_add"] },
          enDict,
        ).label,
      ).toBe("Correction (Addition)");
      expect(
        getTransaksiNominalDisplay(
          { tipe: "correction", tags: ["correction_sub"] },
          enDict,
        ).label,
      ).toBe("Correction (Subtraction)");
      expect(
        getTransaksiNominalDisplay({ tipe: "correction" }, enDict).label,
      ).toBe("Balance Correction");
    });
  });

  describe("getTransaksiDisplayName", () => {
    it("returns localized default type label in English when dict is provided", () => {
      expect(
        getTransaksiDisplayName({ tipe: "transfer", judul: null }, enDict),
      ).toBe("Transfer");
      expect(
        getTransaksiDisplayName({ tipe: "correction", judul: null }, enDict),
      ).toBe("Balance Correction");
      expect(
        getTransaksiDisplayName({ tipe: "expense", judul: null, catatan: null }, enDict),
      ).toBe("Expense");
      expect(
        getTransaksiDisplayName({ tipe: "income", judul: "", catatan: " " }, enDict),
      ).toBe("Income");
    });
    it("returns judul if present and trimmed for income/expense", () => {
      expect(getTransaksiDisplayName({ tipe: "expense", judul: "  Beli Kopi  " })).toBe("Beli Kopi");
      expect(getTransaksiDisplayName({ tipe: "income", judul: "Gaji Kantor" })).toBe("Gaji Kantor");
    });

    it("falls back to catatan for income/expense if judul is empty or null", () => {
      expect(getTransaksiDisplayName({ tipe: "expense", judul: null, catatan: "Makan siang" })).toBe("Makan siang");
    });

    it("always returns default type label for transfer and correction even when catatan exists", () => {
      expect(getTransaksiDisplayName({ tipe: "transfer", judul: null, catatan: "Transfer bulanan" })).toBe("Transfer");
      expect(getTransaksiDisplayName({ tipe: "correction", judul: null, catatan: "Penyesuaian kas" })).toBe("Koreksi Saldo");
    });

    it("falls back to tipe label if both judul and catatan are empty", () => {
      expect(getTransaksiDisplayName({ tipe: "expense", judul: null, catatan: null })).toBe("Pengeluaran");
      expect(getTransaksiDisplayName({ tipe: "income", judul: "", catatan: "   " })).toBe("Pemasukan");
    });
  });
});
