'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import type { Transaksi, TransaksiFormValues, TransaksiFilter, Kategori } from '@/types/transaksi';

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
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false });

  if (filter.tipe && filter.tipe !== 'all') {
    query = query.eq('tipe', filter.tipe);
  }
  if (filter.rekening_id) {
    query = query.eq('rekening_id', filter.rekening_id);
  }
  if (filter.kategori_id) {
    query = query.eq('kategori_id', filter.kategori_id);
  }
  if (filter.dari) {
    query = query.gte('tanggal', filter.dari);
  }
  if (filter.sampai) {
    query = query.lte('tanggal', filter.sampai);
  }
  if (filter.q) {
    query = query.ilike('catatan', `%${filter.q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Transaksi[]) ?? [];
}

export async function createTransaksi(values: TransaksiFormValues): Promise<ActionResult<Transaksi>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi' };

  const { data, error } = await supabase
    .from('transaksi')
    .insert({ user_id: user.id, ...values })
    .select()
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

  const { data, error } = await supabase
    .from('transaksi')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/transaksi');
  revalidatePath('/rekening');
  revalidatePath('/rekap');
  return { success: true, data: data as Transaksi };
}

export async function deleteTransaksi(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('transaksi').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/transaksi');
  revalidatePath('/rekening');
  revalidatePath('/rekap');
  return { success: true };
}

/**
 * Smart auto-categorization: given a catatan text, find the most frequently used
 * category for similar transactions from the user's history.
 */
export async function suggestKategori(catatan: string): Promise<string | null> {
  const supabase = await createClient();
  const words = catatan.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return null;

  // Try to find a frequently used category for similar notes
  const { data } = await supabase
    .from('transaksi')
    .select('kategori_id, catatan')
    .not('kategori_id', 'is', null)
    .ilike('catatan', `%${words[0]}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return null;

  // Count frequency of each category_id
  const freq: Record<string, number> = {};
  data.forEach((t) => {
    if (t.kategori_id) {
      freq[t.kategori_id] = (freq[t.kategori_id] || 0) + 1;
    }
  });

  const topCategory = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return topCategory ? topCategory[0] : null;
}

/**
 * Returns unique transaction names (catatan) based on a query,
 * along with the most frequently used category for that name.
 */
export async function getNamaSuggestions(query: string): Promise<Array<{ catatan: string, kategori_id: string | null }>> {
  if (!query || query.length < 2) return [];
  
  const supabase = await createClient();
  
  // Get latest 50 matches
  const { data } = await supabase
    .from('transaksi')
    .select('catatan, kategori_id')
    .ilike('catatan', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (!data) return [];
  
  // Group by exact catatan to find unique ones and their most common category
  const grouped: Record<string, Record<string, number>> = {};
  data.forEach((t) => {
    if (!t.catatan) return;
    const cat = t.catatan.trim();
    if (!grouped[cat]) grouped[cat] = {};
    if (t.kategori_id) {
      grouped[cat][t.kategori_id] = (grouped[cat][t.kategori_id] || 0) + 1;
    }
  });
  
  // Map back to array
  const suggestions = Object.keys(grouped).map(catatan => {
    const categories = grouped[catatan];
    let topCatId = null;
    if (Object.keys(categories).length > 0) {
      topCatId = Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0];
    }
    return { catatan, kategori_id: topCatId };
  });
  
  // Sort by shortest first and return top 5
  return suggestions.sort((a, b) => a.catatan.length - b.catatan.length).slice(0, 5);
}
