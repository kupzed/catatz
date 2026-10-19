"use client";

import { useMemo } from "react";
import type { Rekening, RekeningUsageCounts } from "@/types/rekening";
import type { Transaksi } from "@/types/transaksi";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  HandCoins,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  rekening: Rekening;
  usage: RekeningUsageCounts;
  transaksi: Transaksi[];
};

export function RekeningStatCards({ rekening, usage, transaksi }: Props) {
  const { formatRupiah } = useSystemPreferences();

  const { totalInflow, totalOutflow, netFlow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    for (const t of transaksi) {
      const nominal = Number(t.nominal);
      if (t.tipe === "income" && t.rekening_id === rekening.id) {
        inflow += nominal;
      } else if (t.tipe === "expense" && t.rekening_id === rekening.id) {
        outflow += nominal;
      } else if (t.tipe === "transfer") {
        if (t.rekening_id === rekening.id) {
          outflow += nominal;
        }
        if (t.rekening_tujuan === rekening.id) {
          inflow += nominal;
        }
      }
    }

    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netFlow: inflow - outflow,
    };
  }, [transaksi, rekening.id]);

  const usageBadges = [
    {
      label: "Pemasukan",
      count: usage.transaksi_masuk,
      icon: ArrowDownLeft,
      color: "text-semantic-up",
    },
    {
      label: "Pengeluaran",
      count: usage.transaksi_keluar,
      icon: ArrowUpRight,
      color: "text-semantic-down",
    },
    {
      label: "Transfer Keluar",
      count: usage.transfer_keluar,
      icon: ArrowUpRight,
      color: "text-muted-foreground",
    },
    {
      label: "Transfer Masuk",
      count: usage.transfer_masuk,
      icon: ArrowDownLeft,
      color: "text-semantic-up",
    },
    {
      label: "Koreksi Saldo",
      count: usage.koreksi_saldo,
      icon: SlidersHorizontal,
      color: "text-muted-foreground",
    },
    {
      label: "Hutang/Cicilan",
      count: usage.hutang + usage.hutang_cicilan,
      icon: HandCoins,
      color: "text-muted-foreground",
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="space-y-4">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Inflow */}
        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Masuk (Data Aktif)
            </span>
            <div className="h-7 w-7 rounded-full bg-semantic-up/10 text-semantic-up flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-medium text-foreground tracking-tight">
            +{formatRupiah(totalInflow)}
          </p>
        </div>

        {/* Total Outflow */}
        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Keluar (Data Aktif)
            </span>
            <div className="h-7 w-7 rounded-full bg-semantic-down/10 text-semantic-down flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-medium text-foreground tracking-tight">
            -{formatRupiah(totalOutflow)}
          </p>
        </div>

        {/* Net Flow */}
        <div className="rounded-card border border-hairline bg-card p-4 sm:p-5 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Arus Kas Bersih
            </span>
            <div className="h-7 w-7 rounded-full bg-surface-strong text-muted-foreground flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <p
            className={cn(
              "font-mono text-xl sm:text-2xl font-medium tracking-tight",
              netFlow > 0 && "text-semantic-up",
              netFlow < 0 && "text-semantic-down",
              netFlow === 0 && "text-foreground",
            )}
          >
            {netFlow > 0 ? "+" : ""}
            {formatRupiah(netFlow)}
          </p>
        </div>
      </div>

      {/* Rincian Pemakaian Rekening */}
      {usageBadges.length > 0 && (
        <div className="rounded-card border border-hairline bg-surface-soft/60 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Distribusi Pemakaian ({usage.total} Data Terkait)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {usageBadges.map((b) => {
              const Icon = b.icon;
              return (
                <Badge
                  key={b.label}
                  variant="secondary"
                  className="rounded-full bg-surface-strong text-foreground border-hairline text-xs py-1 px-3 gap-1.5 font-normal"
                >
                  <Icon className={cn("h-3.5 w-3.5", b.color)} />
                  <span>
                    {b.label}: <strong className="font-semibold">{b.count}</strong>
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
