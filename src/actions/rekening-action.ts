'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Rekening, RekeningFormValues } from '@/types/rekening';

export async function getRekening(): Promise<Rekening[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rekening')
    .select('*')
    .order('urutan', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Rekening[]) ?? [];
}

export async function createRekening(values: RekeningFormValues): Promise<ActionResult<Rekening>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  const { data, error } = await supabase
    .from('rekening')
    .insert({
      user_id: user.id,
      ...values,
      saldo_saat_ini: values.saldo_awal,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/rekening');
  revalidatePath('/transaksi');
  return { success: true, data: data as Rekening };
}

export async function updateRekening(
  id: string,
  values: Partial<RekeningFormValues>
): Promise<ActionResult<Rekening>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rekening')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/rekening');
  return { success: true, data: data as Rekening };
}

export async function deleteRekening(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('rekening').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/rekening');
  revalidatePath('/transaksi');
  return { success: true };
}

export async function toggleExcludeTotal(id: string, exclude: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('rekening')
    .update({ exclude_total: exclude, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/rekening');
  return { success: true };
}
