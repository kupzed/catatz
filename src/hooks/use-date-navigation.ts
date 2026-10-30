"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { TransaksiFilter } from "@/types/transaksi";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

export type CustomDateStep = "dari" | "sampai";
export type DateNavigationFilter = Pick<TransaksiFilter, "dari" | "sampai">;

export type UseDateNavigationReturn = {
  preset: string;
  setPreset: Dispatch<SetStateAction<string>>;
  baseDate: Date;
  setBaseDate: Dispatch<SetStateAction<Date>>;
  customStep: CustomDateStep;
  setCustomStep: Dispatch<SetStateAction<CustomDateStep>>;
  dateFilter: DateNavigationFilter;
  setDateFilter: Dispatch<SetStateAction<DateNavigationFilter>>;
  handlePrevDate: () => void;
  handleNextDate: () => void;
  handleDateLabelPick: (dateStr: string) => void;
  dateLabel: string;
  canNavigateDate: boolean;
};

/** Mengelola preset, label, dan perpindahan tanggal untuk halaman transaksi. */
export function useDateNavigation(initialPreset: string = "hari"): UseDateNavigationReturn {
  const { preferences } = useSystemPreferences();
  const { dict, locale: activeLocale } = useTranslation();
  const [preset, setPreset] = useState<string>(initialPreset);
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState<DateNavigationFilter>({});
  // Untuk custom range: track apakah sedang pilih 'dari' atau 'sampai'
  const [customStep, setCustomStep] = useState<CustomDateStep>("dari");

  function handlePrevDate() {
    if (preset === "hari") setBaseDate(subDays(baseDate, 1));
    else if (preset === "minggu") setBaseDate(subWeeks(baseDate, 1));
    else if (preset === "bulan") setBaseDate(subMonths(baseDate, 1));
    else if (preset === "tahun") setBaseDate(subYears(baseDate, 1));
  }

  function handleNextDate() {
    if (preset === "hari") setBaseDate(addDays(baseDate, 1));
    else if (preset === "minggu") setBaseDate(addWeeks(baseDate, 1));
    else if (preset === "bulan") setBaseDate(addMonths(baseDate, 1));
    else if (preset === "tahun") setBaseDate(addYears(baseDate, 1));
  }

  /** Handler saat user memilih tanggal dari DatePicker di dateLabel */
  function handleDateLabelPick(dateStr: string) {
    const picked = parseISO(dateStr);
    if (preset === "custom") {
      // Langkah 1: pilih 'dari', langkah 2: pilih 'sampai'
      if (customStep === "dari") {
        setDateFilter((f) => ({ ...f, dari: dateStr, sampai: undefined }));
        setCustomStep("sampai");
        // Jangan tutup popover, tunggu pilih sampai
        return;
      } else {
        // Pastikan sampai >= dari
        const dari = dateFilter.dari ? parseISO(dateFilter.dari) : null;
        if (dari && picked < dari) {
          // Jika pilih tanggal lebih awal dari 'dari', swap
          setDateFilter((f) => ({ ...f, sampai: f.dari, dari: dateStr }));
        } else {
          setDateFilter((f) => ({ ...f, sampai: dateStr }));
        }
        setCustomStep("dari"); // reset untuk pilihan berikutnya
      }
    } else {
      setBaseDate(picked);
    }
  }

  const dateLabel = useMemo(() => {
    const locale =
      preferences.date_format === "en-US" || activeLocale === "en"
        ? enUS
        : idLocale;

    if (preset === "all")
      return dict?.transactions?.filter?.periodAllTime ?? (activeLocale === "en" ? "All Time" : "Semua Waktu");
    if (preset === "hari")
      return format(baseDate, "EEEE, dd MMM yyyy", { locale });
    if (preset === "minggu") {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      return `${format(start, "dd MMM", { locale })} - ${format(end, "dd MMM yyyy", { locale })}`;
    }
    if (preset === "bulan")
      return format(baseDate, "MMMM yyyy", { locale });
    if (preset === "tahun")
      return format(baseDate, "yyyy", { locale });
    if (preset === "custom") {
      if (dateFilter.dari && dateFilter.sampai) {
        const dDari = parseISO(dateFilter.dari);
        const dSampai = parseISO(dateFilter.sampai);
        if (dDari.getFullYear() === dSampai.getFullYear()) {
          return `${format(dDari, "dd MMM", { locale })} - ${format(dSampai, "dd MMM yyyy", { locale })}`;
        }
        return `${format(dDari, "dd MMM yyyy", { locale })} - ${format(dSampai, "dd MMM yyyy", { locale })}`;
      } else if (dateFilter.dari) {
        if (customStep === "sampai")
          return `${format(parseISO(dateFilter.dari), "dd MMM", { locale })} \u2192 ${activeLocale === "en" ? "Select end" : "Pilih akhir"}`;
        return `${activeLocale === "en" ? "From " : "Mulai "}${format(parseISO(dateFilter.dari), "dd MMM yyyy", { locale })}`;
      }
      return activeLocale === "en" ? "Select Range" : "Pilih Rentang";
    }
    return activeLocale === "en" ? "Time Range" : "Rentang Waktu";
  }, [
    baseDate,
    preset,
    dateFilter.dari,
    dateFilter.sampai,
    customStep,
    preferences.date_format,
    activeLocale,
    dict,
  ]);

  const canNavigateDate = preset !== "all" && preset !== "custom";

  return {
    preset,
    setPreset,
    baseDate,
    setBaseDate,
    customStep,
    setCustomStep,
    dateFilter,
    setDateFilter,
    handlePrevDate,
    handleNextDate,
    handleDateLabelPick,
    dateLabel,
    canNavigateDate,
  };
}
