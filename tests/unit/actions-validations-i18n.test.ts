import { describe, it, expect } from "vitest";
import idDict from "@/i18n/dictionaries/id";
import enDict from "@/i18n/dictionaries/en";
import { getTransaksiSchema } from "@/validations/transaksi-validation";
import {
  getRekeningCreateSchema,
  getRekeningEditSchema,
} from "@/validations/rekening-validation";
import { getKategoriSchema } from "@/validations/kategori-validation";
import {
  getHutangContactSchema,
  getHutangTransactionSchema,
} from "@/validations/hutang-validation";
import {
  getRekapSettingsSchema,
  getDateStringSchema,
  getCustomPeriodSchema,
} from "@/validations/rekap-validation";
import { validateUserPreferenceUpdate } from "@/lib/user-preferences";

describe("Fase 19: Actions and Validation Schemas Localization", () => {
  describe("getTransaksiSchema localization", () => {
    it("returns Indonesian validation error messages with idDict", () => {
      const schema = getTransaksiSchema(idDict);
      const res = schema.safeParse({
        tipe: "expense",
        nominal: 0,
        tanggal: "",
        rekening_id: "not-a-uuid",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        const issues = res.error.issues;
        expect(issues.some((i) => i.message === "Nominal harus lebih dari 0")).toBe(true);
        expect(issues.some((i) => i.message === "Tanggal wajib diisi")).toBe(true);
        expect(issues.some((i) => i.message === "Pilih rekening terlebih dahulu")).toBe(true);
      }
    });

    it("returns English validation error messages with enDict", () => {
      const schema = getTransaksiSchema(enDict);
      const res = schema.safeParse({
        tipe: "expense",
        nominal: 0,
        tanggal: "",
        rekening_id: "not-a-uuid",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        const issues = res.error.issues;
        expect(issues.some((i) => i.message === "Amount must be greater than 0")).toBe(true);
        expect(issues.some((i) => i.message === "Date is required")).toBe(true);
        expect(issues.some((i) => i.message === "Please select a wallet")).toBe(true);
      }
    });

    it("localizes transfer refine errors in both languages", () => {
      const schemaId = getTransaksiSchema(idDict);
      const resId = schemaId.safeParse({
        tipe: "transfer",
        nominal: 10000,
        tanggal: "2026-10-29",
        rekening_id: "7b09bfca-df90-482d-8628-d7baadccaa55",
        rekening_tujuan: "7b09bfca-df90-482d-8628-d7baadccaa55",
      });
      expect(resId.success).toBe(false);
      if (!resId.success) {
        expect(resId.error.issues[0]?.message).toBe(
          "Rekening asal dan tujuan tidak boleh sama",
        );
      }

      const schemaEn = getTransaksiSchema(enDict);
      const resEn = schemaEn.safeParse({
        tipe: "transfer",
        nominal: 10000,
        tanggal: "2026-10-29",
        rekening_id: "7b09bfca-df90-482d-8628-d7baadccaa55",
        rekening_tujuan: "7b09bfca-df90-482d-8628-d7baadccaa55",
      });
      expect(resEn.success).toBe(false);
      if (!resEn.success) {
        expect(resEn.error.issues[0]?.message).toBe(
          "Source and destination wallets cannot be the same",
        );
      }
    });
  });

  describe("getRekening schemas localization", () => {
    it("localizes wallet create schema errors", () => {
      const schemaId = getRekeningCreateSchema(idDict);
      const resId = schemaId.safeParse({
        nama: "",
        jenis: "Bank",
        saldo_awal: 0,
        warna: "invalid",
        exclude_total: false,
      });
      expect(resId.success).toBe(false);
      if (!resId.success) {
        expect(resId.error.issues.some((i) => i.message === "Nama rekening wajib diisi")).toBe(true);
        expect(resId.error.issues.some((i) => i.message === "Format warna tidak valid")).toBe(true);
      }

      const schemaEn = getRekeningCreateSchema(enDict);
      const resEn = schemaEn.safeParse({
        nama: "",
        jenis: "Bank",
        saldo_awal: 0,
        warna: "invalid",
        exclude_total: false,
      });
      expect(resEn.success).toBe(false);
      if (!resEn.success) {
        expect(resEn.error.issues.some((i) => i.message === "Wallet name is required")).toBe(true);
        expect(resEn.error.issues.some((i) => i.message === "Invalid color format")).toBe(true);
      }
    });

    it("localizes wallet edit schema errors", () => {
      const schemaEn = getRekeningEditSchema(enDict);
      const resEn = schemaEn.safeParse({
        nama: "",
        jenis: "Bank",
        saldo_saat_ini: 0,
        warna: "#ffffff",
        exclude_total: false,
      });
      expect(resEn.success).toBe(false);
      if (!resEn.success) {
        expect(resEn.error.issues[0]?.message).toBe("Wallet name is required");
      }
    });
  });

  describe("getKategoriSchema localization", () => {
    it("localizes category schema errors", () => {
      const schemaId = getKategoriSchema(idDict);
      const resId = schemaId.safeParse({
        nama: "",
        ikon: "",
        warna: "not-color",
        tipe: "expense",
      });
      expect(resId.success).toBe(false);
      if (!resId.success) {
        expect(resId.error.issues.some((i) => i.message === "Nama wajib diisi")).toBe(true);
        expect(resId.error.issues.some((i) => i.message === "Ikon wajib diisi")).toBe(true);
      }

      const schemaEn = getKategoriSchema(enDict);
      const resEn = schemaEn.safeParse({
        nama: "",
        ikon: "",
        warna: "not-color",
        tipe: "expense",
      });
      expect(resEn.success).toBe(false);
      if (!resEn.success) {
        expect(resEn.error.issues.some((i) => i.message === "Name is required")).toBe(true);
        expect(resEn.error.issues.some((i) => i.message === "Icon is required")).toBe(true);
      }
    });
  });

  describe("getHutang schemas localization", () => {
    it("localizes hutang contact schema errors", () => {
      const schemaId = getHutangContactSchema(idDict);
      const resId = schemaId.safeParse({ nama_entitas: "" });
      expect(resId.success).toBe(false);
      if (!resId.success) {
        expect(resId.error.issues[0]?.message).toBe("Nama wajib diisi");
      }

      const schemaEn = getHutangContactSchema(enDict);
      const resEn = schemaEn.safeParse({ nama_entitas: "" });
      expect(resEn.success).toBe(false);
      if (!resEn.success) {
        expect(resEn.error.issues[0]?.message).toBe("Name is required");
      }
    });

    it("localizes hutang transaction schema errors", () => {
      const schemaEn = getHutangTransactionSchema(enDict);
      const resEn = schemaEn.safeParse({
        hutang_id: "c8e1467e-61ad-467c-9b78-b1ad9df19641",
        jenis_transaksi: "pembayaran",
        nominal: -50,
        tanggal: "",
      });
      expect(resEn.success).toBe(false);
      if (!resEn.success) {
        expect(resEn.error.issues.some((i) => i.message === "Amount must be greater than 0")).toBe(true);
        expect(resEn.error.issues.some((i) => i.message === "Date is required")).toBe(true);
      }
    });
  });

  describe("getRekap schemas localization", () => {
    it("localizes cutoff_day bounds in both languages", () => {
      const schemaId = getRekapSettingsSchema(idDict);
      const resIdMin = schemaId.safeParse({ cutoff_day: 0, akumulasi_saldo: false });
      expect(resIdMin.success).toBe(false);
      if (!resIdMin.success) {
        expect(resIdMin.error.issues[0]?.message).toBe("Cut-off hari minimal 1");
      }

      const schemaEn = getRekapSettingsSchema(enDict);
      const resEnMin = schemaEn.safeParse({ cutoff_day: 0, akumulasi_saldo: false });
      expect(resEnMin.success).toBe(false);
      if (!resEnMin.success) {
        expect(resEnMin.error.issues[0]?.message).toBe("Cut-off day must be at least 1");
      }

      const resEnMax = schemaEn.safeParse({ cutoff_day: 35, akumulasi_saldo: false });
      expect(resEnMax.success).toBe(false);
      if (!resEnMax.success) {
        expect(resEnMax.error.issues[0]?.message).toBe("Cut-off day must be at most 31");
      }
    });

    it("localizes date and custom period schema errors", () => {
      const dateSchemaEn = getDateStringSchema(enDict);
      const resDate = dateSchemaEn.safeParse("not-a-date");
      expect(resDate.success).toBe(false);
      if (!resDate.success) {
        expect(resDate.error.issues[0]?.message).toBe("Date format must be YYYY-MM-DD");
      }

      const customSchemaEn = getCustomPeriodSchema(enDict);
      const resCustom = customSchemaEn.safeParse({
        nama: "",
        tanggal_mulai: "2026-10-20",
        tanggal_selesai: "2026-10-10",
      });
      expect(resCustom.success).toBe(false);
      if (!resCustom.success) {
        expect(resCustom.error.issues.some((i) => i.message === "Period name is required")).toBe(true);
        expect(resCustom.error.issues.some((i) => i.message === "End date cannot be earlier than start date")).toBe(true);
      }
    });
  });

  describe("validateUserPreferenceUpdate localization", () => {
    it("returns localized error messages based on provided dictionary", () => {
      const resId = validateUserPreferenceUpdate({ cutoff_day: 40 }, idDict);
      expect(resId.success).toBe(false);
      if (!resId.success) {
        expect(resId.error).toBe("Tanggal cut-off siklus harus antara 1 dan 31");
      }

      const resEn = validateUserPreferenceUpdate({ cutoff_day: 40 }, enDict);
      expect(resEn.success).toBe(false);
      if (!resEn.success) {
        expect(resEn.error).toBe("Cut-off day must be between 1 and 31");
      }
    });
  });

  describe("Action messages dictionary completeness", () => {
    it("contains all action error and message strings for both ID and EN", () => {
      expect(idDict.actions.auth.accountCreatedCheckEmail).toBe(
        "Akun berhasil dibuat! Silakan cek email untuk verifikasi.",
      );
      expect(enDict.actions.auth.accountCreatedCheckEmail).toBe(
        "Account successfully created! Please check your email for verification.",
      );

      expect(idDict.actions.profile.fileFormatNotSupported).toBe(
        "Format file tidak didukung. Gunakan JPG, PNG, atau WebP.",
      );
      expect(enDict.actions.profile.fileFormatNotSupported).toBe(
        "Unsupported file format. Please use JPG, PNG, or WebP.",
      );

      expect(idDict.actions.session.sessionTerminated).toBe("Sesi berhasil diakhiri");
      expect(enDict.actions.session.sessionTerminated).toBe("Session successfully terminated");

      expect(idDict.actions.voice.loginRequired).toBe(
        "Silakan login terlebih dahulu untuk menggunakan fitur suara.",
      );
      expect(enDict.actions.voice.loginRequired).toBe(
        "Please sign in first to use voice features.",
      );

      expect(idDict.actions.export.allTime).toBe("Semua Waktu");
      expect(enDict.actions.export.allTime).toBe("All Time");
    });
  });
});

