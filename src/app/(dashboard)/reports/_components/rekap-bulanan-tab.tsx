"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import {
  getRekapRingkasanPeriodeList,
  getEarliestTransactionDate,
} from "@/actions/rekap-action";
import { getSaldoPeriodeList } from "@/actions/rekap-saldo-action";
import { EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCycleContaining,
  getTodayInJakarta,
  listCycles,
  type RekapCycleRange,
} from "@/lib/rekap-period";
import type { RekapSettings } from "@/types/rekap";
import { useTranslation } from "@/i18n/use-translation";
import { RekapPeriodCard, type RekapPeriodCardData } from "./rekap-period-card";

export type RekapBulananTabProps = {
  settings: RekapSettings;
};

export function RekapBulananTab({ settings }: RekapBulananTabProps) {
  const { dict, locale } = useTranslation();
  const [items, setItems] = useState<RekapPeriodCardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const rekapLocale = locale === "en" ? "en-US" : "id-ID";
  const today = useMemo(() => getTodayInJakarta(), []);
  const currentCycle = useMemo(
    () => getCycleContaining(settings.cutoff_day, today, rekapLocale),
    [rekapLocale, settings.cutoff_day, today],
  );

  // Helper untuk memuat ringkasan finansial dan saldo untuk sekumpulan siklus
  const fetchCycleData = useCallback(
    async (cycles: RekapCycleRange[]): Promise<RekapPeriodCardData[]> => {
      if (cycles.length === 0) return [];

      const [ringkasanList, saldoResult] = await Promise.all([
        getRekapRingkasanPeriodeList(cycles),
        settings.akumulasi_saldo
          ? getSaldoPeriodeList(cycles)
          : Promise.resolve({ success: true, data: [] }),
      ]);

      const ringkasanMap = new Map(
        ringkasanList.map((r) => [`${r.startDate}_${r.endDate}`, r]),
      );

      const saldoMap = new Map(
        (saldoResult.success && saldoResult.data ? saldoResult.data : []).map(
          (s) => [`${s.startDate}_${s.endDate}`, s],
        ),
      );

      return cycles.map((cycle) => {
        const key = `${cycle.startDate}_${cycle.endDate}`;
        const ringkasan = ringkasanMap.get(key);
        const saldo = saldoMap.get(key);

        const isCurrent =
          cycle.startDate === currentCycle.startDate &&
          cycle.endDate === currentCycle.endDate;

        return {
          startDate: cycle.startDate,
          endDate: cycle.endDate,
          label: cycle.label,
          isCurrent,
          total_expense: ringkasan?.total_expense ?? 0,
          total_income: ringkasan?.total_income ?? 0,
          net: ringkasan?.net ?? 0,
          net_arus_kas_hutang_piutang:
            ringkasan?.net_arus_kas_hutang_piutang ?? 0,
          koreksi: ringkasan?.koreksi,
          saldo_awal: saldo?.saldo_awal,
          saldo_akhir: saldo?.saldo_akhir,
        };
      });
    },
    [currentCycle.endDate, currentCycle.startDate, settings.akumulasi_saldo],
  );

  // Track previous settings for loading indicator reset when props change
  const [prevSettings, setPrevSettings] = useState(settings);
  if (
    prevSettings.cutoff_day !== settings.cutoff_day ||
    prevSettings.akumulasi_saldo !== settings.akumulasi_saldo
  ) {
    setPrevSettings(settings);
    setIsLoading(true);
  }

  // Muat siklus hanya dari bulan transaksi terawal s/d bulan sekarang (siklus berjalan)
  useEffect(() => {
    let ignore = false;

    async function loadMonthlyCycles() {
      try {
        const earliestRes = await getEarliestTransactionDate();
        const earliestDate =
          earliestRes.success && earliestRes.data ? earliestRes.data : undefined;

        // Ambil siklus mundur dari siklus berjalan s/d siklus yang memuat transaksi terawal
        const cycles = listCycles({
          cutoffDay: settings.cutoff_day,
          referenceDate: today,
          count: 240, // Batas aman 20 tahun
          earliestDate: earliestDate ?? currentCycle.startDate,
          locale: rekapLocale,
        });

        const data = await fetchCycleData(cycles);
        if (!ignore) {
          setItems(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Gagal memuat rekap bulanan:", err);
          toast.error(dict.reports.toasts.loadMonthlyFailed);
          setItems([]);
          setIsLoading(false);
        }
      }
    }

    loadMonthlyCycles();

    return () => {
      ignore = true;
    };
  }, [
    currentCycle.startDate,
    dict.reports.toasts.loadMonthlyFailed,
    fetchCycleData,
    rekapLocale,
    settings.cutoff_day,
    today,
  ]);

  // Skeleton saat memuat awal
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-card border border-hairline bg-card p-5 sm:p-6 h-full flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="size-4 rounded-full" />
              </div>
              <div className="mt-3 space-y-2.5">
                {Array.from({ length: settings.akumulasi_saldo ? 6 : 4 }).map(
                  (_, j) => (
                    <div key={j} className="flex justify-between py-1">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  ),
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Tampilan bila tidak ada data sama sekali
  if (items.length === 0) {
    return (
      <Card className="rounded-card border border-hairline bg-card">
        <div className="p-8">
          <EmptyState
            icon={CalendarDays}
            title={dict.reports.emptyState.monthlyTitle}
            description={dict.reports.emptyState.monthlyDesc}
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid Kartu Siklus Bulanan dengan Perataan Tinggi Sama (items-stretch) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {items.map((item) => (
          <RekapPeriodCard
            key={`${item.startDate}_${item.endDate}`}
            period={item}
            akumulasiAktif={settings.akumulasi_saldo}
            jenis="bulanan"
          />
        ))}
      </div>
    </div>
  );
}
