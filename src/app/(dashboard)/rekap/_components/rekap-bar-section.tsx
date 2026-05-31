"use client";

import { lazy, Suspense } from "react";
import type { RekapBulanan } from "@/actions/rekap-action";
import { BULAN_NAMES } from "@/constants/rekap";
import { Skeleton } from "@/components/ui/skeleton";

const RekapBarChart = lazy(() =>
  import("./rekap-charts").then((module) => ({
    default: module.RekapBarChart,
  })),
);

export type RekapBarSectionProps = {
  data: RekapBulanan[];
  selectedBulan: number;
  onSelectMonth: (bulan: number) => void;
  isLoading?: boolean;
};

export function RekapBarSection({
  data,
  selectedBulan,
  onSelectMonth,
  isLoading,
}: RekapBarSectionProps) {
  return (
    <div className="rounded-card border border-hairline bg-card p-8">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pemasukan vs Pengeluaran per Bulan
        </h2>
        <span className="text-xs text-muted-foreground">
          {isLoading
            ? "Memuat rincian..."
            : `Bulan aktif: ${BULAN_NAMES[selectedBulan - 1]}`}
        </span>
      </div>
      <Suspense fallback={<Skeleton className="h-62.5 w-full" />}>
        <RekapBarChart
          data={data}
          selectedBulan={selectedBulan}
          onSelectMonth={onSelectMonth}
        />
      </Suspense>
    </div>
  );
}
