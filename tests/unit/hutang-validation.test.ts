import { describe, it, expect } from "vitest";
import {
  hutangContactSchema,
  hutangTransactionSchema,
  hutangToggleStatusSchema,
} from "@/validations/hutang-validation";

describe("hutang-validation tests", () => {
  describe("hutangContactSchema (Index + Tambah)", () => {
    it("valid jika hanya mengisi nama_entitas", () => {
      const result = hutangContactSchema.safeParse({
        nama_entitas: "Budi Santoso",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nama_entitas).toBe("Budi Santoso");
      }
    });

    it("valid jika mengisi nama_entitas dan catatan", () => {
      const result = hutangContactSchema.safeParse({
        nama_entitas: "Toko Makmur",
        catatan: "Pembelian inventaris kantor",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.catatan).toBe("Pembelian inventaris kantor");
      }
    });

    it("gagal jika nama_entitas kosong", () => {
      const result = hutangContactSchema.safeParse({
        nama_entitas: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("hutangTransactionSchema (Detail Page Transactions)", () => {
    it("valid untuk transaksi pembayaran", () => {
      const result = hutangTransactionSchema.safeParse({
        hutang_id: "c8e1467e-61ad-467c-9b78-b1ad9df19641",
        jenis_transaksi: "pembayaran",
        nominal: 500000,
        tanggal: "2026-10-19",
        waktu: "10:30",
        catatan: "Cicilan 1",
      });
      expect(result.success).toBe(true);
    });

    it("valid untuk transaksi penambahan pinjaman", () => {
      const result = hutangTransactionSchema.safeParse({
        hutang_id: "c8e1467e-61ad-467c-9b78-b1ad9df19641",
        jenis_transaksi: "pinjaman",
        nominal: 1000000,
        tanggal: "2026-10-19",
      });
      expect(result.success).toBe(true);
    });

    it("gagal jika nominal <= 0", () => {
      const result = hutangTransactionSchema.safeParse({
        hutang_id: "c8e1467e-61ad-467c-9b78-b1ad9df19641",
        jenis_transaksi: "pembayaran",
        nominal: 0,
        tanggal: "2026-10-19",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("hutangToggleStatusSchema", () => {
    it("valid untuk toggle status lunas boolean", () => {
      const result = hutangToggleStatusSchema.safeParse({
        id: "c8e1467e-61ad-467c-9b78-b1ad9df19641",
        is_lunas: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
