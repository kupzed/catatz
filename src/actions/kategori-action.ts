'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Kategori } from '@/types/transaksi';
import { kategoriSchema } from '@/validations/kategori-validation';
import type { KategoriSchema } from '@/validations/kategori-validation';

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
    .eq('is_system', false)
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
    .eq('is_system', false)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Tidak diizinkan' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/categories');
  revalidatePath('/transactions');
  return { success: true, data };
}

export async function deleteKategori(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  // Proteksi: cek apakah kategori masih dipakai di transaksi
  const { count: transaksiCount, error: transaksiError } = await supabase
    .from('transaksi')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('kategori_id', id);

  if (transaksiError) return { success: false, error: transaksiError.message };

  if ((transaksiCount ?? 0) > 0) {
    return {
      success: false,
      error: `Kategori ini masih dipakai oleh ${transaksiCount} transaksi. Ubah kategori transaksi tersebut terlebih dahulu sebelum menghapus.`,
    };
  }

  // Proteksi: cek apakah kategori masih dipakai di template transaksi berulang
  const { count: recurringCount, error: recurringError } = await supabase
    .from('recurring_transaksi')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('kategori_id', id);

  if (recurringError) return { success: false, error: recurringError.message };

  if ((recurringCount ?? 0) > 0) {
    return {
      success: false,
      error: `Kategori ini masih dipakai oleh ${recurringCount} template transaksi berulang. Ubah kategori template tersebut terlebih dahulu sebelum menghapus.`,
    };
  }

  const { error } = await supabase
    .from('kategori')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_system', false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/categories');
  revalidatePath('/transactions');
  return { success: true };
}
