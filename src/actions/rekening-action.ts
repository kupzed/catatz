'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Rekening, RekeningFormValues, RekeningUsageCounts } from '@/types/rekening';
import { currentTime } from '@/lib/utils';

function emptyRekeningUsageCounts(): RekeningUsageCounts {
  return {
    transaksi_asal: 0,
    transaksi_tujuan: 0,
    hutang: 0,
    hutang_cicilan: 0,
    recurring_asal: 0,
    recurring_tujuan: 0,
    total: 0,
  };
}

function incrementUsage(
  map: Record<string, RekeningUsageCounts>,
  id: string | null | undefined,
  key: Exclude<keyof RekeningUsageCounts, 'total'>,
) {
  if (!id) return;

  map[id] ??= emptyRekeningUsageCounts();
  map[id][key] += 1;
  map[id].total += 1;
}

function buildRekeningUsageError(usage: RekeningUsageCounts) {
  return `Rekening ini masih dipakai oleh ${usage.total} data keuangan. Hapus transaksi, hutang/piutang, cicilan, atau template transaksi berulang terkait terlebih dahulu.`;
}

async function getSingleRekeningUsageCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  id: string,
): Promise<ActionResult<RekeningUsageCounts>> {
  const [transaksiAsal, transaksiTujuan, hutang, recurringAsal, recurringTujuan] =
    await Promise.all([
      supabase
        .from('transaksi')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('rekening_id', id),
      supabase
        .from('transaksi')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('rekening_tujuan', id),
      supabase
        .from('hutang')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('rekening_id', id),
      supabase
        .from('recurring_transaksi')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('rekening_id', id),
      supabase
        .from('recurring_transaksi')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('rekening_tujuan', id),
    ]);

  for (const result of [
    transaksiAsal,
    transaksiTujuan,
    hutang,
    recurringAsal,
    recurringTujuan,
  ]) {
    if (result.error) {
      return { success: false, error: result.error.message };
    }
  }

  const { data: hutangRows, error: hutangRowsError } = await supabase
    .from('hutang')
    .select('id')
    .eq('user_id', userId);

  if (hutangRowsError) return { success: false, error: hutangRowsError.message };

  let cicilanCount = 0;
  const hutangIds = (hutangRows ?? []).map((item) => item.id);

  if (hutangIds.length > 0) {
    const { count, error } = await supabase
      .from('hutang_cicilan')
      .select('id', { count: 'exact', head: true })
      .in('hutang_id', hutangIds)
      .eq('rekening_id', id);

    if (error) return { success: false, error: error.message };
    cicilanCount = count ?? 0;
  }

  const data: RekeningUsageCounts = {
    transaksi_asal: transaksiAsal.count ?? 0,
    transaksi_tujuan: transaksiTujuan.count ?? 0,
    hutang: hutang.count ?? 0,
    hutang_cicilan: cicilanCount,
    recurring_asal: recurringAsal.count ?? 0,
    recurring_tujuan: recurringTujuan.count ?? 0,
    total:
      (transaksiAsal.count ?? 0) +
      (transaksiTujuan.count ?? 0) +
      (hutang.count ?? 0) +
      cicilanCount +
      (recurringAsal.count ?? 0) +
      (recurringTujuan.count ?? 0),
  };

  return { success: true, data };
}

export async function getRekening(): Promise<Rekening[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rekening')
    .select('*')
    .order('urutan', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Rekening[]) ?? [];
}

export async function getRekeningUsageCountsMap(): Promise<Record<string, RekeningUsageCounts>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const [transaksi, hutang, recurring] = await Promise.all([
    supabase
      .from('transaksi')
      .select('rekening_id, rekening_tujuan')
      .eq('user_id', user.id),
    supabase
      .from('hutang')
      .select('id, rekening_id')
      .eq('user_id', user.id),
    supabase
      .from('recurring_transaksi')
      .select('rekening_id, rekening_tujuan')
      .eq('user_id', user.id),
  ]);

  if (transaksi.error) throw new Error(transaksi.error.message);
  if (hutang.error) throw new Error(hutang.error.message);
  if (recurring.error) throw new Error(recurring.error.message);

  const usageMap: Record<string, RekeningUsageCounts> = {};

  for (const item of transaksi.data ?? []) {
    incrementUsage(usageMap, item.rekening_id, 'transaksi_asal');
    incrementUsage(usageMap, item.rekening_tujuan, 'transaksi_tujuan');
  }

  const hutangIds = (hutang.data ?? []).map((item) => item.id);
  for (const item of hutang.data ?? []) {
    incrementUsage(usageMap, item.rekening_id, 'hutang');
  }

  if (hutangIds.length > 0) {
    const { data, error } = await supabase
      .from('hutang_cicilan')
      .select('rekening_id')
      .in('hutang_id', hutangIds);

    if (error) throw new Error(error.message);

    for (const item of data ?? []) {
      incrementUsage(usageMap, item.rekening_id, 'hutang_cicilan');
    }
  }

  for (const item of recurring.data ?? []) {
    incrementUsage(usageMap, item.rekening_id, 'recurring_asal');
    incrementUsage(usageMap, item.rekening_tujuan, 'recurring_tujuan');
  }

  return usageMap;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  const usage = await getSingleRekeningUsageCounts(supabase, user.id, id);
  if (!usage.success || !usage.data) {
    return { success: false, error: usage.error ?? 'Gagal memeriksa pemakaian rekening' };
  }

  if (usage.data.total > 0) {
    return { success: false, error: buildRekeningUsageError(usage.data) };
  }

  const { error } = await supabase
    .from('rekening')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
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
