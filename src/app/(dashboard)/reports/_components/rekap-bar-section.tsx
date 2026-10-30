"use client";

import { lazy, Suspense } from "react";
import type { RekapBulanan } from "@/actions/rekap-action";
import { getMonthNames } from "@/constants/rekap";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/use-translation";

const RekapBarChart = lazy(() =>
  import("./rekap-charts").then((module) => ({
    default: module.RekapBarChart,
  })),
);

export type RekapBarSectionProps = {
  data: RekapBulanan[];
  selectedBulan: number;
  isLoading?: boolean;
};

export function RekapBarSection({
  data,
  selectedBulan,
  isLoading,
}: RekapBarSectionProps) {
  const { dict } = useTranslation();
  const monthNames = getMonthNames(dict);

  return (
    <div className="rounded-card border border-hairline bg-card p-8">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {dict.reports.chart.incomeVsExpense}
        </h2>
        <span className="text-xs text-muted-foreground">
          {isLoading
            ? dict.reports.chart.loadingDetails
            : dict.reports.chart.activeMonth.replace(
                "{month}",
                monthNames[selectedBulan - 1],
              )}
        </span>
      </div>
      <Suspense fallback={<Skeleton className="h-62.5 w-full" />}>
        <RekapBarChart data={data} selectedBulan={selectedBulan} />
      </Suspense>
    </div>
  );
}
