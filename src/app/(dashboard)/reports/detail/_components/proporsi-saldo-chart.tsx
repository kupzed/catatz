"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

export type ProporsiSaldoChartProps = {
  totalExpense: number;
  totalIncome: number;
  saldoAwal?: number;
  akumulasiAktif?: boolean;
};

export function ProporsiSaldoChart({
  totalExpense,
  totalIncome,
  saldoAwal = 0,
  akumulasiAktif = false,
}: ProporsiSaldoChartProps) {
  const { formatRupiah } = useSystemPreferences();
  const { dict } = useTranslation();

  // D9: Sisa saldo = pemasukan (+ saldo awal bila akumulasi aktif) - pengeluaran
  const totalDanaMasuk = totalIncome + (akumulasiAktif ? saldoAwal : 0);
  const sisaSaldo = totalDanaMasuk - totalExpense;
  const isDefisit = sisaSaldo < 0;

  const { chartData, persenExpense, persenSisa } = useMemo(() => {
    if (isDefisit) {
      // Jika defisit, tampil 100% pengeluaran dengan penanda defisit
      return {
        chartData: [
          {
            name: dict.reports.summary.totalExpense,
            nominal: totalExpense,
            color: "var(--semantic-down)",
          },
          {
            name: dict.reports.summary.remainingBalance,
            nominal: 0,
            color: "var(--semantic-down)",
          },
        ],
        persenExpense: 100,
        persenSisa: 0,
      };
    }

    if (totalDanaMasuk > 0) {
      const pExpense = Math.round((totalExpense / totalDanaMasuk) * 100);
      const pSisa = Math.max(0, 100 - pExpense);
      return {
        chartData: [
          {
            name: dict.reports.summary.totalExpense,
            nominal: totalExpense,
            color: "var(--semantic-down)",
          },
          {
            name: dict.reports.summary.remainingBalance,
            nominal: sisaSaldo,
            color: "var(--primary)",
          },
        ],
        persenExpense: pExpense,
        persenSisa: pSisa,
      };
    }

    if (totalExpense > 0) {
      return {
        chartData: [
          {
            name: dict.reports.summary.totalExpense,
            nominal: totalExpense,
            color: "var(--semantic-down)",
          },
          {
            name: dict.reports.summary.remainingBalance,
            nominal: 0,
            color: "var(--primary)",
          },
        ],
        persenExpense: 100,
        persenSisa: 0,
      };
    }

    // Kasus nol transaksi
    return {
      chartData: [
        {
          name: dict.reports.summary.totalExpense,
          nominal: 0,
          color: "var(--semantic-down)",
        },
        {
          name: dict.reports.summary.remainingBalance,
          nominal: 0,
          color: "var(--primary)",
        },
      ],
      persenExpense: 0,
      persenSisa: 100,
    };
  }, [dict.reports.summary.remainingBalance, dict.reports.summary.totalExpense, isDefisit, sisaSaldo, totalDanaMasuk, totalExpense]);

  return (
    <Card className="rounded-card border border-hairline bg-card">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.reports.detail.proportionExpenseVsBalance}
          </CardTitle>
          {isDefisit && (
            <span className="inline-flex items-center gap-1 rounded-full bg-semantic-down/10 px-2.5 py-0.5 text-xs font-semibold text-semantic-down">
              <AlertTriangle className="size-3" /> {dict.reports.detail.deficitBadge}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-5">
        {/* Visual Bar Chart ke Atas */}
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#dee1e6"
                opacity={0.35}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => {
                  const num = Number(val);
                  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}Jt`;
                  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}rb`;
                  return String(num);
                }}
              />
              <Tooltip
                formatter={(val) => formatRupiah(Number(val))}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "var(--border-hairline, #dee1e6)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="nominal" radius={[8, 8, 0, 0]} maxBarSize={64}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Persentase & Nominal */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-input border border-hairline bg-surface-soft p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-semantic-down" />
              <span>{dict.reports.summary.totalExpense}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatRupiah(totalExpense)}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {persenExpense}%
              </span>
            </div>
          </div>

          <div className="rounded-input border border-hairline bg-surface-soft p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              <span>{dict.reports.summary.remainingBalance}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span
                className={`font-mono text-sm font-semibold ${
                  isDefisit ? "text-semantic-down" : "text-foreground"
                }`}
              >
                {isDefisit ? `-${formatRupiah(Math.abs(sisaSaldo))}` : formatRupiah(sisaSaldo)}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {persenSisa}%
              </span>
            </div>
          </div>
        </div>

        {/* Indikator Peringatan Defisit */}
        {isDefisit && (
          <div className="flex items-center gap-2 rounded-input border border-semantic-down/30 bg-semantic-down/10 p-3 text-xs text-semantic-down">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              {dict.reports.detail.deficitWarning.replace("{amount}", formatRupiah(Math.abs(sisaSaldo)))}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
