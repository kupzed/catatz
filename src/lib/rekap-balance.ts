/**
 * Pure Rekap Balance Calculation Engine (Keputusan D7)
 *
 * Menghitung saldo akhir dan saldo awal historis menggunakan metode "Ledger Mundur":
 * Saldo akhir pada tanggal T = Total saldo_saat_ini seluruh rekening aktif (exclude_total=false)
 * dikurangi seluruh delta ledger bertanggal > T yang mengenai rekening tersebut.
 *
 * Saldo awal periode = Saldo akhir pada hari H-1 sebelum periode dimulai (addDays(startDate, -1)).
 *
 * Murni komputasi integer/number tanpa import database, server, atau timezone date conversions.
 */

import { addDays } from "@/lib/rekap-period";

export type RekeningBalanceItem = {
  id: string;
  saldo_saat_ini: number | string;
  exclude_total?: boolean;
};

export type LedgerTransaksiItem = {
  id?: string;
  tipe: "income" | "expense" | "transfer" | "correction" | string;
  nominal: number | string;
  tanggal: string; // YYYY-MM-DD
  rekening_id?: string | null;
  rekening_tujuan?: string | null;
  tags?: string[] | null;
};

export type LedgerHutangItem = {
  id?: string;
  tipe: "memberi" | "menerima" | string;
  total_pinjaman: number | string;
  tanggal_mulai: string; // YYYY-MM-DD
  rekening_id?: string | null;
};

export type LedgerCicilanItem = {
  id?: string;
  nominal: number | string;
  tanggal: string; // YYYY-MM-DD
  tipe_hutang_snapshot?: "memberi" | "menerima" | string;
  jenis_transaksi?: "pembayaran" | "pinjaman" | string;
  rekening_id?: string | null;
  hutang?: {
    tipe?: "memberi" | "menerima" | string;
    rekening_id?: string | null;
  } | null;
};

export type LedgerData = {
  rekening: RekeningBalanceItem[];
  transaksi?: LedgerTransaksiItem[];
  hutang?: LedgerHutangItem[];
  cicilan?: LedgerCicilanItem[];
};

export type PeriodSaldoResult = {
  startDate: string;
  endDate: string;
  saldo_awal: number;
  saldo_akhir: number;
};

/**
 * Menghitung dampak (delta) transaksi terhadap total saldo rekening yang disertakan.
 */
function calculateTransaksiDelta(
  t: LedgerTransaksiItem,
  includedIds: Set<string>,
): number {
  const nominal = Number(t.nominal) || 0;
  if (nominal <= 0) return 0;

  if (t.tipe === "income") {
    if (t.rekening_id && includedIds.has(t.rekening_id)) {
      return nominal;
    }
    return 0;
  }

  if (t.tipe === "expense") {
    if (t.rekening_id && includedIds.has(t.rekening_id)) {
      return -nominal;
    }
    return 0;
  }

  if (t.tipe === "transfer") {
    let delta = 0;
    // Asal berkurang
    if (t.rekening_id && includedIds.has(t.rekening_id)) {
      delta -= nominal;
    }
    // Tujuan bertambah
    if (t.rekening_tujuan && includedIds.has(t.rekening_tujuan)) {
      delta += nominal;
    }
    return delta;
  }

  if (t.tipe === "correction") {
    if (t.rekening_id && includedIds.has(t.rekening_id)) {
      if (t.tags?.includes("correction_sub")) {
        return -nominal;
      }
      return nominal;
    }
    return 0;
  }

  return 0;
}

/**
 * Menghitung dampak (delta) pencatatan hutang/piutang baru terhadap total saldo rekening yang disertakan.
 * Sesuai trigger public.update_saldo_rekening_hutang:
 * - menerima: saldo bertambah (+total_pinjaman)
 * - memberi: saldo berkurang (-total_pinjaman)
 */
function calculateHutangDelta(
  h: LedgerHutangItem,
  includedIds: Set<string>,
): number {
  if (!h.rekening_id || !includedIds.has(h.rekening_id)) {
    return 0;
  }

  const nominal = Number(h.total_pinjaman) || 0;
  if (nominal <= 0) return 0;

  if (h.tipe === "menerima") {
    return nominal;
  }
  if (h.tipe === "memberi") {
    return -nominal;
  }

  return 0;
}

/**
 * Menghitung dampak (delta) pembayaran cicilan terhadap total saldo rekening yang disertakan.
 * Sesuai trigger public.update_saldo_rekening_cicilan (migration 011):
 * - snapshot menerima (bayar cicilan hutang): saldo berkurang (-nominal)
 * - snapshot memberi (terima pelunasan/cicilan piutang): saldo bertambah (+nominal)
 */
function calculateCicilanDelta(
  c: LedgerCicilanItem,
  includedIds: Set<string>,
): number {
  if (!c.rekening_id || !includedIds.has(c.rekening_id)) {
    return 0;
  }

  const nominal = Number(c.nominal) || 0;
  if (nominal <= 0) return 0;

  const tipe = c.tipe_hutang_snapshot ?? c.hutang?.tipe;
  const isPinjaman = c.jenis_transaksi === "pinjaman";

  if (isPinjaman) {
    // Pinjaman baru: menerima = uang masuk (+), memberi = uang keluar (-)
    if (tipe === "menerima") {
      return nominal;
    }
    if (tipe === "memberi") {
      return -nominal;
    }
  } else {
    // Pembayaran/cicilan: menerima = bayar hutang (-), memberi = terima piutang (+)
    if (tipe === "menerima") {
      return -nominal;
    }
    if (tipe === "memberi") {
      return nominal;
    }
  }

  return 0;
}

/**
 * Menghitung total saldo pada tanggal T secara mundur:
 * S(T) = Total Saldo Saat Ini (exclude_total=false) - Sum(Delta kejadian bertanggal > T)
 */
export function calculateSaldoAtDate(
  targetDate: string,
  data: LedgerData,
): number {
  const rekeningList = data.rekening ?? [];
  const includedAccounts = rekeningList.filter((r) => !r.exclude_total);
  const includedIds = new Set(includedAccounts.map((r) => r.id));

  const currentTotal = includedAccounts.reduce(
    (sum, r) => sum + (Number(r.saldo_saat_ini) || 0),
    0,
  );

  let deltaAfterTarget = 0;

  // 1. Transaksi bertanggal > targetDate
  for (const t of data.transaksi ?? []) {
    if (t.tanggal && t.tanggal > targetDate) {
      deltaAfterTarget += calculateTransaksiDelta(t, includedIds);
    }
  }

  // 2. Hutang baru bertanggal_mulai > targetDate
  for (const h of data.hutang ?? []) {
    if (h.tanggal_mulai && h.tanggal_mulai > targetDate) {
      deltaAfterTarget += calculateHutangDelta(h, includedIds);
    }
  }

  // 3. Cicilan bertanggal > targetDate
  for (const c of data.cicilan ?? []) {
    if (c.tanggal && c.tanggal > targetDate) {
      deltaAfterTarget += calculateCicilanDelta(c, includedIds);
    }
  }

  return currentTotal - deltaAfterTarget;
}

/**
 * Normalisasi objek periode agar memiliki `startDate` dan `endDate`
 */
function extractPeriodDates(period: Record<string, unknown>): {
  startDate: string;
  endDate: string;
} {
  const startDate = String(
    period.startDate ?? period.dari ?? period.tanggal_mulai ?? "",
  );
  const endDate = String(
    period.endDate ?? period.sampai ?? period.tanggal_selesai ?? "",
  );
  return { startDate, endDate };
}

/**
 * Menghitung saldo_awal dan saldo_akhir untuk daftar periode:
 * - saldo_akhir = calculateSaldoAtDate(endDate)
 * - saldo_awal = calculateSaldoAtDate(addDays(startDate, -1))
 */
export function calculateSaldoForPeriods<P extends Record<string, unknown>>(
  periods: P[],
  data: LedgerData,
): (P & PeriodSaldoResult)[] {
  if (!Array.isArray(periods) || periods.length === 0) {
    return [];
  }

  return periods.map((period) => {
    const { startDate, endDate } = extractPeriodDates(period);

    const saldo_akhir = calculateSaldoAtDate(endDate, data);
    const dayBeforeStart = addDays(startDate, -1);
    const saldo_awal = calculateSaldoAtDate(dayBeforeStart, data);

    return {
      ...period,
      startDate,
      endDate,
      saldo_awal,
      saldo_akhir,
    };
  });
}
