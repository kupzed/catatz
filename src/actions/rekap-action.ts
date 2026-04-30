'use server';

import { createClient } from '@/configs/supabase/server';

export type RekapBulanan = {
  bulan: number;
  tahun: number;
  total_income: number;
  total_expense: number;
  net: number;
};

export type RekapKategori = {
  kategori_id: string;
  kategori_nama: string;
  kategori_ikon: string;
  kategori_warna: string;
  total: number;
  persentase: number;
};

export type BudgetWithUsage = {
  id: string;
  kategori_id: string;
  kategori_nama: string;
  kategori_ikon: string;
  limit_nominal: number;
  total_dipakai: number;
  persentase: number;
  status: 'aman' | 'waspada' | 'bahaya';
};

export async function getRekapBulanan(tahun: number): Promise<RekapBulanan[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transaksi')
    .select('tipe, nominal, tanggal')
    .gte('tanggal', `${tahun}-01-01`)
    .lte('tanggal', `${tahun}-12-31`)
    .neq('tipe', 'transfer');

  if (error) throw new Error(error.message);

  const byMonth: Record<number, { income: number; expense: number }> = {};
  for (let m = 1; m <= 12; m++) {
    byMonth[m] = { income: 0, expense: 0 };
  }

  (data ?? []).forEach((t) => {
    const bulan = new Date(t.tanggal).getMonth() + 1;
    if (t.tipe === 'income') byMonth[bulan].income += Number(t.nominal);
    else if (t.tipe === 'expense') byMonth[bulan].expense += Number(t.nominal);
  });

  return Object.entries(byMonth).map(([bulan, v]) => ({
    bulan: Number(bulan),
    tahun,
    total_income: v.income,
    total_expense: v.expense,
    net: v.income - v.expense,
  }));
}

export async function getRekapKategori(
  bulan: number,
  tahun: number
): Promise<RekapKategori[]> {
  const supabase = await createClient();

  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transaksi')
    .select('nominal, kategori:kategori_id(id, nama, ikon, warna)')
    .eq('tipe', 'expense')
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)
    .not('kategori_id', 'is', null);

  if (error) throw new Error(error.message);

  const grouped: Record<string, { nama: string; ikon: string; warna: string; total: number }> = {};
  let grandTotal = 0;

  (data ?? []).forEach((t: any) => {
    const k = t.kategori;
    if (!k) return;
    if (!grouped[k.id]) grouped[k.id] = { nama: k.nama, ikon: k.ikon, warna: k.warna, total: 0 };
    grouped[k.id].total += Number(t.nominal);
    grandTotal += Number(t.nominal);
  });

  return Object.entries(grouped)
    .map(([id, v]) => ({
      kategori_id: id,
      kategori_nama: v.nama,
      kategori_ikon: v.ikon,
      kategori_warna: v.warna,
      total: v.total,
      persentase: grandTotal > 0 ? Math.round((v.total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getBudgetWithUsage(bulan: number, tahun: number): Promise<BudgetWithUsage[]> {
  const supabase = await createClient();

  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

  const { data: budgets, error } = await supabase
    .from('budget')
    .select('*, kategori:kategori_id(id, nama, ikon)')
    .eq('bulan', bulan)
    .eq('tahun', tahun);

  if (error) throw new Error(error.message);
  if (!budgets || budgets.length === 0) return [];

  const { data: transaksi } = await supabase
    .from('transaksi')
    .select('nominal, kategori_id')
    .eq('tipe', 'expense')
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)
    .in('kategori_id', budgets.map((b: any) => b.kategori_id));

  const usage: Record<string, number> = {};
  (transaksi ?? []).forEach((t: any) => {
    usage[t.kategori_id] = (usage[t.kategori_id] || 0) + Number(t.nominal);
  });

  return (budgets as any[]).map((b) => {
    const dipakai = usage[b.kategori_id] || 0;
    const persentase = Math.min(Math.round((dipakai / b.limit_nominal) * 100), 100);
    return {
      id: b.id,
      kategori_id: b.kategori_id,
      kategori_nama: b.kategori?.nama ?? '',
      kategori_ikon: b.kategori?.ikon ?? '📌',
      limit_nominal: Number(b.limit_nominal),
      total_dipakai: dipakai,
      persentase,
      status: persentase >= 90 ? 'bahaya' : persentase >= 70 ? 'waspada' : 'aman',
    };
  });
}

export async function upsertBudget(
  kategori_id: string,
  bulan: number,
  tahun: number,
  limit_nominal: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  const { error } = await supabase
    .from('budget')
    .upsert({ user_id: user.id, kategori_id, bulan, tahun, limit_nominal },
      { onConflict: 'user_id,kategori_id,bulan,tahun' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
