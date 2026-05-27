"use client";

import { lazy, Suspense } from "react";
import type { RekapBulanan } from "@/actions/rekap-action";
import { Skeleton } from "@/components/ui/skeleton";

const RekapBarChart = lazy(() =>
  import("./rekap-charts").then((module) => ({
    default: module.RekapBarChart,
  })),
);

export type RekapBarSectionProps = {
  data: RekapBulanan[];
};

export function RekapBarSection({ data }: RekapBarSectionProps) {
  return (
    <div className="rounded-card border border-hairline bg-card p-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Pemasukan vs Pengeluaran per Bulan
      </h2>
      <Suspense fallback={<Skeleton className="h-62.5 w-full" />}>
        <RekapBarChart data={data} />
      </Suspense>
    </div>
  );
}
