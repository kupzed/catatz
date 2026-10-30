import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BULAN_NAMES, BULAN_NAMES_EN, getMonthNames } from "@/constants/rekap";
import { DictionaryProvider } from "@/i18n/client-provider";
import id from "@/i18n/dictionaries/id";
import en from "@/i18n/dictionaries/en";
import {
  RekapPeriodCard,
  type RekapPeriodCardData,
} from "@/app/(dashboard)/reports/_components/rekap-period-card";
import { ProporsiSaldoChart } from "@/app/(dashboard)/reports/detail/_components/proporsi-saldo-chart";

const mockPeriod: RekapPeriodCardData = {
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  label: "01 May - 31 May 2026",
  isCurrent: true,
  total_expense: 4000000,
  total_income: 10000000,
  net: 6000000,
  net_arus_kas_hutang_piutang: 1500000,
  saldo_awal: 5000000,
  saldo_akhir: 11000000,
};

describe("rekap-i18n", () => {
  afterEach(() => {
    cleanup();
  });

  describe("getMonthNames", () => {
    it("returns default Indonesian month names when no argument is given", () => {
      const months = getMonthNames();
      expect(months).toEqual(BULAN_NAMES);
      expect(months[4]).toBe("Mei");
      expect(months[7]).toBe("Agu");
      expect(months[9]).toBe("Okt");
      expect(months[11]).toBe("Des");
    });

    it("returns English month names when 'en' or 'en-US' locale string is passed", () => {
      const monthsEn = getMonthNames("en");
      expect(monthsEn).toEqual(BULAN_NAMES_EN);
      expect(monthsEn[4]).toBe("May");
      expect(monthsEn[7]).toBe("Aug");
      expect(monthsEn[9]).toBe("Oct");
      expect(monthsEn[11]).toBe("Dec");

      const monthsEnUS = getMonthNames("en-US");
      expect(monthsEnUS).toEqual(BULAN_NAMES_EN);
    });

    it("returns Indonesian month names when 'id' or 'id-ID' locale string is passed", () => {
      const monthsId = getMonthNames("id");
      expect(monthsId).toEqual(BULAN_NAMES);
      const monthsIdID = getMonthNames("id-ID");
      expect(monthsIdID).toEqual(BULAN_NAMES);
    });

    it("returns localized month names when dictionary is passed", () => {
      const monthsFromIdDict = getMonthNames(id);
      expect(monthsFromIdDict).toEqual(BULAN_NAMES);
      expect(monthsFromIdDict[4]).toBe("Mei");

      const monthsFromEnDict = getMonthNames(en);
      expect(monthsFromEnDict).toEqual(BULAN_NAMES_EN);
      expect(monthsFromEnDict[4]).toBe("May");
    });
  });

  describe("reports dictionary keys", () => {
    it("has identical structure and non-empty strings in both id and en dictionaries", () => {
      expect(id.reports.title).toBe("Rekap Keuangan");
      expect(en.reports.title).toBe("Financial Reports");

      expect(id.reports.tabs.monthly).toBe("Bulanan");
      expect(en.reports.tabs.monthly).toBe("Monthly");

      expect(id.reports.tabs.realtime).toBe("Realtime");
      expect(en.reports.tabs.realtime).toBe("Realtime");

      expect(id.reports.tabs.custom).toBe("Custom");
      expect(en.reports.tabs.custom).toBe("Custom");

      expect(id.reports.card.active).toBe("Berjalan");
      expect(en.reports.card.active).toBe("Active");

      expect(id.reports.detail.deficitBadge).toBe("Defisit");
      expect(en.reports.detail.deficitBadge).toBe("Deficit");

      expect(id.reports.customDialog.newPeriodButton).toBe("Periode Baru");
      expect(en.reports.customDialog.newPeriodButton).toBe("New Period");
    });
  });

  describe("UI rendering in English locale", () => {
    it("renders RekapPeriodCard in English when wrapped in DictionaryProvider en", () => {
      render(
        <DictionaryProvider locale="en" dict={en}>
          <RekapPeriodCard period={mockPeriod} akumulasiAktif={true} />
        </DictionaryProvider>,
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Starting Balance")).toBeInTheDocument();
      expect(screen.getByText("Expense")).toBeInTheDocument();
      expect(screen.getByText("Income")).toBeInTheDocument();
      expect(screen.getByText("Net")).toBeInTheDocument();
      expect(screen.getByText("Debts & Receivables")).toBeInTheDocument();
      expect(screen.getByText("Ending Balance")).toBeInTheDocument();
    });

    it("renders ProporsiSaldoChart in English when wrapped in DictionaryProvider en", () => {
      render(
        <DictionaryProvider locale="en" dict={en}>
          <ProporsiSaldoChart
            totalExpense={6000000}
            totalIncome={4000000}
            saldoAwal={0}
            akumulasiAktif={false}
          />
        </DictionaryProvider>,
      );

      expect(
        screen.getByText("Expense vs Remaining Balance Proportion"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Deficit").length).toBeGreaterThan(0);
      expect(
        screen.getByText(/Expenses in this period exceed total incoming funds/),
      ).toBeInTheDocument();
    });
  });
});

