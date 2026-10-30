import { describe, it, expect } from "vitest";
import idDict from "@/i18n/dictionaries/id";
import enDict from "@/i18n/dictionaries/en";

describe("Categories i18n dictionary", () => {
  describe("Bahasa Indonesia", () => {
    it("memiliki terjemahan kategori yang tepat dan lengkap", () => {
      expect(idDict.categories.title).toBe("Kategori");
      expect(idDict.categories.types.income).toBe("Pemasukan");
      expect(idDict.categories.types.expense).toBe("Pengeluaran");
      expect(idDict.categories.types.all).toBe("Semua");
      expect(idDict.categories.totalCategories).toBe("Total Kategori");
      expect(idDict.categories.form.createTitle).toBe("Tambah Kategori");
      expect(idDict.categories.form.editTitle).toBe("Edit Kategori");
      expect(idDict.categories.detail.title).toBe("Detail Kategori");
      expect(idDict.categories.stats.netCashflow).toBe("Arus Kas Bersih");
    });
  });

  describe("English", () => {
    it("has accurate and complete category translations according to glossary", () => {
      expect(enDict.categories.title).toBe("Categories");
      expect(enDict.categories.types.income).toBe("Income");
      expect(enDict.categories.types.expense).toBe("Expense");
      expect(enDict.categories.types.all).toBe("All");
      expect(enDict.categories.totalCategories).toBe("Total Categories");
      expect(enDict.categories.form.createTitle).toBe("Add Category");
      expect(enDict.categories.form.editTitle).toBe("Edit Category");
      expect(enDict.categories.detail.title).toBe("Category Details");
      expect(enDict.categories.stats.netCashflow).toBe("Net Cash Flow");
    });
  });
});

