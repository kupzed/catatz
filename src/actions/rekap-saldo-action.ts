'use server';

import { createClient } from '@/configs/supabase/server';
import { fetchAllRows } from '@/lib/supabase-fetch';
import type { ActionResult } from '@/types/general';
import { addDays } from '@/lib/rekap-period';
import {
  calculateSaldoForPeriods,
  type LedgerData,
  type PeriodSaldoResult,
  type RekeningBalanceItem,
  type LedgerTransaksiItem,
  type LedgerHutangItem,
  type LedgerCicilanItem,
} from '@/lib/rekap-balance';
import { getActionLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';

export type RekapSaldoPeriodInput = {
  startDate?: string;
  endDate?: string;
  dari?: string;
  sampai?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  [key: string]: unknown;
};

/**
 * Mengambil saldo awal dan saldo akhir historis untuk daftar periode
 * menggunakan metode hitung mundur ledger (Keputusan D7).
 *
 * Mengoptimalkan query database dengan hanya mengambil rekaman
 * bertanggal > (awal terlama - 1 hari).
 */
export async function getSaldoPeriodeList<P extends RekapSaldoPeriodInput>(
  periods: P[],
): Promise<ActionResult<(P & PeriodSaldoResult)[]>> {
  try {
    if (!Array.isArray(periods) || periods.length === 0) {
      return { success: true, data: [] };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getActionLocale(supabase, user?.id);
    const dict = await getDictionary(locale);

    if (!user) {
      return { success: false, error: dict.errors.unauthenticated };
    }

    // Normalisasi periode input
    const normalized = periods.map((p) => {
      const startDate = String(p.startDate ?? p.dari ?? p.tanggal_mulai ?? '');
      const endDate = String(p.endDate ?? p.sampai ?? p.tanggal_selesai ?? '');
      return {
        ...p,
        startDate,
        endDate,
      };
    });

    // Cari tanggal awal paling lama (earliestStartDate)
    let earliestStartDate = normalized[0].startDate;
    for (const p of normalized) {
      if (p.startDate && p.startDate < earliestStartDate) {
        earliestStartDate = p.startDate;
      }
    }

    // Hanya ambil transaksi/hutang/cicilan bertanggal > (earliestStartDate - 1 hari)
    const cutoffDate = addDays(earliestStartDate, -1);

    // 1. Ambil rekening user
    const { data: rekeningData, error: rekeningError } = await supabase
      .from('rekening')
      .select('id, saldo_saat_ini, exclude_total')
      .eq('user_id', user.id);

    if (rekeningError) {
      return { success: false, error: rekeningError.message };
    }

    // 2. Ambil transaksi, hutang, dan cicilan yang relevan (> cutoffDate)
    const txQuery = supabase
      .from('transaksi')
      .select('id, tipe, nominal, tanggal, rekening_id, rekening_tujuan, tags')
      .eq('user_id', user.id)
      .gt('tanggal', cutoffDate)
      .order('tanggal', { ascending: true });

    const hutangQuery = supabase
      .from('hutang')
      .select('id, tipe, total_pinjaman, tanggal_mulai, rekening_id')
      .eq('user_id', user.id)
      .gt('tanggal_mulai', cutoffDate)
      .order('tanggal_mulai', { ascending: true });

    const cicilanQuery = supabase
      .from('hutang_cicilan')
      .select(`
        id,
        nominal,
        tanggal,
        tipe_hutang_snapshot,
        rekening_id,
        hutang:hutang_id(tipe)
      `)
      .gt('tanggal', cutoffDate)
      .order('tanggal', { ascending: true });

    const [transaksiList, hutangList, cicilanList] = await Promise.all([
      fetchAllRows<LedgerTransaksiItem>(txQuery),
      fetchAllRows<LedgerHutangItem>(hutangQuery),
      fetchAllRows<LedgerCicilanItem>(cicilanQuery),
    ]);

    const ledgerData: LedgerData = {
      rekening: (rekeningData as unknown as RekeningBalanceItem[]) ?? [],
      transaksi: transaksiList,
      hutang: hutangList,
      cicilan: cicilanList,
    };

    // Hitung saldo mundur menggunakan pure engine
    const results = calculateSaldoForPeriods(normalized, ledgerData);

    return { success: true, data: results };
  } catch (err) {
    const locale = await getActionLocale();
    const dict = await getDictionary(locale);
    const message =
      err instanceof Error
        ? err.message
        : dict.actions.rekap.calculateSaldoError;
    return { success: false, error: message };
  }
}
