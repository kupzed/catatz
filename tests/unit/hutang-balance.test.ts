import { describe, it, expect } from "vitest";
import {
  calculateSaldoAtDate,
  type LedgerData,
  type RekeningBalanceItem,
} from "@/lib/rekap-balance";

describe("hutang-balance & flexible repayment invariants", () => {
  const baseAccount: RekeningBalanceItem = {
    id: "rek-1",
    saldo_saat_ini: 2000000,
    exclude_total: false,
  };

  describe("Flexible Repayment Invariant (Pembayaran > Pinjaman)", () => {
    it("menghitung sisa tagihan 0 dan mencatat surplus jika pembayaran melebihi pinjaman pokok", () => {
      // Pinjaman Rp1.000.000, Pengembalian Rp1.200.000
      const totalPinjaman = 1000000;
      const totalPembayaran = 1200000;

      const sisaTagihan = Math.max(totalPinjaman - totalPembayaran, 0);
      const kelebihanBayar = Math.max(totalPembayaran - totalPinjaman, 0);

      expect(sisaTagihan).toBe(0);
      expect(kelebihanBayar).toBe(200000);
    });
  });

  describe("Invariant: Kartu yang berstatus / bertag Lunas tidak dihitung dalam ringkasan aktif", () => {
    it("tidak mengikutsertakan pihak bertag Lunas dalam total Piutang Aktif dan Hutang Aktif", () => {
      const items = [
        {
          id: "1",
          nama_entitas: "Budi",
          tipe: "memberi" as const,
          total_pinjaman: 1000000,
          sisa_tagihan: 300000,
          status: "lunas" as const, // di-tag Lunas oleh user
          is_lunas_manual: true,
        },
        {
          id: "2",
          nama_entitas: "Ani",
          tipe: "memberi" as const,
          total_pinjaman: 500000,
          sisa_tagihan: 200000, // masih aktif
          status: "aktif" as const,
          is_lunas_manual: false,
        },
      ];

      // Kalkulasi index: pihak bertag lunas tidak dihitung dalam total aktif
      const totalPiutangAktif = items
        .filter((h) => h.tipe === "memberi" && h.status !== "lunas" && !h.is_lunas_manual)
        .reduce((sum, item) => sum + Math.max(Number(item.sisa_tagihan), 0), 0);

      // Hanya Ani (200.000) yang terhitung, Budi tidak terhitung karena tag lunas
      expect(totalPiutangAktif).toBe(200000);
    });
  });

  describe("Ledger Delta untuk jenis_transaksi pinjaman vs pembayaran", () => {
    it("memperlakukan pinjaman piutang sebagai uang keluar dan pembayaran sebagai uang masuk", () => {
      // Saldo saat ini = 2.000.000
      // Kejadian T+1: Pembayaran piutang diterima 500.000 (delta: +500.000)
      // Kejadian T+2: Pinjaman tambahan diberikan 200.000 (delta: -200.000)
      // Net delta setelah T = +500.000 - 200.000 = +300.000
      // Saldo akhir pada T harus = 2.000.000 - 300.000 = 1.700.000
      const data: LedgerData = {
        rekening: [baseAccount],
        cicilan: [
          {
            id: "c-1",
            nominal: 500000,
            tanggal: "2026-10-25",
            tipe_hutang_snapshot: "memberi",
            jenis_transaksi: "pembayaran",
            rekening_id: "rek-1",
          },
          {
            id: "c-2",
            nominal: 200000,
            tanggal: "2026-10-26",
            tipe_hutang_snapshot: "memberi",
            jenis_transaksi: "pinjaman",
            rekening_id: "rek-1",
          },
        ],
      };

      const saldoAtT = calculateSaldoAtDate("2026-10-20", data);
      expect(saldoAtT).toBe(1700000);
    });
  });
});
