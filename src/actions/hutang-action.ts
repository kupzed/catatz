'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import { currentTime, todayISODate } from '@/lib/utils';
import type { ActionResult } from '@/types/general';
import type {
  CicilanFormValues,
  CicilanUpdateValues,
  Hutang,
  HutangFormValues,
} from '@/types/hutang';
import { hutangSchema, cicilanSchema } from '@/validations/hutang-validation';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function revalidateHutangSaldoPaths() {
  revalidatePath('/hutang');
  revalidatePath('/rekening');
}

async function getHutangById(
  supabase: SupabaseServerClient,
  id: string,
): Promise<ActionResult<Hutang>> {
  const { data, error } = await supabase
    .from('hutang')
    .select('*, cicilan:hutang_cicilan(*)')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Hutang };
}

function normalizeOptionalId(value?: string | null) {
  if (!value || value === 'none') return null;
  return value;
}

function normalizeOptionalText(value?: string | null) {
  if (value === undefined) return undefined;
  return value === '' ? null : value;
}

export async function getHutang(): Promise<Hutang[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hutang')
    .select('*, cicilan:hutang_cicilan(*)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Hutang[]) ?? [];
}

export async function createHutang(
  values: HutangFormValues,
): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  // Validasi schema server-side
  const parsed = hutangSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data hutang/piutang tidak valid' };
  }

  const { data, error } = await supabase
    .from('hutang')
    .insert({
      user_id: user.id,
      ...parsed.data,
      rekening_id: normalizeOptionalId(parsed.data.rekening_id),
      tanggal_jatuh_tempo:
        parsed.data.tanggal_jatuh_tempo === '' ? null : parsed.data.tanggal_jatuh_tempo,
      waktu: parsed.data.waktu === '' ? null : parsed.data.waktu,
      catatan: parsed.data.catatan === '' ? null : parsed.data.catatan,
      sisa_tagihan: parsed.data.total_pinjaman,
    })
    .select('*, cicilan:hutang_cicilan(*)')
    .single();

  if (error) return { success: false, error: error.message };

  revalidateHutangSaldoPaths();
  return { success: true, data: data as Hutang };
}

export async function updateHutang(
  id: string,
  values: Partial<HutangFormValues>,
): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();

  // Validasi schema server-side (partial — hanya field yang dikirim)
  const parsed = hutangSchema.partial().safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data hutang/piutang tidak valid' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('hutang')
    .select('tipe')
    .eq('id', id)
    .single();

  if (existingError) return { success: false, error: existingError.message };

  const { data: cicilan, error: cicilanError } = await supabase
    .from('hutang_cicilan')
    .select('nominal')
    .eq('hutang_id', id);

  if (cicilanError) return { success: false, error: cicilanError.message };

  const hasCicilan = (cicilan ?? []).length > 0;

  if (parsed.data.tipe && parsed.data.tipe !== existing?.tipe && hasCicilan) {
    return {
      success: false,
      error:
        'Tipe hutang/piutang tidak bisa diubah setelah memiliki cicilan. Hapus cicilan terlebih dahulu.',
    };
  }

  let sisa_tagihan: number | undefined;
  let status: 'aktif' | 'lunas' | 'overdue' | undefined;

  if (parsed.data.total_pinjaman !== undefined) {
    const total_cicilan = (cicilan ?? []).reduce(
      (acc, curr) => acc + Number(curr.nominal),
      0,
    );
    sisa_tagihan = Math.max(Number(parsed.data.total_pinjaman) - total_cicilan, 0);
    status = sisa_tagihan <= 0 ? 'lunas' : 'aktif';
  }

  const updatePayload = {
    ...parsed.data,
    rekening_id:
      parsed.data.rekening_id === undefined
        ? undefined
        : normalizeOptionalId(parsed.data.rekening_id),
    tanggal_jatuh_tempo:
      parsed.data.tanggal_jatuh_tempo === undefined
        ? undefined
        : parsed.data.tanggal_jatuh_tempo === ''
          ? null
          : parsed.data.tanggal_jatuh_tempo,
    waktu:
      parsed.data.waktu === undefined
        ? undefined
        : parsed.data.waktu === ''
          ? null
          : parsed.data.waktu,
    catatan:
      parsed.data.catatan === undefined
        ? undefined
        : parsed.data.catatan === ''
          ? null
          : parsed.data.catatan,
    ...(sisa_tagihan !== undefined ? { sisa_tagihan, status } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('hutang')
    .update(updatePayload)
    .eq('id', id)
    .select('*, cicilan:hutang_cicilan(*)')
    .single();

  if (error) return { success: false, error: error.message };

  revalidateHutangSaldoPaths();
  return { success: true, data: data as Hutang };
}

export async function deleteHutang(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('hutang').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidateHutangSaldoPaths();
  return { success: true };
}

export async function createCicilan(
  values: CicilanFormValues,
): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();

  // Validasi schema server-side
  const parsed = cicilanSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data cicilan tidak valid' };
  }

  const { error } = await supabase.from('hutang_cicilan').insert({
    ...parsed.data,
    rekening_id: normalizeOptionalId(parsed.data.rekening_id),
    waktu: parsed.data.waktu === '' ? null : parsed.data.waktu,
    catatan: parsed.data.catatan === '' ? null : parsed.data.catatan,
  });

  if (error) return { success: false, error: error.message };

  const refreshed = await getHutangById(supabase, parsed.data.hutang_id);
  if (!refreshed.success) return refreshed;

  revalidateHutangSaldoPaths();
  return refreshed;
}

export async function updateCicilan(
  id: string,
  values: CicilanUpdateValues,
): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from('hutang_cicilan')
    .select('hutang_id')
    .eq('id', id)
    .single();

  if (existingError) return { success: false, error: existingError.message };

  const updatePayload = {
    ...(values.nominal !== undefined ? { nominal: values.nominal } : {}),
    ...(values.tanggal !== undefined ? { tanggal: values.tanggal } : {}),
    ...(values.waktu !== undefined
      ? { waktu: values.waktu === '' ? null : values.waktu }
      : {}),
    ...(values.rekening_id !== undefined
      ? { rekening_id: normalizeOptionalId(values.rekening_id) }
      : {}),
    ...(values.catatan !== undefined
      ? { catatan: normalizeOptionalText(values.catatan) }
      : {}),
  };

  const { error } = await supabase
    .from('hutang_cicilan')
    .update(updatePayload)
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  const refreshed = await getHutangById(supabase, existing.hutang_id);
  if (!refreshed.success) return refreshed;

  revalidateHutangSaldoPaths();
  return refreshed;
}

export async function deleteCicilan(id: string): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from('hutang_cicilan')
    .select('hutang_id')
    .eq('id', id)
    .single();

  if (existingError) return { success: false, error: existingError.message };

  const { error } = await supabase
    .from('hutang_cicilan')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  const refreshed = await getHutangById(supabase, existing.hutang_id);
  if (!refreshed.success) return refreshed;

  revalidateHutangSaldoPaths();
  return refreshed;
}

export async function markHutangLunas(
  id: string,
  rekeningId?: string,
): Promise<ActionResult<Hutang>> {
  const supabase = await createClient();
  const current = await getHutangById(supabase, id);

  if (!current.success || !current.data) return current;
  if (Number(current.data.sisa_tagihan) <= 0) return current;

  return createCicilan({
    hutang_id: id,
    nominal: Number(current.data.sisa_tagihan),
    rekening_id: rekeningId,
    tanggal: todayISODate(),
    waktu: currentTime(),
  });
}
