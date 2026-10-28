import { describe, it, expect } from "vitest";
import { getStatusHutangDisplay } from "@/constants/hutang";
import idDict from "@/i18n/dictionaries/id";
import enDict from "@/i18n/dictionaries/en";

describe("getStatusHutangDisplay helper", () => {
  describe("dengan Indonesian dictionary", () => {
    it("menerjemahkan status hutang ke Bahasa Indonesia", () => {
      expect(getStatusHutangDisplay("aktif", idDict)).toBe("Aktif");
      expect(getStatusHutangDisplay("lunas", idDict)).toBe("Lunas");
      expect(getStatusHutangDisplay("overdue", idDict)).toBe("Jatuh Tempo");
      expect(getStatusHutangDisplay("custom_status", idDict)).toBe("custom_status");
    });
  });

  describe("dengan English dictionary", () => {
    it("translates debt statuses to English per glossary", () => {
      expect(getStatusHutangDisplay("aktif", enDict)).toBe("Active");
      expect(getStatusHutangDisplay("lunas", enDict)).toBe("Paid Off");
      expect(getStatusHutangDisplay("overdue", enDict)).toBe("Overdue");
      expect(getStatusHutangDisplay("custom_status", enDict)).toBe("custom_status");
    });
  });

  describe("tanpa dictionary (fallback)", () => {
    it("mengembalikan status asli sebagai fallback aman", () => {
      expect(getStatusHutangDisplay("aktif")).toBe("aktif");
      expect(getStatusHutangDisplay("lunas")).toBe("lunas");
      expect(getStatusHutangDisplay("overdue")).toBe("overdue");
      expect(getStatusHutangDisplay("unknown")).toBe("unknown");
    });
  });
});

