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
import { BULAN_NAMES } from "@/constants/rekap";
import { useSystemPreferences } from "@/providers/system-preference-provider";

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
  const barData = data.map((item) => ({
    bulan: item.bulan,
    name: BULAN_NAMES[item.bulan - 1],
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
