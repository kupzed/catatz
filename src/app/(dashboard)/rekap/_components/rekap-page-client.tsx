'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatRupiah, percentage } from '@/lib/utils';
import type { RekapBulanan, RekapKategori, BudgetWithUsage } from '@/actions/rekap-action';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const BULAN_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

type Props = {
  initialBulanan: RekapBulanan[];
  initialKategori: RekapKategori[];
  initialBudget: BudgetWithUsage[];
  currentBulan: number;
  currentTahun: number;
};

const BUDGET_STATUS_COLORS: Record<string, string> = {
  aman:    'bg-emerald-500',
  waspada: 'bg-amber-500',
  bahaya:  'bg-rose-500',
};

export default function RekapPageClient({ initialBulanan, initialKategori, initialBudget, currentBulan, currentTahun }: Props) {
  const barData = initialBulanan.map((d) => ({
    name: BULAN_NAMES[d.bulan - 1],
    Pemasukan: d.total_income,
    Pengeluaran: d.total_expense,
  }));

  const totalIncome = initialBulanan.reduce((s, d) => s + d.total_income, 0);
  const totalExpense = initialBulanan.reduce((s, d) => s + d.total_expense, 0);

  const currentMonth = initialBulanan.find((d) => d.bulan === currentBulan);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekap Keuangan</h1>
        <p className="text-muted-foreground text-sm">Analitik {currentTahun}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: `Pemasukan ${BULAN_NAMES[currentBulan - 1]}`, value: currentMonth?.total_income ?? 0, color: 'text-emerald-500' },
          { label: `Pengeluaran ${BULAN_NAMES[currentBulan - 1]}`, value: currentMonth?.total_expense ?? 0, color: 'text-rose-500' },
          { label: `Total Pemasukan ${currentTahun}`, value: totalIncome, color: 'text-emerald-500' },
          { label: `Total Pengeluaran ${currentTahun}`, value: totalExpense, color: 'text-rose-500' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground leading-snug">{c.label}</p>
            <p className={cn('font-bold text-base', c.color)}>{formatRupiah(c.value, true)}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Pemasukan vs Pengeluaran per Bulan</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}Jt`} />
            <Tooltip formatter={(v) => formatRupiah(Number(v))} />
            <Legend />
            <Bar dataKey="Pemasukan"   fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart + Category List */}
      {initialKategori.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">Pengeluaran per Kategori ({BULAN_NAMES[currentBulan - 1]})</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={initialKategori}
                  dataKey="total"
                  nameKey="kategori_nama"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {initialKategori.map((entry, i) => (
                    <Cell key={entry.kategori_id} fill={entry.kategori_warna} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">Rincian Kategori</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {initialKategori.map((k) => (
                <div key={k.kategori_id} className="flex items-center gap-3">
                  <span className="text-xl">{k.kategori_ikon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{k.kategori_nama}</span>
                      <span className="text-xs text-muted-foreground">{k.persentase}%</span>
                    </div>
                    <Progress value={k.persentase} className="h-1.5 mt-1" />
                    <span className="text-xs text-muted-foreground">{formatRupiah(k.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget */}
      {initialBudget.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-sm font-semibold mb-4">Budget {BULAN_NAMES[currentBulan - 1]}</h2>
          <div className="space-y-4">
            {initialBudget.map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{b.kategori_ikon}</span>
                    <span className="text-sm font-medium">{b.kategori_nama}</span>
                    <Badge
                      className={cn(
                        'text-xs px-1.5 py-0 border-0 text-white',
                        BUDGET_STATUS_COLORS[b.status]
                      )}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRupiah(b.total_dipakai, true)} / {formatRupiah(b.limit_nominal, true)}
                  </span>
                </div>
                <Progress
                  value={b.persentase}
                  className={cn('h-2', b.status === 'bahaya' ? '[&>div]:bg-rose-500' : b.status === 'waspada' ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
