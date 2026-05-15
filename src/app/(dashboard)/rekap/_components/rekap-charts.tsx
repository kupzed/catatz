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
import { formatRupiah } from "@/lib/utils";
import type { RekapBulanan, RekapKategori } from "@/actions/rekap-action";

const BULAN_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function RekapBarChart({ data }: { data: RekapBulanan[] }) {
  const barData = data.map((item) => ({
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
        <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RekapPieChart({ data }: { data: RekapKategori[] }) {
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
