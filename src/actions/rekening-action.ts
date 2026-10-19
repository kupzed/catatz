'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Rekening, RekeningFormValues, RekeningUsageCounts } from '@/types/rekening';
import { currentTime } from '@/lib/utils';
import {
  rekeningCreateSchema,
  rekeningEditSchema,
  rekeningIdParamSchema,
} from '@/validations/rekening-validation';

function emptyRekeningUsageCounts(): RekeningUsageCounts {
  return {
    transaksi_masuk: 0,
    transaksi_keluar: 0,
    transfer_keluar: 0,
    transfer_masuk: 0,
    koreksi_saldo: 0,
    hutang: 0,
    hutang_cicilan: 0,
    recurring_asal: 0,
    recurring_tujuan: 0,
    transaksi_asal: 0,
    transaksi_tujuan: 0,
    total: 0,
  };
}

function incrementUsage(
  map: Record<string, RekeningUsageCounts>,
  id: string | null | undefined,
  key: Exclude<keyof RekeningUsageCounts, 'total' | 'transaksi_asal' | 'transaksi_tujuan'>,
) {
  if (!id) return;

  map[id] ??= emptyRekeningUsageCounts();
  map[id][key] += 1;
  map[id].total += 1;
}

function formatRekeningUsageParts(usage: RekeningUsageCounts): string[] {
  return [
    usage.transaksi_masuk > 0
      ? `${usage.transaksi_masuk} transaksi pemasukan`
      : null,
    usage.transaksi_keluar > 0
      ? `${usage.transaksi_keluar} transaksi pengeluaran`
      : null,
    usage.transfer_keluar > 0
      ? `${usage.transfer_keluar} transfer keluar`
      : null,
    usage.transfer_masuk > 0
      ? `${usage.transfer_masuk} transfer masuk`
      : null,
    usage.koreksi_saldo > 0
      ? `${usage.koreksi_saldo} koreksi saldo`
      : null,
    usage.hutang > 0 ? `${usage.hutang} hutang/piutang` : null,
    usage.hutang_cicilan > 0
      ? `${usage.hutang_cicilan} cicilan hutang/piutang`
      : null,
    usage.recurring_asal > 0
      ? `${usage.recurring_asal} transaksi berulang`
      : null,
    usage.recurring_tujuan > 0
      ? `${usage.recurring_tujuan} transfer berulang`
      : null,
  ].filter(Boolean) as string[];
}

function buildRekeningUsageError(usage: RekeningUsageCounts) {
  const parts = formatRekeningUsageParts(usage);
  const detail = parts.length > 0 ? ` (${parts.join(', ')})` : '';
  return `Rekening ini masih dipakai oleh ${usage.total} data keuangan${detail}. Hapus data terkait terlebih dahulu sebelum menghapus rekening.`;
}

async function getSingleRekeningUsageCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  id: string,
): Promise<ActionResult<RekeningUsageCounts>> {
  const [
    transaksiIncome,
    transaksiExpense,
    transferKeluar,
    transferMasuk,
    koreksiSaldo,
    hutang,
    recurringAsal,
    recurringTujuan,
  ] = await Promise.all([
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('rekening_id', id)
      .eq('tipe', 'income'),
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('rekening_id', id)
      .eq('tipe', 'expense'),
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('rekening_id', id)
      .eq('tipe', 'transfer'),
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tipe', 'transfer')
      .eq('rekening_tujuan', id),
    supabase
      .from('transaksi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('rekening_id', id)
      .eq('tipe', 'correction'),
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
    transaksiIncome,
    transaksiExpense,
    transferKeluar,
    transferMasuk,
    koreksiSaldo,
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

  const countIncome = transaksiIncome.count ?? 0;
  const countExpense = transaksiExpense.count ?? 0;
  const countTransferKeluar = transferKeluar.count ?? 0;
  const countTransferMasuk = transferMasuk.count ?? 0;
  const countCorrection = koreksiSaldo.count ?? 0;
  const countHutang = hutang.count ?? 0;
  const countRecurringAsal = recurringAsal.count ?? 0;
  const countRecurringTujuan = recurringTujuan.count ?? 0;

  const data: RekeningUsageCounts = {
    transaksi_masuk: countIncome,
    transaksi_keluar: countExpense,
    transfer_keluar: countTransferKeluar,
    transfer_masuk: countTransferMasuk,
    koreksi_saldo: countCorrection,
    hutang: countHutang,
    hutang_cicilan: cicilanCount,
    recurring_asal: countRecurringAsal,
    recurring_tujuan: countRecurringTujuan,
    transaksi_asal: countIncome + countExpense + countTransferKeluar + countCorrection,
    transaksi_tujuan: countTransferMasuk,
    total:
      countIncome +
      countExpense +
      countTransferKeluar +
      countTransferMasuk +
      countCorrection +
      countHutang +
      cicilanCount +
      countRecurringAsal +
      countRecurringTujuan,
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

export async function getRekeningById(
  id: string,
): Promise<ActionResult<{ rekening: Rekening; usage: RekeningUsageCounts }>> {
  const parsedId = rekeningIdParamSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: parsedId.error.issues[0]?.message ?? 'ID rekening tidak valid',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: rekening, error } = await supabase
    .from('rekening')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !rekening) {
    return {
      success: false,
      error: error?.message ?? 'Rekening tidak ditemukan',
    };
  }

  const usageRes = await getSingleRekeningUsageCounts(supabase, user.id, id);
  if (!usageRes.success || !usageRes.data) {
    return {
      success: false,
      error: usageRes.error ?? 'Gagal menghitung pemakaian rekening',
    };
  }

  return {
    success: true,
    data: {
      rekening: rekening as Rekening,
      usage: usageRes.data,
    },
  };
}

export async function fetchAllUserTransaksiUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const PAGE_SIZE = 1000;
  let from = 0;
  const allRows: { tipe: string; rekening_id: string | null; rekening_tujuan: string | null }[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('transaksi')
      .select('tipe, rekening_id, rekening_tujuan')
      .eq('user_id', userId)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}

export async function fetchAllUserHutangUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const PAGE_SIZE = 1000;
  let from = 0;
  const allRows: { id: string; rekening_id: string }[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('hutang')
      .select('id, rekening_id')
      .eq('user_id', userId)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}

export async function fetchAllHutangCicilanUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hutangIds: string[],
) {
  if (hutangIds.length === 0) return [];
  const allRows: { rekening_id: string }[] = [];
  const CHUNK_SIZE = 100;
  const PAGE_SIZE = 1000;

  for (let i = 0; i < hutangIds.length; i += CHUNK_SIZE) {
    const chunk = hutangIds.slice(i, i + CHUNK_SIZE);
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('hutang_cicilan')
        .select('rekening_id')
        .in('hutang_id', chunk)
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;

      allRows.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }

  return allRows;
}

export async function getRekeningUsageCountsMap(): Promise<Record<string, RekeningUsageCounts>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const [transaksiRows, hutangRows, recurring] = await Promise.all([
    fetchAllUserTransaksiUsage(supabase, user.id),
    fetchAllUserHutangUsage(supabase, user.id),
    supabase
      .from('recurring_transaksi')
      .select('rekening_id, rekening_tujuan')
      .eq('user_id', user.id),
  ]);

  if (recurring.error) throw new Error(recurring.error.message);

  const usageMap: Record<string, RekeningUsageCounts> = {};

  for (const item of transaksiRows) {
    if (item.tipe === 'income') {
      incrementUsage(usageMap, item.rekening_id, 'transaksi_masuk');
    } else if (item.tipe === 'expense') {
      incrementUsage(usageMap, item.rekening_id, 'transaksi_keluar');
    } else if (item.tipe === 'correction') {
      incrementUsage(usageMap, item.rekening_id, 'koreksi_saldo');
    } else if (item.tipe === 'transfer') {
      incrementUsage(usageMap, item.rekening_id, 'transfer_keluar');
      incrementUsage(usageMap, item.rekening_tujuan, 'transfer_masuk');
      if (item.rekening_tujuan && usageMap[item.rekening_tujuan]) {
        usageMap[item.rekening_tujuan].transaksi_tujuan += 1;
      }
    }
    if (item.rekening_id && usageMap[item.rekening_id]) {
      usageMap[item.rekening_id].transaksi_asal += 1;
    }
  }

  const hutangIds = hutangRows.map((item) => item.id);
  for (const item of hutangRows) {
    incrementUsage(usageMap, item.rekening_id, 'hutang');
  }

  if (hutangIds.length > 0) {
    const cicilanRows = await fetchAllHutangCicilanUsage(supabase, hutangIds);
    for (const item of cicilanRows) {
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

  // Validasi schema server-side
  const parsed = rekeningCreateSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data rekening tidak valid' };
  }

  const { data, error } = await supabase
    .from('rekening')
    .insert({
      user_id: user.id,
      ...parsed.data,
      saldo_saat_ini: parsed.data.saldo_awal,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/wallets');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  return { success: true, data: data as Rekening };
}

export async function updateRekening(
  id: string,
  values: Partial<RekeningFormValues & { saldo_saat_ini?: number }>
): Promise<ActionResult<Rekening>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  // Validasi schema server-side (gunakan editSchema yang mengizinkan saldo_saat_ini)
  const parsed = rekeningEditSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data rekening tidak valid' };
  }

  // Jika user mengubah saldo_saat_ini → buat transaksi koreksi dengan tipe 'correction'
  if (parsed.data.saldo_saat_ini !== undefined) {
    const { data: oldData, error: fetchError } = await supabase
      .from('rekening')
      .select('saldo_saat_ini')
      .eq('id', id)
      .single();

    if (fetchError) return { success: false, error: fetchError.message };

    const oldSaldo = Number(oldData?.saldo_saat_ini ?? 0);
    const newSaldo = Number(parsed.data.saldo_saat_ini);

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
  const { saldo_saat_ini: _saldo_saat_ini, saldo_awal: _saldo_awal, ...otherValues } = parsed.data as typeof values;

  const { data, error } = await supabase
    .from('rekening')
    .update({ ...otherValues, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/wallets');
  revalidatePath(`/wallets/${id}`);
  revalidatePath('/transactions');
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
  revalidatePath('/wallets');
  revalidatePath(`/wallets/${id}`);
  revalidatePath('/transactions');
  return { success: true };
}

export async function toggleExcludeTotal(id: string, exclude: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('rekening')
    .update({ exclude_total: exclude, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/wallets');
  revalidatePath(`/wallets/${id}`);
  return { success: true };
}
