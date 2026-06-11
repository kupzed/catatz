import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cn,
  currentTime,
  formatNumber,
  formatRupiah,
  formatTanggal,
  formatWaktu,
  fromTwelveHourTimeParts,
  getRupiahSpreadsheetFormat,
  normalizeTimeValue,
  parseNominal,
  percentage,
  todayISODate,
  toTwelveHourTimeParts,
} from "@/lib/utils";

describe("financial and date utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 11, 14, 7, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges Tailwind class names deterministically", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });

  it("formats rupiah and numbers using user preferences", () => {
    expect(formatRupiah(1_250_000)).toContain("1.250.000");
    expect(formatRupiah(1_250_000, true)).toBe("Rp 1,3 Jt");
    expect(
      formatRupiah(1_250_000, true, {
        number_format: "en-US",
        show_decimal_places: false,
      }),
    ).toBe("Rp 1.3 Jt");
    expect(
      formatNumber(1234.5, {
        number_format: "en-US",
        show_decimal_places: true,
      }),
    ).toBe("1,234.50");
  });

  it("builds spreadsheet formats and parses Indonesian nominal strings", () => {
    expect(getRupiahSpreadsheetFormat()).toBe(
      '"Rp"#.##0;[Red]-"Rp"#.##0',
    );
    expect(
      getRupiahSpreadsheetFormat({
        number_format: "en-US",
        show_decimal_places: true,
      }),
    ).toBe('"Rp"#,##0.00;[Red]-"Rp"#,##0.00');
    expect(parseNominal("1.500.000,50")).toBe(1_500_000.5);
    expect(parseNominal("invalid")).toBe(0);
  });

  it("formats dates and preserves invalid input", () => {
    expect(formatTanggal("2026-06-11")).toBe("11 Juni 2026");
    expect(
      formatTanggal("2026-06-11", "d MMMM yyyy", {
        date_format: "en-US",
      }),
    ).toBe("June 11, 2026");
    expect(formatTanggal("not-a-date")).toBe("not-a-date");
  });

  it("normalizes and converts 12-hour and 24-hour time values", () => {
    expect(normalizeTimeValue("7:05:00")).toBe("07:05");
    expect(normalizeTimeValue("24:00")).toBe("");
    expect(normalizeTimeValue(null)).toBe("");
    expect(formatWaktu("13:05", { time_format: "12h" })).toBe("01:05 PM");
    expect(formatWaktu("09:15")).toBe("09:15");
    expect(toTwelveHourTimeParts("00:30")).toEqual({
      hour: "12",
      minute: "30",
      period: "AM",
    });
    expect(fromTwelveHourTimeParts("12", "15", "AM")).toBe("00:15");
    expect(fromTwelveHourTimeParts("3", "45", "PM")).toBe("15:45");
    expect(fromTwelveHourTimeParts("99", "00", "PM")).toBe("12:00");
  });

  it("uses local time for current date and time helpers", () => {
    expect(todayISODate()).toBe("2026-06-11");
    expect(currentTime()).toBe("14:07");
  });

  it("calculates bounded percentages", () => {
    expect(percentage(25, 100)).toBe(25);
    expect(percentage(125, 100)).toBe(100);
    expect(percentage(10, 0)).toBe(0);
  });
});
