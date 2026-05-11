'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Kategori } from '@/types/transaksi';
import type { KategoriSchema } from '@/validations/kategori-validation';

export async function createKategori(values: KategoriSchema): Promise<ActionResult<Kategori>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const { data, error } = await supabase
    .from('kategori')
    .insert({
      user_id: user.id,
      nama: values.nama,
      ikon: values.ikon,
      warna: values.warna,
      tipe: values.tipe,
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/kategori');
  revalidatePath('/transaksi');
  return { success: true, data };
}

export async function updateKategori(id: string, values: KategoriSchema): Promise<ActionResult<Kategori>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const { data, error } = await supabase
    .from('kategori')
    .update({
      nama: values.nama,
      ikon: values.ikon,
      warna: values.warna,
      tipe: values.tipe,
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

  revalidatePath('/kategori');
  revalidatePath('/transaksi');
  return { success: true, data };
}

export async function deleteKategori(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
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

  revalidatePath('/kategori');
  revalidatePath('/transaksi');
  return { success: true };
}
