'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Hutang, HutangFormValues, HutangCicilan, CicilanFormValues } from '@/types/hutang';

export async function getHutang(): Promise<Hutang[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hutang')
    .select('*, cicilan:hutang_cicilan(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Hutang[]) ?? [];
}

export async function createHutang(values: HutangFormValues): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  const { data, error } = await supabase
    .from('hutang')
    .insert({
      user_id: user.id,
      ...values,
      rekening_id: values.rekening_id === "" ? null : values.rekening_id,
      tanggal_jatuh_tempo: values.tanggal_jatuh_tempo === "" ? null : values.tanggal_jatuh_tempo,
      waktu: values.waktu === "" ? null : values.waktu,
      sisa_tagihan: values.total_pinjaman,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/hutang');
  return { success: true, data: data as Hutang };
}

export async function updateHutang(id: string, values: Partial<HutangFormValues>): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();

  let sisa_tagihan: number | undefined;
  let status: 'aktif' | 'lunas' | 'overdue' | undefined;

  if (values.total_pinjaman !== undefined) {
    const { data: cicilan } = await supabase
      .from('hutang_cicilan')
      .select('nominal')
      .eq('hutang_id', id);
      
    const total_cicilan = (cicilan ?? []).reduce((acc, curr) => acc + curr.nominal, 0);
    sisa_tagihan = Math.max(values.total_pinjaman - total_cicilan, 0);
    status = sisa_tagihan <= 0 ? 'lunas' : 'aktif';
  }

  const { data, error } = await supabase
    .from('hutang')
    .update({ 
      ...values, 
      rekening_id: values.rekening_id === "" ? null : values.rekening_id,
      tanggal_jatuh_tempo: values.tanggal_jatuh_tempo === "" ? null : values.tanggal_jatuh_tempo,
      waktu: values.waktu === "" ? null : values.waktu,
      ...(sisa_tagihan !== undefined ? { sisa_tagihan, status } : {}),
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select('*, cicilan:hutang_cicilan(*)')
    .single();
    
  if (error) return { success: false, error: error.message };
  revalidatePath('/hutang');
  return { success: true, data: data as Hutang };
}

export async function deleteHutang(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('hutang').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/hutang');
  return { success: true };
}

export async function createCicilan(values: CicilanFormValues): Promise<ActionResult<HutangCicilan>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hutang_cicilan')
    .insert({
      ...values,
      rekening_id: values.rekening_id === "" ? null : values.rekening_id,
      waktu: values.waktu === "" ? null : values.waktu,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/hutang');
  return { success: true, data: data as HutangCicilan };
}

export async function deleteCicilan(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('hutang_cicilan').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/hutang');
  return { success: true };
}

export async function markHutangLunas(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('hutang')
    .update({ status: 'lunas', sisa_tagihan: 0, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/hutang');
  return { success: true };
}
