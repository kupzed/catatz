"use client";

import type { RekapBulanan } from "@/actions/rekap-action";
import { BULAN_NAMES } from "@/constants/rekap";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {
          label: `Pemasukan ${BULAN_NAMES[currentBulan - 1]}`,
          value: currentMonth?.total_income ?? 0,
          color: "text-semantic-up",
        },
        {
          label: `Pengeluaran ${BULAN_NAMES[currentBulan - 1]}`,
          value: currentMonth?.total_expense ?? 0,
          color: "text-semantic-down",
        },
        {
          label: `Total Pemasukan ${currentTahun}`,
          value: totalIncome,
          color: "text-semantic-up",
        },
        {
          label: `Total Pengeluaran ${currentTahun}`,
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
