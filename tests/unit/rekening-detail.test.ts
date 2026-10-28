import { describe, expect, it } from "vitest";
import { rekeningIdParamSchema } from "@/validations/rekening-validation";
import type { Transaksi } from "@/types/transaksi";
import { getJenisDisplay } from "@/constants/banks";
import idDict from "@/i18n/dictionaries/id";
import enDict from "@/i18n/dictionaries/en";

function calculateRekeningStats(rekeningId: string, transaksi: Transaksi[]) {
  let inflow = 0;
  let outflow = 0;

  for (const t of transaksi) {
    const nominal = Number(t.nominal);
    if (t.tipe === "income" && t.rekening_id === rekeningId) {
      inflow += nominal;
    } else if (t.tipe === "expense" && t.rekening_id === rekeningId) {
      outflow += nominal;
    } else if (t.tipe === "transfer") {
      if (t.rekening_id === rekeningId) {
        outflow += nominal;
      }
      if (t.rekening_tujuan === rekeningId) {
        inflow += nominal;
      }
    }
  }

  return {
    totalInflow: inflow,
    totalOutflow: outflow,
    netFlow: inflow - outflow,
  };
}

describe("Rekening Detail & Validation Logic", () => {
  describe("rekeningIdParamSchema", () => {
    it("accepts valid UUID strings", () => {
      const validUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const result = rekeningIdParamSchema.safeParse(validUuid);
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID strings", () => {
      const invalidUuid = "not-a-valid-uuid-123";
      const result = rekeningIdParamSchema.safeParse(invalidUuid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID rekening tidak valid");
      }
    });
  });

  describe("calculateRekeningStats", () => {
    const rekA = "rek-a";
    const rekB = "rek-b";

    const mockTransactions: Transaksi[] = [
      {
        id: "trx-1",
        user_id: "user-1",
        tipe: "income",
        nominal: 500000,
        tanggal: "2026-10-10",
        waktu: "10:00",
        kategori_id: "kat-gaji",
        rekening_id: rekA,
        rekening_tujuan: null,
        judul: "Gaji",
        catatan: null,
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-10T10:00:00Z",
        updated_at: "2026-10-10T10:00:00Z",
      },
      {
        id: "trx-2",
        user_id: "user-1",
        tipe: "expense",
        nominal: 150000,
        tanggal: "2026-10-11",
        waktu: "12:00",
        kategori_id: "kat-makan",
        rekening_id: rekA,
        rekening_tujuan: null,
        judul: "Makan Siang",
        catatan: null,
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-11T12:00:00Z",
        updated_at: "2026-10-11T12:00:00Z",
      },
      {
        id: "trx-3",
        user_id: "user-1",
        tipe: "transfer",
        nominal: 200000,
        tanggal: "2026-10-12",
        waktu: "14:00",
        kategori_id: null,
        rekening_id: rekA,
        rekening_tujuan: rekB,
        judul: null,
        catatan: "Transfer ke Dompet B",
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-12T14:00:00Z",
        updated_at: "2026-10-12T14:00:00Z",
      },
      {
        id: "trx-4",
        user_id: "user-1",
        tipe: "transfer",
        nominal: 50000,
        tanggal: "2026-10-13",
        waktu: "15:00",
        kategori_id: null,
        rekening_id: rekB,
        rekening_tujuan: rekA,
        judul: null,
        catatan: "Top up balik dari B",
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-13T15:00:00Z",
        updated_at: "2026-10-13T15:00:00Z",
      },
      {
        id: "trx-5",
        user_id: "user-1",
        tipe: "correction",
        nominal: 100000,
        tanggal: "2026-10-14",
        waktu: "09:00",
        kategori_id: null,
        rekening_id: rekA,
        rekening_tujuan: null,
        judul: null,
        catatan: "Koreksi selisih",
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-14T09:00:00Z",
        updated_at: "2026-10-14T09:00:00Z",
      },
    ];

    it("correctly calculates inflow, outflow, and netFlow for source wallet (rekA)", () => {
      const statsA = calculateRekeningStats(rekA, mockTransactions);
      // Inflow for rekA: 500,000 (income) + 50,000 (transfer in from B) = 550,000
      expect(statsA.totalInflow).toBe(550000);
      // Outflow for rekA: 150,000 (expense) + 200,000 (transfer out to B) = 350,000
      expect(statsA.totalOutflow).toBe(350000);
      // Net flow: 550,000 - 350,000 = 200,000
      expect(statsA.netFlow).toBe(200000);
    });

    it("correctly calculates inflow, outflow, and netFlow for destination wallet (rekB)", () => {
      const statsB = calculateRekeningStats(rekB, mockTransactions);
      // Inflow for rekB: 200,000 (transfer in from A) = 200,000
      expect(statsB.totalInflow).toBe(200000);
      // Outflow for rekB: 50,000 (transfer out to A) = 50,000
      expect(statsB.totalOutflow).toBe(50000);
      // Net flow: 200,000 - 50,000 = 150,000
      expect(statsB.netFlow).toBe(150000);
    });
  });

  describe("getJenisDisplay", () => {
    it("returns original string when dictionary is not provided", () => {
      expect(getJenisDisplay("Tunai")).toBe("Tunai");
      expect(getJenisDisplay("Investasi")).toBe("Investasi");
      expect(getJenisDisplay("Bank")).toBe("Bank");
      expect(getJenisDisplay("E-Wallet")).toBe("E-Wallet");
      expect(getJenisDisplay("CustomType")).toBe("CustomType");
    });

    it("returns localized Indonesian display when idDictionary is provided", () => {
      expect(getJenisDisplay("Tunai", idDict)).toBe("Tunai");
      expect(getJenisDisplay("Investasi", idDict)).toBe("Investasi");
      expect(getJenisDisplay("Bank", idDict)).toBe("Bank");
      expect(getJenisDisplay("E-Wallet", idDict)).toBe("E-Wallet");
    });

    it("returns localized English display when enDictionary is provided", () => {
      expect(getJenisDisplay("Tunai", enDict)).toBe("Cash");
      expect(getJenisDisplay("Investasi", enDict)).toBe("Investment");
      expect(getJenisDisplay("Bank", enDict)).toBe("Bank");
      expect(getJenisDisplay("E-Wallet", enDict)).toBe("E-Wallet");
    });
  });
});
