"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RekapBulanan, RekapKategori } from "@/actions/rekap-action";
import { getMonthNames } from "@/constants/rekap";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

export type RekapBarChartProps = {
  data: RekapBulanan[];
  selectedBulan: number;
};

export type RekapPieChartProps = {
  data: RekapKategori[];
};

export function RekapBarChart({
  data,
  selectedBulan,
}: RekapBarChartProps) {
  const { formatRupiah } = useSystemPreferences();
  const { dict } = useTranslation();
  const monthNames = getMonthNames(dict);
  const barData = data.map((item) => ({
    bulan: item.bulan,
    name: monthNames[item.bulan - 1],
    Pemasukan: item.total_income,
    Pengeluaran: item.total_expense,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={barData} barCategoryGap="30%">
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${(Number(value) / 1_000_000).toFixed(0)}Jt`} />
        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
        <Legend />
        <Bar dataKey="Pemasukan" radius={[4, 4, 0, 0]}>
          {barData.map((entry) => (
            <Cell
              key={`income-${entry.bulan}`}
              fill="var(--semantic-up)"
              opacity={entry.bulan === selectedBulan ? 1 : 0.35}
            />
          ))}
        </Bar>
        <Bar dataKey="Pengeluaran" radius={[4, 4, 0, 0]}>
          {barData.map((entry) => (
            <Cell
              key={`expense-${entry.bulan}`}
              fill="var(--semantic-down)"
              opacity={entry.bulan === selectedBulan ? 1 : 0.35}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RekapPieChart({ data }: RekapPieChartProps) {
  const { formatRupiah } = useSystemPreferences();

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="kategori_nama"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.kategori_id} fill={entry.kategori_warna} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

const DEFAULT_DONUT_COLORS = [
  "#0052ff",
  "#05b169",
  "#f4b000",
  "#cf202f",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export type RekapDonutItem = {
  id: string;
  label: string;
  total: number;
  color?: string | null;
  persentase?: number;
  icon?: string;
};

export type RekapDonutChartProps = {
  data: RekapDonutItem[];
  totalExpense?: number;
  centerLabel?: string;
  height?: number;
};

export function RekapDonutChart({
  data,
  totalExpense,
  centerLabel,
  height = 260,
}: RekapDonutChartProps) {
  const { formatRupiah } = useSystemPreferences();
  const { dict } = useTranslation();
  const label = centerLabel ?? dict.reports.detail.totalExpense;
  const computedTotal =
    totalExpense ?? data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div
      className="relative flex w-full items-center justify-center"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={78}
            outerRadius={105}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.id || index}
                fill={
                  entry.color ||
                  DEFAULT_DONUT_COLORS[index % DEFAULT_DONUT_COLORS.length]
                }
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatRupiah(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-base font-bold tracking-tight text-foreground sm:text-lg max-w-37.5 truncate">
          {formatRupiah(computedTotal)}
        </span>
      </div>
    </div>
  );
}
