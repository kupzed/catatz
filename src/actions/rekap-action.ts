'use server';

import { createClient } from '@/configs/supabase/server';
import type { TipeHutang } from '@/types/hutang';
import type { TipeTransaksi } from '@/types/transaksi';

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

type RekapTipeUtama = Extract<TipeTransaksi, 'income' | 'expense'>;

export type RekapDetailTransaksi = {
  id: string;
  tipe: RekapTipeUtama;
  judul: string | null;
  nominal: number;
  tanggal: string;
  waktu: string | null;
  catatan: string | null;
  kategori: {
    id: string;
    nama: string;
    ikon: string;
    warna: string;
  } | null;
  rekening: {
    id: string;
    nama: string;
    jenis: string;
    logo: string | null;
    warna: string;
  } | null;
};

export type RekapBreakdownItem = {
  id: string;
  tipe: RekapTipeUtama;
  label: string;
  icon: string;
  color: string | null;
  total: number;
  persentase: number;
  count: number;
  transaksi: RekapDetailTransaksi[];
};

export type RekapBreakdown = {
  income: RekapBreakdownItem[];
  expense: RekapBreakdownItem[];
};

export type RekapKoreksiItem = {
  id: string;
  arah: 'tambah' | 'kurang';
  nominal: number;
  tanggal: string;
  waktu: string | null;
  catatan: string | null;
  rekening: {
    id: string;
    nama: string;
    jenis: string;
    logo: string | null;
    warna: string;
  } | null;
};

export type RekapKoreksiSaldo = {
  total_tambah: number;
  total_kurang: number;
  net: number;
  count: number;
  items: RekapKoreksiItem[];
};

export type RekapHutangPiutangItem = {
  id: string;
  jenis:
    | 'piutang_baru'
    | 'hutang_baru'
    | 'cicilan_piutang'
    | 'cicilan_hutang';
  label: string;
  nominal: number;
  tanggal: string;
  waktu: string | null;
  catatan: string | null;
};

export type RekapHutangPiutang = {
  piutang_baru: number;
  hutang_baru: number;
  cicilan_piutang: number;
  cicilan_hutang: number;
  piutang_aktif: number;
  hutang_aktif: number;
  count: number;
  items: RekapHutangPiutangItem[];
};

export type RekapDetailBulanan = {
  bulan: number;
  tahun: number;
  startDate: string;
  endDate: string;
  daysInMonth: number;
  total_income: number;
  total_expense: number;
  net: number;
  rata_income_harian: number;
  rata_expense_harian: number;
  kategori: RekapBreakdown;
  judul: RekapBreakdown;
  koreksi: RekapKoreksiSaldo;
  hutang_piutang: RekapHutangPiutang;
};

type RekapTransaksiRow = {
  id: string;
  tipe: TipeTransaksi;
  judul: string | null;
  nominal: number;
  tanggal: string;
  waktu: string | null;
  catatan: string | null;
  tags: string[] | null;
  kategori: {
    id: string;
    nama: string;
    ikon: string;
    warna: string;
  } | null;
  rekening: {
    id: string;
    nama: string;
    jenis: string;
    logo: string | null;
    warna: string;
  } | null;
};

type HutangRow = {
  id: string;
  tipe: TipeHutang;
  nama_entitas: string;
  total_pinjaman: number;
  sisa_tagihan: number;
  tanggal_mulai: string;
  waktu: string | null;
  status: string;
  catatan: string | null;
};

type CicilanRow = {
  id: string;
  nominal: number;
  tanggal: string;
  waktu: string | null;
  catatan: string | null;
  tipe_hutang_snapshot: TipeHutang;
  hutang: {
    id: string;
    nama_entitas: string;
    tipe: TipeHutang;
  } | null;
};

function getMonthRange(bulan: number, tahun: number) {
  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  return { startDate, endDate, daysInMonth };
}

function createEmptyBreakdown(): RekapBreakdown {
  return { income: [], expense: [] };
}

function toDetailTransaksi(row: RekapTransaksiRow): RekapDetailTransaksi {
  return {
    id: row.id,
    tipe: row.tipe as RekapTipeUtama,
    judul: row.judul,
    nominal: Number(row.nominal),
    tanggal: row.tanggal,
    waktu: row.waktu,
    catatan: row.catatan,
    kategori: row.kategori,
    rekening: row.rekening,
  };
}

function buildBreakdown(
  transaksi: RekapDetailTransaksi[],
  mode: 'kategori' | 'judul',
): RekapBreakdown {
  const grouped: Record<string, Omit<RekapBreakdownItem, 'persentase'>> = {};
  const totals = transaksi.reduce(
    (acc, item) => {
      acc[item.tipe] += Number(item.nominal);
      return acc;
    },
    { income: 0, expense: 0 },
  );

  for (const item of transaksi) {
    const kategoriId = item.kategori?.id ?? 'tanpa-kategori';
    const judulKey = item.judul?.trim() || 'Tanpa judul';
    const groupId =
      mode === 'kategori'
        ? `${item.tipe}:kategori:${kategoriId}`
        : `${item.tipe}:judul:${judulKey.toLowerCase()}`;
    const label =
      mode === 'kategori'
        ? (item.kategori?.nama ?? 'Tanpa kategori')
        : judulKey;
    const icon =
      mode === 'kategori'
        ? (item.kategori?.ikon ?? 'Tag')
        : item.tipe === 'income'
          ? 'Masuk'
          : 'Keluar';

    if (!grouped[groupId]) {
      grouped[groupId] = {
        id: groupId,
        tipe: item.tipe,
        label,
        icon,
        color: item.kategori?.warna ?? null,
        total: 0,
        count: 0,
        transaksi: [],
      };
    }

    grouped[groupId].total += Number(item.nominal);
    grouped[groupId].count += 1;
    grouped[groupId].transaksi.push(item);
  }

  return Object.values(grouped).reduce<RekapBreakdown>((acc, item) => {
    const total = totals[item.tipe];
    acc[item.tipe].push({
      ...item,
      persentase: total > 0 ? Math.round((item.total / total) * 100) : 0,
    });
    acc[item.tipe].sort((a, b) => b.total - a.total);
    return acc;
  }, createEmptyBreakdown());
}

function buildKoreksi(rows: RekapTransaksiRow[]): RekapKoreksiSaldo {
  const items = rows
    .filter((item) => item.tipe === 'correction')
    .map<RekapKoreksiItem>((item) => {
      const arah = item.tags?.includes('correction_sub') ? 'kurang' : 'tambah';

      return {
        id: item.id,
        arah,
        nominal: Number(item.nominal),
        tanggal: item.tanggal,
        waktu: item.waktu,
        catatan: item.catatan,
        rekening: item.rekening,
      };
    });

  const total_tambah = items
    .filter((item) => item.arah === 'tambah')
    .reduce((sum, item) => sum + item.nominal, 0);
  const total_kurang = items
    .filter((item) => item.arah === 'kurang')
    .reduce((sum, item) => sum + item.nominal, 0);

  return {
    total_tambah,
    total_kurang,
    net: total_tambah - total_kurang,
    count: items.length,
    items,
  };
}

function buildHutangPiutang(
  hutang: HutangRow[],
  cicilan: CicilanRow[],
  activeHutang: Pick<HutangRow, 'tipe' | 'sisa_tagihan'>[],
): RekapHutangPiutang {
  const piutang_baru = hutang
    .filter((item) => item.tipe === 'memberi')
    .reduce((sum, item) => sum + Number(item.total_pinjaman), 0);
  const hutang_baru = hutang
    .filter((item) => item.tipe === 'menerima')
    .reduce((sum, item) => sum + Number(item.total_pinjaman), 0);
  const cicilan_piutang = cicilan
    .filter((item) => (item.hutang?.tipe ?? item.tipe_hutang_snapshot) === 'memberi')
    .reduce((sum, item) => sum + Number(item.nominal), 0);
  const cicilan_hutang = cicilan
    .filter((item) => (item.hutang?.tipe ?? item.tipe_hutang_snapshot) === 'menerima')
    .reduce((sum, item) => sum + Number(item.nominal), 0);
  const piutang_aktif = activeHutang
    .filter((item) => item.tipe === 'memberi')
    .reduce((sum, item) => sum + Number(item.sisa_tagihan), 0);
  const hutang_aktif = activeHutang
    .filter((item) => item.tipe === 'menerima')
    .reduce((sum, item) => sum + Number(item.sisa_tagihan), 0);

  const hutangItems = hutang.map<RekapHutangPiutangItem>((item) => ({
    id: item.id,
    jenis: item.tipe === 'memberi' ? 'piutang_baru' : 'hutang_baru',
    label: item.nama_entitas,
    nominal: Number(item.total_pinjaman),
    tanggal: item.tanggal_mulai,
    waktu: item.waktu,
    catatan: item.catatan,
  }));
  const cicilanItems = cicilan.map<RekapHutangPiutangItem>((item) => {
    const tipe = item.hutang?.tipe ?? item.tipe_hutang_snapshot;

    return {
      id: item.id,
      jenis: tipe === 'memberi' ? 'cicilan_piutang' : 'cicilan_hutang',
      label: item.hutang?.nama_entitas ?? 'Cicilan',
      nominal: Number(item.nominal),
      tanggal: item.tanggal,
      waktu: item.waktu,
      catatan: item.catatan,
    };
  });

  return {
    piutang_baru,
    hutang_baru,
    cicilan_piutang,
    cicilan_hutang,
    piutang_aktif,
    hutang_aktif,
    count: hutangItems.length + cicilanItems.length,
    items: [...hutangItems, ...cicilanItems].sort((a, b) =>
      `${b.tanggal} ${b.waktu ?? ''}`.localeCompare(`${a.tanggal} ${a.waktu ?? ''}`),
    ),
  };
}

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

  const { startDate, endDate } = getMonthRange(bulan, tahun);

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

  const transaksi = (data as unknown as { nominal: number; kategori: { id: string; nama: string; ikon: string; warna: string } | null }[]) ?? [];

  transaksi.forEach((t) => {
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

export async function getRekapDetailBulanan(
  bulan: number,
  tahun: number,
): Promise<RekapDetailBulanan> {
  const supabase = await createClient();
  const { startDate, endDate, daysInMonth } = getMonthRange(bulan, tahun);

  const [transaksiResult, hutangResult, cicilanResult, activeHutangResult] =
    await Promise.all([
      supabase
        .from('transaksi')
        .select(`
          id,
          tipe,
          judul,
          nominal,
          tanggal,
          waktu,
          catatan,
          tags,
          kategori:kategori_id(id, nama, ikon, warna),
          rekening:rekening_id(id, nama, jenis, logo, warna)
        `)
        .neq('tipe', 'transfer')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .order('tanggal', { ascending: false })
        .order('waktu', { ascending: false }),
      supabase
        .from('hutang')
        .select('id, tipe, nama_entitas, total_pinjaman, sisa_tagihan, tanggal_mulai, waktu, status, catatan')
        .gte('tanggal_mulai', startDate)
        .lte('tanggal_mulai', endDate)
        .order('tanggal_mulai', { ascending: false }),
      supabase
        .from('hutang_cicilan')
        .select(`
          id,
          nominal,
          tanggal,
          waktu,
          catatan,
          tipe_hutang_snapshot,
          hutang:hutang_id(id, nama_entitas, tipe)
        `)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .order('tanggal', { ascending: false }),
      supabase
        .from('hutang')
        .select('tipe, sisa_tagihan')
        .gt('sisa_tagihan', 0),
    ]);

  if (transaksiResult.error) throw new Error(transaksiResult.error.message);
  if (hutangResult.error) throw new Error(hutangResult.error.message);
  if (cicilanResult.error) throw new Error(cicilanResult.error.message);
  if (activeHutangResult.error) throw new Error(activeHutangResult.error.message);

  const transaksiRows = (transaksiResult.data as unknown as RekapTransaksiRow[]) ?? [];
  const transaksiUtama = transaksiRows
    .filter((item) => item.tipe === 'income' || item.tipe === 'expense')
    .map(toDetailTransaksi);
  const total_income = transaksiUtama
    .filter((item) => item.tipe === 'income')
    .reduce((sum, item) => sum + item.nominal, 0);
  const total_expense = transaksiUtama
    .filter((item) => item.tipe === 'expense')
    .reduce((sum, item) => sum + item.nominal, 0);

  return {
    bulan,
    tahun,
    startDate,
    endDate,
    daysInMonth,
    total_income,
    total_expense,
    net: total_income - total_expense,
    rata_income_harian: Math.round(total_income / daysInMonth),
    rata_expense_harian: Math.round(total_expense / daysInMonth),
    kategori: buildBreakdown(transaksiUtama, 'kategori'),
    judul: buildBreakdown(transaksiUtama, 'judul'),
    koreksi: buildKoreksi(transaksiRows),
    hutang_piutang: buildHutangPiutang(
      (hutangResult.data as unknown as HutangRow[]) ?? [],
      (cicilanResult.data as unknown as CicilanRow[]) ?? [],
      (activeHutangResult.data as unknown as Pick<HutangRow, 'tipe' | 'sisa_tagihan'>[]) ?? [],
    ),
  };
}

export async function getBudgetWithUsage(bulan: number, tahun: number): Promise<BudgetWithUsage[]> {
  const supabase = await createClient();

  const { startDate, endDate } = getMonthRange(bulan, tahun);

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
    .in('kategori_id', budgets.map((b) => b.kategori_id));

  const usage: Record<string, number> = {};
  (transaksi as { nominal: number; kategori_id: string }[] ?? []).forEach((t) => {
    usage[t.kategori_id] = (usage[t.kategori_id] || 0) + Number(t.nominal);
  });

  return (budgets as unknown as {
    id: string;
    kategori_id: string;
    limit_nominal: number;
    kategori: { nama: string; ikon: string } | null;
  }[]).map((b) => {
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
