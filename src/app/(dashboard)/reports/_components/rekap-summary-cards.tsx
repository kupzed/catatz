"use client";

import type { RekapBulanan } from "@/actions/rekap-action";
import { getMonthNames } from "@/constants/rekap";
import { cn } from "@/lib/utils";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

export type RekapSummaryCardsProps = {
  currentBulan: number;
  currentTahun: number;
  currentMonth?: RekapBulanan;
  totalIncome: number;
  totalExpense: number;
};

export function RekapSummaryCards({
  currentBulan,
  currentTahun,
  currentMonth,
  totalIncome,
  totalExpense,
}: RekapSummaryCardsProps) {
  const { formatRupiah } = useSystemPreferences();
  const { dict } = useTranslation();
  const monthNames = getMonthNames(dict);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {
          label: `${dict.reports.card.income} ${monthNames[currentBulan - 1]}`,
          value: currentMonth?.total_income ?? 0,
          color: "text-semantic-up",
        },
        {
          label: `${dict.reports.card.expense} ${monthNames[currentBulan - 1]}`,
          value: currentMonth?.total_expense ?? 0,
          color: "text-semantic-down",
        },
        {
          label: `${dict.reports.summary.totalIncome} ${currentTahun}`,
          value: totalIncome,
          color: "text-semantic-up",
        },
        {
          label: `${dict.reports.summary.totalExpense} ${currentTahun}`,
          value: totalExpense,
          color: "text-semantic-down",
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
  );
}
