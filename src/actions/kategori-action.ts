'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Kategori, KategoriUsageCounts } from '@/types/transaksi';
import { kategoriSchema } from '@/validations/kategori-validation';
import type { KategoriSchema } from '@/validations/kategori-validation';

function formatKategoriUsageParts(usage: KategoriUsageCounts): string[] {
  return [
    usage.transaksi > 0 ? `${usage.transaksi} transaksi` : null,
    usage.budget > 0 ? `${usage.budget} budget bulanan` : null,
    usage.recurring > 0 ? `${usage.recurring} template transaksi berulang` : null,
  ].filter(Boolean) as string[];
}

export async function getKategoriUsageCountsMap(): Promise<Record<string, KategoriUsageCounts>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return {};

  const [txRes, budgetRes, recurringRes] = await Promise.all([
    supabase
      .from('transaksi')
      .select('kategori_id, tipe')
      .eq('user_id', user.id)
      .not('kategori_id', 'is', null),
    supabase
      .from('budget')
      .select('kategori_id')
      .eq('user_id', user.id),
    supabase
      .from('recurring_transaksi')
      .select('kategori_id')
      .eq('user_id', user.id)
      .not('kategori_id', 'is', null),
  ]);

  const map: Record<string, KategoriUsageCounts> = {};

  const getOrCreate = (id: string): KategoriUsageCounts => {
    if (!map[id]) {
      map[id] = {
        transaksi: 0,
        transaksi_masuk: 0,
        transaksi_keluar: 0,
        budget: 0,
        recurring: 0,
        total: 0,
      };
    }
    return map[id];
  };

  if (txRes.data) {
    for (const row of txRes.data) {
      if (row.kategori_id) {
        const item = getOrCreate(row.kategori_id);
        item.transaksi += 1;
        if (row.tipe === 'income') item.transaksi_masuk += 1;
        if (row.tipe === 'expense') item.transaksi_keluar += 1;
        item.total += 1;
      }
    }
  }

  if (budgetRes.data) {
    for (const row of budgetRes.data) {
      if (row.kategori_id) {
        const item = getOrCreate(row.kategori_id);
        item.budget += 1;
        item.total += 1;
      }
    }
  }

  if (recurringRes.data) {
    for (const row of recurringRes.data) {
      if (row.kategori_id) {
        const item = getOrCreate(row.kategori_id);
        item.recurring += 1;
        item.total += 1;
      }
    }
  }

  return map;
}

export async function getKategoriById(
  id: string
): Promise<ActionResult<{ kategori: Kategori; usage: KategoriUsageCounts }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const { data: kategori, error: fetchError } = await supabase
    .from('kategori')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !kategori) {
    return { success: false, error: 'Kategori tidak ditemukan' };
  }

  const [txIncome, txExpense, budgetRes, recurringRes] = await Promise.all([
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kategori_id', id)
      .eq('tipe', 'income'),
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kategori_id', id)
      .eq('tipe', 'expense'),
    supabase
      .from('budget')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kategori_id', id),
    supabase
      .from('recurring_transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kategori_id', id),
  ]);

  const transaksiMasuk = txIncome.count ?? 0;
  const transaksiKeluar = txExpense.count ?? 0;
  const totalTransaksi = transaksiMasuk + transaksiKeluar;
  const budgetCount = budgetRes.count ?? 0;
  const recurringCount = recurringRes.count ?? 0;

  const usage: KategoriUsageCounts = {
    transaksi: totalTransaksi,
    transaksi_masuk: transaksiMasuk,
    transaksi_keluar: transaksiKeluar,
    budget: budgetCount,
    recurring: recurringCount,
    total: totalTransaksi + budgetCount + recurringCount,
  };

  return {
    success: true,
    data: {
      kategori: kategori as Kategori,
      usage,
    },
  };
}

export async function createKategori(values: KategoriSchema): Promise<ActionResult<Kategori>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  // Validasi schema server-side
  const parsed = kategoriSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data kategori tidak valid' };
  }

  const { data, error } = await supabase
    .from('kategori')
    .insert({
      user_id: user.id,
      nama: parsed.data.nama,
      ikon: parsed.data.ikon,
      warna: parsed.data.warna,
      tipe: parsed.data.tipe,
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/categories');
  revalidatePath('/transactions');
  return { success: true, data };
}

export async function updateKategori(id: string, values: KategoriSchema): Promise<ActionResult<Kategori>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  // Validasi schema server-side
  const parsed = kategoriSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data kategori tidak valid' };
  }

  // Cek apakah tipe kategori berubah
  const { data: existing, error: fetchError } = await supabase
    .from('kategori')
    .select('tipe')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') return { success: false, error: 'Kategori tidak ditemukan atau tidak diizinkan' };
    return { success: false, error: fetchError.message };
  }

  // Proteksi: jika tipe berubah dari/ke income/expense (bukan 'all'), cek histori transaksi
  if (parsed.data.tipe !== existing.tipe) {
    // Tipe 'all' kompatibel dengan semua transaksi — perubahan dari/ke 'all' aman
    const isChangingToRestrictedTipe =
      parsed.data.tipe !== 'all' && existing.tipe !== 'all';

    if (isChangingToRestrictedTipe) {
      // Cek apakah ada transaksi dengan tipe yang tidak kompatibel
      const incompatibleTipe = parsed.data.tipe === 'income' ? 'expense' : 'income';
      const { count, error: countError } = await supabase
        .from('transaksi')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('kategori_id', id)
        .eq('tipe', incompatibleTipe);

      if (countError) return { success: false, error: countError.message };

      if ((count ?? 0) > 0) {
        return {
          success: false,
          error: `Tipe kategori tidak bisa diubah ke "${parsed.data.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran'}" karena masih ada ${count} transaksi ${incompatibleTipe === 'income' ? 'pemasukan' : 'pengeluaran'} yang menggunakan kategori ini.`,
        };
      }
    }

    // Cek juga di recurring_transaksi
    if (parsed.data.tipe !== 'all') {
      const incompatibleTipe = parsed.data.tipe === 'income' ? 'expense' : 'income';
      const { count: recurringCount, error: recurringError } = await supabase
        .from('recurring_transaksi')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('kategori_id', id)
        .eq('tipe', incompatibleTipe);

      if (recurringError) return { success: false, error: recurringError.message };

      if ((recurringCount ?? 0) > 0) {
        return {
          success: false,
          error: `Tipe kategori tidak bisa diubah karena masih ada ${recurringCount} template transaksi berulang yang menggunakan kategori ini.`,
        };
      }
    }
  }

  const { data, error } = await supabase
    .from('kategori')
    .update({
      nama: parsed.data.nama,
      ikon: parsed.data.ikon,
      warna: parsed.data.warna,
      tipe: parsed.data.tipe,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Tidak diizinkan' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/categories');
  revalidatePath(`/categories/${id}`);
  revalidatePath('/transactions');
  return { success: true, data };
}

export async function deleteKategori(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  // Proteksi: cek transaksi, budget, dan recurring transaksi
  const [txRes, budgetRes, recurringRes] = await Promise.all([
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kategori_id', id),
    supabase
      .from('budget')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kategori_id', id),
    supabase
      .from('recurring_transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kategori_id', id),
  ]);

  if (txRes.error) return { success: false, error: txRes.error.message };
  if (budgetRes.error) return { success: false, error: budgetRes.error.message };
  if (recurringRes.error) return { success: false, error: recurringRes.error.message };

  const txCount = txRes.count ?? 0;
  const budgetCount = budgetRes.count ?? 0;
  const recurringCount = recurringRes.count ?? 0;
  const totalUsage = txCount + budgetCount + recurringCount;

  if (totalUsage > 0) {
    const parts = formatKategoriUsageParts({
      transaksi: txCount,
      transaksi_masuk: 0,
      transaksi_keluar: 0,
      budget: budgetCount,
      recurring: recurringCount,
      total: totalUsage,
    });
    const detail = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    return {
      success: false,
      error: `Kategori ini masih dipakai oleh ${totalUsage} data keuangan${detail}. Hapus atau ubah data terkait terlebih dahulu sebelum menghapus kategori.`,
    };
  }

  const { error } = await supabase
    .from('kategori')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/categories');
  revalidatePath('/transactions');
  return { success: true };
}
