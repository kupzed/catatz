import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Transaksi, KategoriUsageCounts, Kategori } from "@/types/transaksi";

const kategoriIdParamSchema = z.string().uuid("ID kategori tidak valid");

function calculateKategoriStats(
  kategori: Pick<Kategori, "tipe">,
  transaksi: Transaksi[],
) {
  let expense = 0;
  let income = 0;

  for (const t of transaksi) {
    const nominal = Number(t.nominal);
    if (t.tipe === "expense") {
      expense += nominal;
    } else if (t.tipe === "income") {
      income += nominal;
    }
  }

  const count = transaksi.length;
  const totalAmount = kategori.tipe === "income" ? income : expense;
  const avg = count > 0 ? totalAmount / count : 0;

  return {
    totalExpense: expense,
    totalIncome: income,
    netFlow: income - expense,
    count,
    avgAmount: avg,
  };
}

function usageDescription(usage: KategoriUsageCounts) {
  const parts = [
    usage.transaksi > 0 ? `${usage.transaksi} transaksi` : null,
    usage.budget > 0 ? `${usage.budget} budget bulanan` : null,
    usage.recurring > 0 ? `${usage.recurring} template transaksi berulang` : null,
  ].filter(Boolean);

  return `Kategori ini masih dipakai oleh ${parts.join(", ")}. Hapus atau ubah data terkait terlebih dahulu sebelum menghapus kategori.`;
}

describe("Kategori Detail & Usage Logic", () => {
  describe("kategoriIdParamSchema", () => {
    it("accepts valid UUID strings", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = kategoriIdParamSchema.safeParse(validUuid);
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID strings", () => {
      const invalidUuid = "not-a-uuid-string";
      const result = kategoriIdParamSchema.safeParse(invalidUuid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID kategori tidak valid");
      }
    });
  });

  describe("calculateKategoriStats", () => {
    const katExpense: Pick<Kategori, "tipe"> = { tipe: "expense" };
    const katIncome: Pick<Kategori, "tipe"> = { tipe: "income" };
    const katAll: Pick<Kategori, "tipe"> = { tipe: "all" };

    const mockTransactions: Transaksi[] = [
      {
        id: "tx-1",
        user_id: "user-1",
        tipe: "expense",
        nominal: 50000,
        tanggal: "2026-10-15",
        waktu: "12:00",
        kategori_id: "kat-1",
        rekening_id: "rek-1",
        rekening_tujuan: null,
        judul: "Makan Siang",
        catatan: null,
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-15T12:00:00Z",
        updated_at: "2026-10-15T12:00:00Z",
      },
      {
        id: "tx-2",
        user_id: "user-1",
        tipe: "expense",
        nominal: 150000,
        tanggal: "2026-10-16",
        waktu: "19:00",
        kategori_id: "kat-1",
        rekening_id: "rek-1",
        rekening_tujuan: null,
        judul: "Makan Malam",
        catatan: null,
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-16T19:00:00Z",
        updated_at: "2026-10-16T19:00:00Z",
      },
      {
        id: "tx-3",
        user_id: "user-1",
        tipe: "income",
        nominal: 1000000,
        tanggal: "2026-10-17",
        waktu: "08:00",
        kategori_id: "kat-1",
        rekening_id: "rek-1",
        rekening_tujuan: null,
        judul: "Cashback",
        catatan: null,
        tags: [],
        is_recurring: false,
        recurring_id: null,
        created_at: "2026-10-17T08:00:00Z",
        updated_at: "2026-10-17T08:00:00Z",
      },
    ];

    it("calculates stats correctly for expense category", () => {
      const stats = calculateKategoriStats(katExpense, mockTransactions);
      expect(stats.totalExpense).toBe(200000);
      expect(stats.count).toBe(3);
      expect(stats.avgAmount).toBe(200000 / 3);
    });

    it("calculates stats correctly for income category", () => {
      const stats = calculateKategoriStats(katIncome, mockTransactions);
      expect(stats.totalIncome).toBe(1000000);
      expect(stats.count).toBe(3);
      expect(stats.avgAmount).toBe(1000000 / 3);
    });

    it("calculates netFlow correctly for 'all' category", () => {
      const stats = calculateKategoriStats(katAll, mockTransactions);
      expect(stats.netFlow).toBe(1000000 - 200000); // 800,000
    });

    it("handles zero transactions gracefully", () => {
      const stats = calculateKategoriStats(katExpense, []);
      expect(stats.totalExpense).toBe(0);
      expect(stats.totalIncome).toBe(0);
      expect(stats.count).toBe(0);
      expect(stats.avgAmount).toBe(0);
      expect(stats.netFlow).toBe(0);
    });
  });

  describe("usageDescription", () => {
    it("formats description with all usage components", () => {
      const usage: KategoriUsageCounts = {
        transaksi: 5,
        transaksi_masuk: 2,
        transaksi_keluar: 3,
        budget: 1,
        recurring: 2,
        total: 8,
      };

      const desc = usageDescription(usage);
      expect(desc).toContain("5 transaksi");
      expect(desc).toContain("1 budget bulanan");
      expect(desc).toContain("2 template transaksi berulang");
      expect(desc).toContain("Hapus atau ubah data terkait");
    });

    it("formats description when only transactions are linked", () => {
      const usage: KategoriUsageCounts = {
        transaksi: 3,
        transaksi_masuk: 0,
        transaksi_keluar: 3,
        budget: 0,
        recurring: 0,
        total: 3,
      };

      const desc = usageDescription(usage);
      expect(desc).toBe(
        "Kategori ini masih dipakai oleh 3 transaksi. Hapus atau ubah data terkait terlebih dahulu sebelum menghapus kategori.",
      );
    });
  });
});
