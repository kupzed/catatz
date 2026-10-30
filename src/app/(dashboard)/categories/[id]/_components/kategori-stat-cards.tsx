"use client";

import { useMemo } from "react";
import type { Kategori, KategoriUsageCounts } from "@/types/transaksi";
import type { Transaksi } from "@/types/transaksi";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Receipt,
  CalendarDays,
  Repeat,
} from "lucide-react";

type Props = {
  kategori: Kategori;
  usage: KategoriUsageCounts;
  transaksi: Transaksi[];
};

export function KategoriStatCards({ kategori, usage, transaksi }: Props) {
  const { dict } = useTranslation();
  const { formatRupiah } = useSystemPreferences();

  const { totalExpense, totalIncome, netFlow, count, avgAmount } = useMemo(() => {
    let expense = 0;
    let income = 0;

    for (const t of transaksi) {
      const nominal = Number(t.nominal);
      if (t.tipe === "expense") {
        expense += nominal;
      } else if (t.tipe === "income") {
        income += nominal;
      }
    }

    const txCount = transaksi.length;
    const totalAmount = kategori.tipe === "income" ? income : expense;
    const avg = txCount > 0 ? totalAmount / txCount : 0;

    return {
      totalExpense: expense,
      totalIncome: income,
      netFlow: income - expense,
      count: txCount,
      avgAmount: avg,
    };
  }, [transaksi, kategori.tipe]);

  const usageBadges = [
    {
      label: dict.categories.types.income,
      count: usage.transaksi_masuk,
      icon: ArrowDownLeft,
      color: "text-semantic-up",
    },
    {
      label: dict.categories.types.expense,
      count: usage.transaksi_keluar,
      icon: ArrowUpRight,
      color: "text-semantic-down",
    },
    {
      label: dict.categories.stats.monthlyBudget,
      count: usage.budget,
      icon: CalendarDays,
      color: "text-primary",
    },
    {
      label: dict.categories.stats.recurringTx,
      count: usage.recurring,
      icon: Repeat,
      color: "text-muted-foreground",
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Nominal */}
        {kategori.tipe === "income" ? (
          <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {dict.categories.stats.totalIncome}
              </span>
              <div className="h-7 w-7 rounded-full bg-semantic-up/10 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 text-semantic-up" />
              </div>
            </div>
            <p className="font-mono text-xl sm:text-2xl font-semibold text-semantic-up truncate">
              {formatRupiah(totalIncome)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.categories.stats.fromIncomeTx.replace("{count}", String(count))}
            </p>
          </div>
        ) : kategori.tipe === "expense" ? (
          <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {dict.categories.stats.totalExpense}
              </span>
              <div className="h-7 w-7 rounded-full bg-semantic-down/10 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-semantic-down" />
              </div>
            </div>
            <p className="font-mono text-xl sm:text-2xl font-semibold text-semantic-down truncate">
              {formatRupiah(totalExpense)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.categories.stats.fromExpenseTx.replace("{count}", String(count))}
            </p>
          </div>
        ) : (
          <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {dict.categories.stats.netCashflow}
              </span>
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p
              className={`font-mono text-xl sm:text-2xl font-semibold truncate ${
                netFlow > 0
                  ? "text-semantic-up"
                  : netFlow < 0
                    ? "text-semantic-down"
                    : "text-foreground"
              }`}
            >
              {formatRupiah(netFlow)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.categories.stats.inOutSummary
                .replace("{in}", formatRupiah(totalIncome))
                .replace("{out}", formatRupiah(totalExpense))}
            </p>
          </div>
        )}

        {/* Card 2: Frekuensi Transaksi */}
        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dict.categories.stats.txFrequency}
            </span>
            <div className="h-7 w-7 rounded-full bg-surface-strong flex items-center justify-center">
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-semibold text-foreground truncate">
            {count}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {dict.categories.stats.timesUnit}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {dict.categories.stats.inSelectedPeriod}
          </p>
        </div>

        {/* Card 3: Rata-rata Nominal per Transaksi */}
        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dict.categories.stats.avgPerTx}
            </span>
            <div className="h-7 w-7 rounded-full bg-surface-strong flex items-center justify-center">
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-semibold text-foreground truncate">
            {formatRupiah(avgAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {dict.categories.stats.avgDesc}
          </p>
        </div>
      </div>

      {/* Usage Badges */}
      {usageBadges.length > 0 && (
        <div className="rounded-card border border-hairline bg-card p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              {dict.categories.stats.usageHeader}
            </span>
            {usageBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="rounded-full bg-surface-strong text-foreground text-xs py-1 px-2.5 flex items-center gap-1.5 font-normal"
                >
                  <Icon className={`h-3.5 w-3.5 ${badge.color}`} />
                  <span>{badge.label}</span>
                  <span className="font-mono font-semibold ml-0.5">
                    ({badge.count})
                  </span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
