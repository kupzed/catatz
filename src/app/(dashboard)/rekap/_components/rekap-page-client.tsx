"use client";

import { lazy, Suspense } from "react";
import { formatRupiah } from "@/lib/utils";
import type {
  RekapBulanan,
  RekapKategori,
  BudgetWithUsage,
} from "@/actions/rekap-action";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BULAN_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const RekapBarChart = lazy(() =>
  import("./rekap-charts").then((module) => ({
    default: module.RekapBarChart,
  })),
);
const RekapPieChart = lazy(() =>
  import("./rekap-charts").then((module) => ({
    default: module.RekapPieChart,
  })),
);

type Props = {
  initialBulanan: RekapBulanan[];
  initialKategori: RekapKategori[];
  initialBudget: BudgetWithUsage[];
  currentBulan: number;
  currentTahun: number;
};

const BUDGET_STATUS_COLORS: Record<string, string> = {
  aman: "bg-semantic-up/10 text-semantic-up",
  waspada: "bg-accent-yellow/10 text-accent-yellow",
  bahaya: "bg-semantic-down/10 text-semantic-down",
};

export default function RekapPageClient({
  initialBulanan,
  initialKategori,
  initialBudget,
  currentBulan,
  currentTahun,
}: Props) {
  const totalIncome = initialBulanan.reduce((s, d) => s + d.total_income, 0);
  const totalExpense = initialBulanan.reduce((s, d) => s + d.total_expense, 0);

  const currentMonth = initialBulanan.find((d) => d.bulan === currentBulan);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-normal tracking-[-0.4px] text-foreground leading-tight">
          Rekap Keuangan
        </h1>
        <p className="text-sm text-muted-foreground">Analitik {currentTahun}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: `Pemasukan ${BULAN_NAMES[currentBulan - 1]}`,
            value: currentMonth?.total_income ?? 0,
            color: "text-emerald-500",
          },
          {
            label: `Pengeluaran ${BULAN_NAMES[currentBulan - 1]}`,
            value: currentMonth?.total_expense ?? 0,
            color: "text-rose-500",
          },
          {
            label: `Total Pemasukan ${currentTahun}`,
            value: totalIncome,
            color: "text-emerald-500",
          },
          {
            label: `Total Pengeluaran ${currentTahun}`,
            value: totalExpense,
            color: "text-rose-500",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-card border border-hairline bg-card p-6 space-y-2"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground leading-snug">
              {c.label}
            </p>
            <p className={cn("font-mono text-lg font-medium", c.color)}>
              {formatRupiah(c.value, true)}
            </p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="rounded-card border border-hairline bg-card p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Pemasukan vs Pengeluaran per Bulan
        </h2>
        <Suspense fallback={<Skeleton className="h-62.5 w-full" />}>
          <RekapBarChart data={initialBulanan} />
        </Suspense>
      </div>

      {/* Pie Chart + Category List */}
      {initialKategori.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-card border border-hairline bg-card p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Pengeluaran per Kategori ({BULAN_NAMES[currentBulan - 1]})
            </h2>
            <Suspense fallback={<Skeleton className="h-50 w-full" />}>
              <RekapPieChart data={initialKategori} />
            </Suspense>
          </div>

          <div className="rounded-card border border-hairline bg-card p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Rincian Kategori
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {initialKategori.map((k) => (
                <div key={k.kategori_id} className="flex items-center gap-3">
                  <span className="text-xl">{k.kategori_ikon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">
                        {k.kategori_nama}
                      </span>
                      <span className="font-mono text-sm text-muted-foreground">
                        {k.persentase}%
                      </span>
                    </div>
                    <Progress
                      value={k.persentase}
                      className="h-1.5 mt-1 [&>div]:bg-primary"
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatRupiah(k.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget */}
      {initialBudget.length > 0 && (
        <div className="rounded-card border border-hairline bg-card p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Budget {BULAN_NAMES[currentBulan - 1]}
          </h2>
          <div className="space-y-4">
            {initialBudget.map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{b.kategori_ikon}</span>
                    <span className="text-sm font-medium">
                      {b.kategori_nama}
                    </span>
                    <Badge
                      className={cn(
                        "text-xs px-2.5 py-0.5 border-0 rounded-full font-medium",
                        BUDGET_STATUS_COLORS[b.status],
                      )}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatRupiah(b.total_dipakai, true)} /{" "}
                    {formatRupiah(b.limit_nominal, true)}
                  </span>
                </div>
                <Progress
                  value={b.persentase}
                  className={cn(
                    "h-2",
                    b.status === "bahaya"
                      ? "[&>div]:bg-semantic-down"
                      : b.status === "waspada"
                        ? "[&>div]:bg-accent-yellow"
                        : "[&>div]:bg-semantic-up",
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
