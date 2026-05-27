"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { Transaksi, TransaksiFilter } from "@/types/transaksi";
import type { DateNavigationFilter } from "@/hooks/use-date-navigation";

export type UseTransaksiFilterParams<T extends Transaksi = Transaksi> = {
  transaksi: T[];
  preset: string;
  baseDate: Date;
  dateFilter: DateNavigationFilter;
};

export type UseTransaksiFilterReturn<T extends Transaksi = Transaksi> = {
  filter: TransaksiFilter;
  search: string;
  setFilter: Dispatch<SetStateAction<TransaksiFilter>>;
  setSearch: Dispatch<SetStateAction<string>>;
  filtered: T[];
};

/** Mengelola filter, pencarian, dan hasil transaksi sesuai rentang tanggal aktif. */
export function useTransaksiFilter<T extends Transaksi = Transaksi>({
  transaksi,
  preset,
  baseDate,
  dateFilter,
}: UseTransaksiFilterParams<T>): UseTransaksiFilterReturn<T> {
  const [filter, setFilter] = useState<TransaksiFilter>({
    tipe: "all",
    sortBy: "tanggal",
    sortOrder: "desc",
  });
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const result = transaksi.filter((t) => {
      if (filter.tipe && filter.tipe !== "all" && t.tipe !== filter.tipe)
        return false;
      if (filter.rekening_id && t.rekening_id !== filter.rekening_id)
        return false;
      if (filter.kategori_id && t.kategori_id !== filter.kategori_id)
        return false;
      if (
        search &&
        !t.catatan?.toLowerCase().includes(search.toLowerCase()) &&
        !t.judul?.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      const tDate = parseISO(t.tanggal);
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (preset === "hari") {
        startDate = startOfDay(baseDate);
        endDate = endOfDay(baseDate);
      } else if (preset === "minggu") {
        startDate = startOfWeek(baseDate, { weekStartsOn: 1 });
        endDate = endOfWeek(baseDate, { weekStartsOn: 1 });
      } else if (preset === "bulan") {
        startDate = startOfMonth(baseDate);
        endDate = endOfMonth(baseDate);
      } else if (preset === "tahun") {
        startDate = startOfYear(baseDate);
        endDate = endOfYear(baseDate);
      } else if (preset === "custom" && dateFilter.dari && dateFilter.sampai) {
        startDate = startOfDay(parseISO(dateFilter.dari));
        endDate = endOfDay(parseISO(dateFilter.sampai));
      }

      if (startDate && isBefore(tDate, startDate)) return false;
      if (endDate && isAfter(tDate, endDate)) return false;

      return true;
    });

    result.sort((a, b) => {
      let valA, valB;
      if (filter.sortBy === "nominal") {
        valA = Number(a.nominal);
        valB = Number(b.nominal);
      } else if (filter.sortBy === "created_at") {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else {
        valA = new Date(`${a.tanggal}T${a.waktu || "00:00:00"}`).getTime();
        valB = new Date(`${b.tanggal}T${b.waktu || "00:00:00"}`).getTime();
      }

      if (valA < valB) return filter.sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return filter.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    transaksi,
    filter,
    search,
    preset,
    baseDate,
    dateFilter.dari,
    dateFilter.sampai,
  ]);

  return {
    filter,
    search,
    setFilter,
    setSearch,
    filtered,
  };
}
