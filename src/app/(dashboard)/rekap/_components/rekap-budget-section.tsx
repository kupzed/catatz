"use client";

import type { BudgetWithUsage } from "@/actions/rekap-action";
import { BULAN_NAMES } from "@/constants/rekap";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSystemPreferences } from "@/providers/system-preference-provider";

const BUDGET_STATUS_COLORS: Record<string, string> = {
  aman: "bg-semantic-up/10 text-semantic-up",
  waspada: "bg-accent-yellow/10 text-accent-yellow",
  bahaya: "bg-semantic-down/10 text-semantic-down",
};

export type RekapBudgetSectionProps = {
  budgets: BudgetWithUsage[];
  currentBulan: number;
};

export function RekapBudgetSection({
  budgets,
  currentBulan,
}: RekapBudgetSectionProps) {
  const { formatRupiah } = useSystemPreferences();

  if (budgets.length === 0) return null;

  return (
    <div className="rounded-card border border-hairline bg-card p-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Budget {BULAN_NAMES[currentBulan - 1]}
      </h2>
      <div className="space-y-4">
        {budgets.map((b) => (
          <div key={b.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span>{b.kategori_ikon}</span>
                <span className="text-sm font-medium">{b.kategori_nama}</span>
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
  );
}
