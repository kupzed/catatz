'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Rekening, RekeningFormValues } from '@/types/rekening';
import { currentTime } from '@/lib/utils';

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
  values: Partial<RekeningFormValues & { saldo_saat_ini?: number }>
): Promise<ActionResult<Rekening>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  // Jika user mengubah saldo_saat_ini → buat transaksi koreksi dengan tipe 'correction'
  if (values.saldo_saat_ini !== undefined) {
    const { data: oldData, error: fetchError } = await supabase
      .from('rekening')
      .select('saldo_saat_ini')
      .eq('id', id)
      .single();

    if (fetchError) return { success: false, error: fetchError.message };

    const oldSaldo = Number(oldData?.saldo_saat_ini ?? 0);
    const newSaldo = Number(values.saldo_saat_ini);

    if (oldSaldo !== newSaldo) {
      const selisih = newSaldo - oldSaldo;

      // Buat transaksi koreksi dengan tipe 'correction'
      // Trigger TIDAK akan memproses tipe ini — saldo diupdate manual di bawah
      // Catatan: field judul dan kategori_id sengaja tidak dikirim (default NULL di DB)
      const { error: insertError } = await supabase.from('transaksi').insert({
        user_id: user.id,
        tipe: 'correction',
        nominal: Math.abs(selisih),
        tanggal: new Date().toISOString().split('T')[0],
        waktu: currentTime(),
        rekening_id: id,
        tags: selisih > 0 ? ["correction_add"] : ["correction_sub"],
      });

      if (insertError) return { success: false, error: `Gagal membuat koreksi: ${insertError.message}` };

      // Langsung update saldo_saat_ini di rekening (trigger tidak memproses correction)
      const { error: saldoError } = await supabase
        .from('rekening')
        .update({ saldo_saat_ini: newSaldo, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (saldoError) return { success: false, error: saldoError.message };
    }
  }

  // Update field rekening lainnya (nama, jenis, warna, logo, exclude_total)
  // Saldo awal TIDAK diubah dari sini — hanya bisa diset saat create
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { saldo_saat_ini: _saldo_saat_ini, saldo_awal: _saldo_awal, ...otherValues } = values;

  const { data, error } = await supabase
    .from('rekening')
    .update({ ...otherValues, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/rekening');
  revalidatePath('/transaksi');
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
