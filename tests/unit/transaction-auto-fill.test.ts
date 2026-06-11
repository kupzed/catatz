import { describe, expect, it } from "vitest";
import { resolveAutoFillTransaction } from "@/lib/transaction-auto-fill";
import type { Rekening } from "@/types/rekening";
import type { ParsedTransaction } from "@/types/transaction-parser";
import type { Kategori } from "@/types/transaksi";

const kategori: Kategori[] = [
  {
    id: "food",
    user_id: null,
    nama: "Makan & Minum",
    ikon: "utensils",
    warna: "blue",
    tipe: "expense",
    is_system: true,
    created_at: "2026-01-01",
  },
  {
    id: "salary",
    user_id: null,
    nama: "Gaji",
    ikon: "wallet",
    warna: "green",
    tipe: "income",
    is_system: true,
    created_at: "2026-01-01",
  },
];

const rekening: Rekening[] = [
  {
    id: "bca",
    user_id: "user-1",
    nama: "BCA Utama",
    jenis: "Bank",
    saldo_awal: 0,
    saldo_saat_ini: 0,
    warna: "blue",
    logo: "bca",
    exclude_total: false,
    urutan: 1,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "cash",
    user_id: "user-1",
    nama: "Tunai",
    jenis: "Tunai",
    saldo_awal: 0,
    saldo_saat_ini: 0,
    warna: "gray",
    logo: null,
    exclude_total: false,
    urutan: 2,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

function transaction(
  overrides: Partial<ParsedTransaction> = {},
): ParsedTransaction {
  return {
    tipe: "expense",
    nominal: 50_000,
    tanggal: "2026-06-11",
    waktu: "12:00",
    kategori_hint: "makan minum",
    rekening_hint: "BCA",
    rekening_tujuan_hint: "",
    judul: "Makan siang",
    catatan: "",
    entitas: "Warung",
    confidence: 0.9,
    needs_clarification: false,
    clarification_fields: [],
    flags: [],
    ...overrides,
  };
}

describe("resolveAutoFillTransaction", () => {
  it("resolves strong category and account aliases", () => {
    expect(resolveAutoFillTransaction(transaction(), kategori, rekening)).toEqual({
      tipe: "expense",
      judul: "Makan siang",
      catatan: "",
      kategoriId: "food",
      rekeningId: "bca",
      rekeningTujuanId: null,
      warnings: [],
    });
  });

  it("resolves source and destination accounts for transfers", () => {
    const result = resolveAutoFillTransaction(
      transaction({
        tipe: "transfer",
        kategori_hint: "",
        rekening_hint: "bca",
        rekening_tujuan_hint: "tunai",
        judul: "",
        entitas: "Dana darurat",
      }),
      kategori,
      rekening,
    );

    expect(result).toMatchObject({
      tipe: "transfer",
      kategoriId: null,
      rekeningId: "bca",
      rekeningTujuanId: "cash",
      catatan: "Transfer terkait Dana darurat",
    });
  });

  it("does not guess when aliases are ambiguous", () => {
    const duplicateAccounts = [
      ...rekening,
      { ...rekening[0], id: "bca-secondary", nama: "BCA Bisnis" },
    ];

    const result = resolveAutoFillTransaction(
      transaction({ rekening_hint: "BCA" }),
      kategori,
      duplicateAccounts,
    );

    expect(result.rekeningId).toBeNull();
    expect(result.warnings).toContain('Rekening "BCA" cocok dengan beberapa pilihan.');
  });

  it("requires review for ambiguous types and nominal values", () => {
    const result = resolveAutoFillTransaction(
      transaction({
        tipe: "hutang_baru",
        judul: "",
        entitas: "Andi",
        flags: ["tipe_ambigu", "nominal_ambigu"],
      }),
      kategori,
      rekening,
    );

    expect(result.tipe).toBeNull();
    expect(result.judul).toBe("Andi");
    expect(result.warnings).toEqual([
      "Jenis transaksi belum cukup jelas.",
      "Nominal transaksi perlu diperiksa.",
    ]);
  });

  it("reports unmatched hints without mutating inputs", () => {
    const input = transaction({
      kategori_hint: "Tidak Ada",
      rekening_hint: "Tidak Ada",
    });
    const snapshot = structuredClone(input);

    const result = resolveAutoFillTransaction(input, kategori, rekening);

    expect(result.warnings).toEqual([
      'Kategori "Tidak Ada" belum dapat dicocokkan.',
      'Rekening "Tidak Ada" belum dapat dicocokkan.',
    ]);
    expect(input).toEqual(snapshot);
  });
});
