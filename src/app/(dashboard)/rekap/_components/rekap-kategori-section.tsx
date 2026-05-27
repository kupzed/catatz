"use client";

import { lazy, Suspense } from "react";
import type { RekapKategori } from "@/actions/rekap-action";
import { BULAN_NAMES } from "@/constants/rekap";
import { formatRupiah } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const RekapPieChart = lazy(() =>
  import("./rekap-charts").then((module) => ({
    default: module.RekapPieChart,
  })),
);

export type RekapKategoriSectionProps = {
  data: RekapKategori[];
  currentBulan: number;
};

export function RekapKategoriSection({
  data,
  currentBulan,
}: RekapKategoriSectionProps) {
  if (data.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-card border border-hairline bg-card p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Pengeluaran per Kategori ({BULAN_NAMES[currentBulan - 1]})
        </h2>
        <Suspense fallback={<Skeleton className="h-50 w-full" />}>
          <RekapPieChart data={data} />
        </Suspense>
      </div>

      <div className="rounded-card border border-hairline bg-card p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Rincian Kategori
        </h2>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {data.map((k) => (
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
  );
}
