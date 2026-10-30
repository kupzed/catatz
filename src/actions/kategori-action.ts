'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Kategori, KategoriUsageCounts } from '@/types/transaksi';
import { getKategoriSchema, type KategoriSchema } from '@/validations/kategori-validation';
import { getActionLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/types';

function formatKategoriUsageParts(usage: KategoriUsageCounts, locale: Locale = 'id'): string[] {
  if (locale === 'en') {
    return [
      usage.transaksi > 0 ? `${usage.transaksi} transaction(s)` : null,
      usage.budget > 0 ? `${usage.budget} monthly budget(s)` : null,
      usage.recurring > 0 ? `${usage.recurring} recurring template(s)` : null,
    ].filter(Boolean) as string[];
  }

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

  const usageMap: Record<string, KategoriUsageCounts> = {};

  const ensureEntry = (id: string): KategoriUsageCounts => {
    if (!usageMap[id]) {
      usageMap[id] = {
        transaksi: 0,
        transaksi_masuk: 0,
        transaksi_keluar: 0,
        budget: 0,
        recurring: 0,
        total: 0,
      };
    }
    return usageMap[id];
  };

  for (const item of txRes.data ?? []) {
    if (!item.kategori_id) continue;
    const entry = ensureEntry(item.kategori_id);
    entry.transaksi += 1;
    if (item.tipe === 'income') entry.transaksi_masuk += 1;
    if (item.tipe === 'expense') entry.transaksi_keluar += 1;
    entry.total += 1;
  }

  for (const item of budgetRes.data ?? []) {
    if (!item.kategori_id) continue;
    const entry = ensureEntry(item.kategori_id);
    entry.budget += 1;
    entry.total += 1;
  }

  for (const item of recurringRes.data ?? []) {
    if (!item.kategori_id) continue;
    const entry = ensureEntry(item.kategori_id);
    entry.recurring += 1;
    entry.total += 1;
  }

  return usageMap;
}

export async function getKategoriById(
  id: string
): Promise<ActionResult<{ kategori: Kategori; usage: KategoriUsageCounts }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getActionLocale(supabase, user?.id);
  const dict = await getDictionary(locale);

  if (!user) {
    return { success: false, error: dict.errors.unauthenticated };
  }

  const { data: kategori, error: fetchError } = await supabase
    .from('kategori')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !kategori) {
    return { success: false, error: dict.actions.kategori.notFound };
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
  const locale = await getActionLocale(supabase, user?.id);
  const dict = await getDictionary(locale);

  if (!user) {
    return { success: false, error: dict.errors.unauthenticated };
  }

  // Validasi schema server-side
  const parsed = getKategoriSchema(dict).safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? dict.actions.kategori.invalidData,
    };
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
  const locale = await getActionLocale(supabase, user?.id);
  const dict = await getDictionary(locale);

  if (!user) {
    return { success: false, error: dict.errors.unauthenticated };
  }

  // Validasi schema server-side
  const parsed = getKategoriSchema(dict).safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? dict.actions.kategori.invalidData,
    };
  }

  // Cek apakah tipe kategori berubah
  const { data: existing, error: fetchError } = await supabase
    .from('kategori')
    .select('tipe')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return { success: false, error: dict.actions.kategori.notFoundOrUnauthorized };
    }
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
        const targetLabel = parsed.data.tipe === 'income' ? dict.transactions.types.income : dict.transactions.types.expense;
        const currentLabel = incompatibleTipe === 'income' ? dict.transactions.types.income.toLowerCase() : dict.transactions.types.expense.toLowerCase();
        const errorMessage = locale === 'en'
          ? `Category type cannot be changed to "${targetLabel}" because ${count} ${currentLabel} transactions are still using this category.`
          : `Tipe kategori tidak bisa diubah ke "${targetLabel}" karena masih ada ${count} transaksi ${currentLabel} yang menggunakan kategori ini.`;
        return {
          success: false,
          error: errorMessage,
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
        const errorMessage = locale === 'en'
          ? `Category type cannot be changed because ${recurringCount} recurring transaction templates are still using this category.`
          : `Tipe kategori tidak bisa diubah karena masih ada ${recurringCount} template transaksi berulang yang menggunakan kategori ini.`;
        return {
          success: false,
          error: errorMessage,
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
      return { success: false, error: dict.actions.kategori.notAllowed };
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
  const locale = await getActionLocale(supabase, user?.id);
  const dict = await getDictionary(locale);

  if (!user) {
    return { success: false, error: dict.errors.unauthenticated };
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
    }, locale);
    const detail = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    const errorMessage = locale === 'en'
      ? `This category is still used by ${totalUsage} financial record(s)${detail}. Delete or update related records before deleting this category.`
      : `Kategori ini masih dipakai oleh ${totalUsage} data keuangan${detail}. Hapus atau ubah data terkait terlebih dahulu sebelum menghapus kategori.`;
    return {
      success: false,
      error: errorMessage,
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
