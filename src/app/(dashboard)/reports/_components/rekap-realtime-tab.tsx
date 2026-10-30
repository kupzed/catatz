"use client";

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Receipt, RefreshCw, Tags, Type } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common";
import { getRekapDetailByRange, type RekapBreakdownItem } from "@/actions/rekap-action";
import { getSaldoPeriodeList } from "@/actions/rekap-saldo-action";
import { getCycleContaining, getTodayInJakarta } from "@/lib/rekap-period";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";
import type { RekapSettings } from "@/types/rekap";

// Lazy-load komponen Donut Recharts untuk optimasi bundle size
const RekapDonutChart = lazy(() =>
  import("./rekap-charts").then((module) => ({
    default: module.RekapDonutChart,
  })),
);

const PALETTE = [
  "#0052ff",
  "#05b169",
  "#f4b000",
  "#cf202f",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export type RekapRealtimeTabProps = {
  settings: RekapSettings;
};

export type RealtimeBreakdownMode = "kategori" | "judul";

export function RekapRealtimeTab({ settings }: RekapRealtimeTabProps) {
  const { formatRupiah } = useSystemPreferences();
  const { dict, locale } = useTranslation();

  // Tentukan siklus berjalan berdasarkan cut-off setting dan waktu terkini di Asia/Jakarta (D6)
  const rekapLocale = locale === "en" ? "en-US" : "id-ID";
  const today = useMemo(() => getTodayInJakarta(), []);
  const cycle = useMemo(
    () => getCycleContaining(settings.cutoff_day, today, rekapLocale),
    [rekapLocale, settings.cutoff_day, today],
  );

  const [mode, setMode] = useState<RealtimeBreakdownMode>("kategori");
  const [kategoriData, setKategoriData] = useState<RekapBreakdownItem[]>([]);
  const [judulData, setJudulData] = useState<RekapBreakdownItem[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [saldoAwal, setSaldoAwal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);

  // Ambil detail rekap berdasarkan rentang siklus berjalan (kategori & judul) beserta saldo
  const loadData = useCallback(async () => {
    try {
      const [detail, saldoRes] = await Promise.all([
        getRekapDetailByRange(cycle.startDate, cycle.endDate),
        settings.akumulasi_saldo
          ? getSaldoPeriodeList([cycle])
          : Promise.resolve({ success: true, data: [] }),
      ]);

      setKategoriData(detail.kategori.expense);
      setJudulData(detail.judul.expense);
      setTotalExpense(detail.total_expense);
      setTotalIncome(detail.total_income);

      if (saldoRes.success && saldoRes.data && saldoRes.data.length > 0) {
        setSaldoAwal(saldoRes.data[0].saldo_awal ?? 0);
      } else {
        setSaldoAwal(0);
      }
    } catch {
      toast.error(dict.reports.toasts.loadRealtimeFailed);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [cycle, dict.reports.toasts.loadRealtimeFailed, settings.akumulasi_saldo]);

  // Initial fetch pada mount atau saat siklus berubah
  useEffect(() => {
    let ignore = false;
    Promise.all([
      getRekapDetailByRange(cycle.startDate, cycle.endDate),
      settings.akumulasi_saldo
        ? getSaldoPeriodeList([cycle])
        : Promise.resolve({ success: true, data: [] }),
    ])
      .then(([detail, saldoRes]) => {
        if (!ignore) {
          setKategoriData(detail.kategori.expense);
          setJudulData(detail.judul.expense);
          setTotalExpense(detail.total_expense);
          setTotalIncome(detail.total_income);
          if (saldoRes.success && saldoRes.data && saldoRes.data.length > 0) {
            setSaldoAwal(saldoRes.data[0].saldo_awal ?? 0);
          } else {
            setSaldoAwal(0);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          toast.error(dict.reports.toasts.loadRealtimeFailed);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [cycle, dict.reports.toasts.loadRealtimeFailed, settings.akumulasi_saldo]);

  // Refetch saat visibilitychange/focus dan event online (D5)
  useEffect(() => {
    const handleRefetch = () => {
      if (document.visibilityState === "visible") {
        setIsRefetching(true);
        loadData();
      }
    };

    const handleOnline = () => {
      setIsRefetching(true);
      loadData();
    };

    window.addEventListener("focus", handleRefetch);
    document.addEventListener("visibilitychange", handleRefetch);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleRefetch);
      document.removeEventListener("visibilitychange", handleRefetch);
      window.removeEventListener("online", handleOnline);
    };
  }, [loadData]);

  // Hitung sisa saldo (D9)
  const sisaSaldo = useMemo(() => {
    const totalDanaMasuk = totalIncome + (settings.akumulasi_saldo ? saldoAwal : 0);
    return totalDanaMasuk - totalExpense;
  }, [totalIncome, totalExpense, settings.akumulasi_saldo, saldoAwal]);

  const activeData = mode === "kategori" ? kategoriData : judulData;

  // Format data untuk input Donut Chart
  const donutItems = useMemo(
    () =>
      activeData.map((item, idx) => ({
        id: item.id,
        label: item.label,
        total: item.total,
        color: item.color || PALETTE[idx % PALETTE.length],
        persentase: item.persentase,
        icon: item.icon,
      })),
    [activeData],
  );

  return (
    <div className="space-y-6">
      {/* Kartu Header Periode Siklus Berjalan dengan Pengeluaran & Sisa Saldo */}
      <Card className="rounded-card border border-hairline bg-card">
        <CardHeader className="p-6 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {dict.reports.realtime.activeCycle}
                </span>
                {isRefetching && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
                    <RefreshCw className="size-3 animate-spin" /> {dict.reports.realtime.updatingData}
                  </span>
                )}
              </div>
              <CardTitle className="mt-2 text-xl font-normal tracking-tight text-foreground sm:text-2xl">
                {cycle.label}
              </CardTitle>
              <CardDescription className="mt-1 text-xs text-muted-foreground">
                {dict.reports.realtime.activeRange
                  .replace("{start}", cycle.startDate)
                  .replace("{end}", cycle.endDate)
                  .replace("{days}", String(cycle.daysCount))}
              </CardDescription>
            </div>

            {/* Metrik Finansial Header: Pengeluaran, Pemasukan, dan Sisa Saldo */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-input border border-hairline bg-surface-soft p-3 text-left sm:text-right">
                <p className="text-xs text-muted-foreground">{dict.reports.summary.totalExpense}</p>
                <p className="mt-0.5 font-mono text-base sm:text-lg font-bold text-semantic-down">
                  {formatRupiah(totalExpense)}
                </p>
              </div>
              <div className="rounded-input border border-hairline bg-surface-soft p-3 text-left sm:text-right">
                <p className="text-xs text-muted-foreground">{dict.reports.summary.totalIncome}</p>
                <p className="mt-0.5 font-mono text-base sm:text-lg font-bold text-semantic-up">
                  {formatRupiah(totalIncome)}
                </p>
              </div>
              <div className="rounded-input border border-hairline bg-surface-soft p-3 text-left sm:text-right">
                <p className="text-xs text-muted-foreground">{dict.reports.summary.remainingBalance}</p>
                <p
                  className={`mt-0.5 font-mono text-base sm:text-lg font-bold ${
                    sisaSaldo >= 0 ? "text-semantic-up" : "text-semantic-down"
                  }`}
                >
                  {sisaSaldo > 0 ? "+" : ""}
                  {formatRupiah(sisaSaldo)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Konten Tab: Loading State */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          <Card className="rounded-card border border-hairline bg-card p-6 h-full flex flex-col justify-between">
            <Skeleton className="mb-4 h-5 w-44" />
            <Skeleton className="mx-auto h-65 w-65 rounded-full" />
          </Card>
          <Card className="rounded-card border border-hairline bg-card p-6 h-full flex flex-col justify-between">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : activeData.length === 0 ? (
        /* Empty State bila belum ada pengeluaran */
        <Card className="rounded-card border border-hairline bg-card">
          <CardContent className="p-6">
            <EmptyState
              icon={Receipt}
              title={dict.reports.realtime.emptyExpenseTitle}
              description={dict.reports.realtime.emptyExpenseDesc.replace("{cycle}", cycle.label)}
            />
          </CardContent>
        </Card>
      ) : (
        /* Grid Donut Chart & Rincian (Kategori / Judul) dengan Tinggi Rata */
        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          {/* Kolom Kiri: Donut Recharts */}
          <Card className="rounded-card border border-hairline bg-card h-full flex flex-col justify-between">
            <CardHeader className="p-6 pb-3">
              <div className="flex flex-col gap-3 sm:h-9 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {mode === "kategori"
                    ? dict.reports.realtime.proportionCategory
                    : dict.reports.realtime.proportionTitle}
                </CardTitle>

                {/* Switcher Rincian Kategori | Judul */}
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as RealtimeBreakdownMode)}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="grid grid-cols-2 rounded-full p-1 bg-surface-strong h-9 w-full sm:w-48">
                    <TabsTrigger
                      value="kategori"
                      className="rounded-full text-xs font-semibold data-active:bg-card"
                    >
                      <Tags className="mr-1.5 size-3.5" /> {dict.reports.realtime.categoryTab}
                    </TabsTrigger>
                    <TabsTrigger
                      value="judul"
                      className="rounded-full text-xs font-semibold data-active:bg-card"
                    >
                      <Type className="mr-1.5 size-3.5" /> {dict.reports.realtime.titleTab}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-3 flex-1 flex flex-col justify-center">
              <Suspense
                fallback={
                  <div className="flex h-65 items-center justify-center">
                    <Skeleton className="h-55 w-55 rounded-full" />
                  </div>
                }
              >
                <RekapDonutChart
                  data={donutItems}
                  totalExpense={totalExpense}
                  centerLabel={dict.reports.detail.totalExpense}
                />
              </Suspense>
            </CardContent>
          </Card>

          {/* Kolom Kanan: Rincian Daftar (Kategori / Judul) */}
          <Card className="rounded-card border border-hairline bg-card h-full flex flex-col justify-between">
            <CardHeader className="p-6 pb-3">
              <div className="flex h-9 items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {mode === "kategori"
                    ? dict.reports.realtime.breakdownCategory
                    : dict.reports.realtime.breakdownTitle}{" "}
                  ({activeData.length})
                </CardTitle>
                <span className="inline-flex items-center rounded-full bg-surface-strong px-2.5 py-1 font-mono text-xs text-muted-foreground">
                  {mode === "kategori"
                    ? dict.reports.realtime.categoryCount.replace("{count}", String(activeData.length))
                    : dict.reports.realtime.titleCount.replace("{count}", String(activeData.length))}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-3 flex-1 flex flex-col justify-start">
              <div className="space-y-1.5 max-h-75 overflow-y-auto pr-1">
                {activeData.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group rounded-input p-2.5 transition-colors hover:bg-surface-soft/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-strong text-sm">
                          {mode === "kategori" ? (
                            item.icon || "🏷️"
                          ) : (
                            <Receipt className="size-3.5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="truncate font-medium text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.persentase}%
                        </span>
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {formatRupiah(item.total)}
                        </span>
                      </div>
                    </div>
                    {/* Batang Proporsi */}
                    <div className="h-1.5 w-full rounded-full bg-surface-strong overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, item.persentase))}%`,
                          backgroundColor:
                            item.color || PALETTE[idx % PALETTE.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
