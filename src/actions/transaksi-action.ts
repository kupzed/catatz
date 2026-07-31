'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Transaksi, TransaksiFormValues, TransaksiFilter, Kategori, JudulSuggestion } from '@/types/transaksi';
import { transaksiSchema } from '@/validations/transaksi-validation';

function validateTransaksiValues(values: TransaksiFormValues): ActionResult<TransaksiFormValues> {
  const parsed = transaksiSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Data transaksi tidak valid',
    };
  }

  return { success: true, data: parsed.data as TransaksiFormValues };
}

function toTransaksiPayload(values: TransaksiFormValues) {
  return {
    ...values,
    judul: values.judul?.trim() || null,
    kategori_id: values.kategori_id ?? null,
    rekening_tujuan: values.rekening_tujuan ?? null,
    waktu: values.waktu === '' ? null : values.waktu,
    catatan: values.catatan === '' ? null : values.catatan,
  };
}

function normalizeSearchTerm(value: string) {
  return value.replace(/[%_,()]/g, ' ').trim();
}

export async function getKategori(): Promise<Kategori[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('kategori')
    .select('*')
    .order('nama', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Kategori[]) ?? [];
}

export async function getTransaksi(filter: TransaksiFilter = {}): Promise<Transaksi[]> {
  const supabase = await createClient();

  let query = supabase
    .from('transaksi')
    .select(`
      *,
      kategori:kategori_id(*),
      rekening:rekening_id(id, nama, jenis, logo, warna),
      rekening_tujuan_data:rekening_tujuan(id, nama, jenis, logo, warna)
    `)
    .order(filter.sortBy ?? 'tanggal', { ascending: filter.sortOrder === 'asc' });

  if (!filter.sortBy || filter.sortBy === 'tanggal') {
    query = query.order('waktu', { ascending: filter.sortOrder === 'asc' }).order('created_at', { ascending: filter.sortOrder === 'asc' });
  }

  if (filter.tipe?.length) {
    query = query.in('tipe', filter.tipe);
  }
  if (filter.rekening_id?.length) {
    query = query.in('rekening_id', filter.rekening_id);
  }
  if (filter.kategori_id?.length) {
    query = query.in('kategori_id', filter.kategori_id);
  }
  if (filter.dari) {
    query = query.gte('tanggal', filter.dari);
  }
  if (filter.sampai) {
    query = query.lte('tanggal', filter.sampai);
  }
  if (filter.q) {
    const searchTerm = normalizeSearchTerm(filter.q);

    if (searchTerm) {
      const { data: matchingKategori, error: kategoriError } = await supabase
        .from('kategori')
        .select('id')
        .ilike('nama', `%${searchTerm}%`);

      if (kategoriError) throw new Error(kategoriError.message);

      const categoryIds = (matchingKategori ?? [])
        .map((item) => item.id)
        .filter(Boolean);
      const searchClauses = [
        `catatan.ilike.%${searchTerm}%`,
        `judul.ilike.%${searchTerm}%`,
      ];

      if (categoryIds.length > 0) {
        searchClauses.push(`kategori_id.in.(${categoryIds.join(',')})`);
      }

      query = query.or(searchClauses.join(','));
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Transaksi[]) ?? [];
}

export async function createTransaksi(values: TransaksiFormValues): Promise<ActionResult<Transaksi>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  const validation = validateTransaksiValues(values);
  if (!validation.success || !validation.data) {
    return { success: false, error: validation.error };
  }

  const { data, error } = await supabase
    .from('transaksi')
    .insert({ user_id: user.id, ...toTransaksiPayload(validation.data) })
    .select(`
      *,
      kategori:kategori_id(*),
      rekening:rekening_id(id, nama, jenis, logo, warna),
      rekening_tujuan_data:rekening_tujuan(id, nama, jenis, logo, warna)
    `)
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/transaksi');
  revalidatePath('/rekening');
  revalidatePath('/rekap');
  return { success: true, data: data as Transaksi };
}

export async function updateTransaksi(
  id: string,
  values: Partial<TransaksiFormValues>
): Promise<ActionResult<Transaksi>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  // Ambil data transaksi lama untuk pengecekan tipe 'correction'
  const { data: oldTrx, error: oldTrxError } = await supabase
    .from('transaksi')
    .select('tipe, judul, nominal, tanggal, waktu, kategori_id, rekening_id, rekening_tujuan, catatan, tags, is_recurring')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (oldTrxError || !oldTrx) {
    return { success: false, error: 'Transaksi tidak ditemukan' };
  }

  const mergedValues: TransaksiFormValues = {
    tipe: (values.tipe ?? oldTrx.tipe) as TransaksiFormValues['tipe'],
    judul: values.judul !== undefined ? values.judul : (oldTrx.judul ?? null),
    nominal: Number(values.nominal ?? oldTrx.nominal),
    tanggal: values.tanggal ?? oldTrx.tanggal,
    waktu: values.waktu !== undefined ? values.waktu : (oldTrx.waktu ?? undefined),
    kategori_id:
      values.kategori_id !== undefined
        ? values.kategori_id
        : (oldTrx.kategori_id ?? undefined),
    rekening_id: values.rekening_id ?? oldTrx.rekening_id ?? '',
    rekening_tujuan:
      values.rekening_tujuan !== undefined
        ? values.rekening_tujuan
        : (oldTrx.rekening_tujuan ?? undefined),
    catatan:
      values.catatan !== undefined ? values.catatan : (oldTrx.catatan ?? undefined),
    tags: values.tags ?? oldTrx.tags ?? [],
    is_recurring: values.is_recurring ?? oldTrx.is_recurring ?? false,
  };
  const validation = validateTransaksiValues(mergedValues);
  if (!validation.success || !validation.data) {
    return { success: false, error: validation.error };
  }

  if (oldTrx?.tipe === 'correction' && values.nominal !== undefined && oldTrx.rekening_id) {
    const isAdd = oldTrx.tags?.includes('correction_add');
    const isSub = oldTrx.tags?.includes('correction_sub');
    
    if (isAdd || isSub) {
      const { data: rek } = await supabase
        .from('rekening')
        .select('saldo_saat_ini')
        .eq('id', oldTrx.rekening_id)
        .single();
        
      if (rek) {
        const currentSaldo = Number(rek.saldo_saat_ini);
        const oldNominal = Number(oldTrx.nominal);
        const newNominal = Number(values.nominal);
        
        // Kembalikan saldo ke sebelum koreksi
        const baseSaldo = isAdd ? currentSaldo - oldNominal : currentSaldo + oldNominal;
        // Terapkan koreksi nominal yang baru
        const finalSaldo = isAdd ? baseSaldo + newNominal : baseSaldo - newNominal;
        
        await supabase
          .from('rekening')
          .update({ saldo_saat_ini: finalSaldo, updated_at: new Date().toISOString() })
          .eq('id', oldTrx.rekening_id);
      }
    }
  }

  const { data, error } = await supabase
    .from('transaksi')
    .update({ ...toTransaksiPayload(validation.data), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      *,
      kategori:kategori_id(*),
      rekening:rekening_id(id, nama, jenis, logo, warna),
      rekening_tujuan_data:rekening_tujuan(id, nama, jenis, logo, warna)
    `)
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/transaksi');
  revalidatePath('/rekening');
  revalidatePath('/rekap');
  return { success: true, data: data as Transaksi };
}

export async function deleteTransaksi(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Cek apakah ini transaksi correction — jika ya, balik saldo secara manual (Opsi B)
  const { data: trx } = await supabase
    .from('transaksi')
    .select('tipe, nominal, rekening_id, tags')
    .eq('id', id)
    .single();

  if (trx?.tipe === 'correction' && trx.rekening_id) {
    const isAdd = trx.tags?.includes('correction_add');
    const isSub = trx.tags?.includes('correction_sub');
    
    if (isAdd || isSub) {
      const { data: rek } = await supabase
        .from('rekening')
        .select('saldo_saat_ini')
        .eq('id', trx.rekening_id)
        .single();
        
      if (rek) {
        const currentSaldo = Number(rek.saldo_saat_ini);
        const trxNominal = Number(trx.nominal);
        
        // Reverse correction: jika sebelumnya ditambah, maka sekarang dikurangi
        const revertedSaldo = isAdd ? currentSaldo - trxNominal : currentSaldo + trxNominal;
        
        await supabase
          .from('rekening')
          .update({ saldo_saat_ini: revertedSaldo, updated_at: new Date().toISOString() })
          .eq('id', trx.rekening_id);
      }
    }
  }

  const { error } = await supabase.from('transaksi').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/transaksi');
  revalidatePath('/rekening');
  revalidatePath('/rekap');
  return { success: true };
}

/**
 * Mengembalikan suggestion judul berdasarkan query (debounced dari UI).
 */
export async function getJudulSuggestions(query: string): Promise<JudulSuggestion[]> {
  if (!query || query.length < 1) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from('transaksi')
    .select('judul, kategori_id')
    .not('judul', 'is', null)
    .ilike('judul', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  // Group by judul, ambil kategori_id yang paling sering dipakai
  const grouped: Record<string, Record<string, number>> = {};
  data.forEach((t) => {
    if (!t.judul) return;
    const j = t.judul.trim();
    if (!grouped[j]) grouped[j] = {};
    if (t.kategori_id) {
      grouped[j][t.kategori_id] = (grouped[j][t.kategori_id] || 0) + 1;
    }
  });

  const suggestions: JudulSuggestion[] = Object.keys(grouped).map((judul) => {
    const cats = grouped[judul];
    const topCatId = Object.keys(cats).length > 0
      ? Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0]
      : null;
    return { judul, kategori_id: topCatId };
  });

  return suggestions
    .sort((a, b) => a.judul.localeCompare(b.judul))
    .slice(0, 6);
}

/**
 * Mengembalikan judul-judul transaksi terbaru (tanpa query) untuk initial suggestion.
 */
export async function getRecentJudul(): Promise<JudulSuggestion[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('transaksi')
    .select('judul, kategori_id')
    .not('judul', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!data) return [];

  // Deduplicate: ambil judul unik + kategori terakhir
  const seen = new Map<string, string | null>();
  for (const t of data) {
    if (!t.judul) continue;
    const j = t.judul.trim();
    if (!seen.has(j)) {
      seen.set(j, t.kategori_id ?? null);
    }
  }

  const result: JudulSuggestion[] = [];
  seen.forEach((kategori_id, judul) => {
    result.push({ judul, kategori_id });
  });

  return result.slice(0, 8);
}

/**
 * Smart auto-kategorisasi berdasarkan catatan (legacy — tetap dipertahankan).
 */
export async function suggestKategori(catatan: string): Promise<string | null> {
  const supabase = await createClient();
  const words = catatan.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return null;

  const { data } = await supabase
    .from('transaksi')
    .select('kategori_id, catatan')
    .not('kategori_id', 'is', null)
    .ilike('catatan', `%${words[0]}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return null;

  const freq: Record<string, number> = {};
  data.forEach((t) => {
    if (t.kategori_id) {
      freq[t.kategori_id] = (freq[t.kategori_id] || 0) + 1;
    }
  });

  const topCategory = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return topCategory ? topCategory[0] : null;
}
