"use server";

import { createClient } from "@/configs/supabase/server";
import { fetchAllRows } from "@/lib/supabase-fetch";
import type { ActionResult } from "@/types/general";
import { formatTanggal, formatWaktu } from "@/lib/utils";
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCE_SELECT,
  normalizeUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";
import { getActionLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";

export type ExportTransaksi = {
  tanggal: string;
  waktu: string;
  tipe: string;
  judul: string;
  nominal: number;
  kategori: string;
  rekening: string;
  rekening_tujuan: string;
  catatan: string;
};

export type ExportSummary = {
  total_income: number;
  total_expense: number;
  net: number;
  count_income: number;
  count_expense: number;
  count_transfer: number;
  periode: string;
  kategori_breakdown: {
    nama: string;
    total: number;
    persentase: number;
    warna: string;
  }[];
};

type RelationOne<T> = T | T[] | null;

type ExportTransaksiRow = {
  tanggal: string;
  waktu: string | null;
  tipe: string;
  judul: string | null;
  nominal: number | string;
  catatan: string | null;
  kategori: RelationOne<{ nama: string | null }>;
  rekening: RelationOne<{ nama: string | null }>;
  rekening_tujuan_data: RelationOne<{ nama: string | null }>;
};

type ExportKategoriRow = {
  nominal: number | string;
  kategori_id: string | null;
  kategori: RelationOne<{ nama: string | null; warna: string | null }>;
};

type CategoryBreakdownItem = {
  nama: string;
  warna: string;
  total: number;
};

function firstRelation<T>(relation: RelationOne<T> | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

async function getAuthenticatedExportContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getActionLocale(supabase, user?.id);
  const dict = await getDictionary(locale);

  if (!user) {
    return { error: dict.errors.unauthenticated } as const;
  }

  return { supabase, user, dict } as const;
}

export type AccountExportSummary = {
  walletsCount: number;
  categoriesCount: number;
  transactionsCount: number;
  debtsCount: number;
  budgetsCount: number;
  customPeriodsCount: number;
};

export type AccountBackupPayload = {
  metadata: {
    app: "CatatZ";
    schemaVersion: "1.0";
    exportedAt: string;
  };
  account: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    currency: string | null;
    locale: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  preferences: UserPreferences;
  data: {
    rekening: Record<string, unknown>[];
    kategori: Record<string, unknown>[];
    transaksi: Record<string, unknown>[];
    hutang: Record<string, unknown>[];
    budget: Record<string, unknown>[];
    rekap_periode_custom: Record<string, unknown>[];
  };
  summary: AccountExportSummary;
};

export async function getExportData(filter?: {
  dari?: string;
  sampai?: string;
}): Promise<
  ActionResult<{
    transaksi: ExportTransaksi[];
    summary: ExportSummary;
    userName: string;
    preferences: UserPreferences;
  }>
> {
  const ctx = await getAuthenticatedExportContext();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user, dict } = ctx;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const userName =
    profile?.name || user.user_metadata?.name || user.email || dict.actions.export.defaultUser;

  const { data: preferenceRow } = await supabase
    .from("user_preferences")
    .select(USER_PREFERENCE_SELECT)
    .eq("user_id", user.id)
    .single();

  const preferences = preferenceRow
    ? normalizeUserPreferences(preferenceRow)
    : DEFAULT_USER_PREFERENCES;

  let query = supabase
    .from("transaksi")
    .select(
      `
      *,
      kategori:kategori_id(nama),
      rekening:rekening_id(nama),
      rekening_tujuan_data:rekening_tujuan(nama)
    `,
    )
    .eq("user_id", user.id)
    .order("tanggal", { ascending: true })
    .order("waktu", { ascending: true });

  if (filter?.dari) {
    query = query.gte("tanggal", filter.dari);
  }
  if (filter?.sampai) {
    query = query.lte("tanggal", filter.sampai);
  }

  let tData: ExportTransaksiRow[];
  try {
    tData = await fetchAllRows<ExportTransaksiRow>(query);
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : dict.actions.export.fetchError,
    };
  }

  const formatTipe = (tipe: string) => {
    switch (tipe) {
      case "income":
        return dict.transactions.types.income;
      case "expense":
        return dict.transactions.types.expense;
      case "transfer":
        return dict.transactions.types.transfer;
      case "correction":
        return dict.transactions.types.correction;
      default:
        return tipe;
    }
  };

  const formatDate = (dateString: string) => {
    return formatTanggal(dateString, "dd MMM yyyy", preferences);
  };

  const rows = (tData ?? []) as ExportTransaksiRow[];

  const transaksi: ExportTransaksi[] = rows.map((t) => {
    const kategori = firstRelation(t.kategori);
    const rekening = firstRelation(t.rekening);
    const rekeningTujuan = firstRelation(t.rekening_tujuan_data);

    return {
      tanggal: formatDate(t.tanggal),
      waktu: t.waktu ? formatWaktu(t.waktu, preferences) : "-",
      tipe: formatTipe(t.tipe),
      judul: t.judul ?? "-",
      nominal: Number(t.nominal),
      kategori: kategori?.nama ?? "-",
      rekening: rekening?.nama ?? "-",
      rekening_tujuan:
        t.tipe === "transfer" ? (rekeningTujuan?.nama ?? "-") : "-",
      catatan: t.catatan ?? "-",
    };
  });

  let total_income = 0;
  let total_expense = 0;
  let count_income = 0;
  let count_expense = 0;
  let count_transfer = 0;

  rows.forEach((t) => {
    const nominal = Number(t.nominal);
    if (t.tipe === "income") {
      total_income += nominal;
      count_income++;
    } else if (t.tipe === "expense") {
      total_expense += nominal;
      count_expense++;
    } else if (t.tipe === "transfer") {
      count_transfer++;
    }
  });

  const net = total_income - total_expense;

  let periode = dict.actions.export.allTime;
  if (filter?.dari && filter?.sampai) {
    periode = `${formatDate(filter.dari)} - ${formatDate(filter.sampai)}`;
  } else if (filter?.dari) {
    periode = `${dict.actions.export.sincePrefix} ${formatDate(filter.dari)}`;
  } else if (filter?.sampai) {
    periode = `${dict.actions.export.untilPrefix} ${formatDate(filter.sampai)}`;
  }

  let katQuery = supabase
    .from("transaksi")
    .select(
      `
      nominal,
      kategori_id,
      kategori:kategori_id(nama, warna)
    `,
    )
    .eq("user_id", user.id)
    .eq("tipe", "expense");

  if (filter?.dari) {
    katQuery = katQuery.gte("tanggal", filter.dari);
  }
  if (filter?.sampai) {
    katQuery = katQuery.lte("tanggal", filter.sampai);
  }

  katQuery = katQuery.order("tanggal", { ascending: true }).order("waktu", { ascending: true });

  let katData: ExportKategoriRow[] | null = null;
  let katError: boolean = false;
  try {
    katData = await fetchAllRows<ExportKategoriRow>(katQuery);
  } catch {
    katError = true;
  }

  let kategori_breakdown: ExportSummary["kategori_breakdown"] = [];
  if (!katError && katData) {
    const kategoriRows = katData as ExportKategoriRow[];
    const grouped = kategoriRows.reduce<Record<string, CategoryBreakdownItem>>((acc, curr) => {
      const katId = curr.kategori_id;
      const kategori = firstRelation(curr.kategori);
      if (!katId || !kategori) return acc;

      if (!acc[katId]) {
        acc[katId] = {
          nama: kategori.nama ?? dict.actions.export.uncategorized,
          warna: kategori.warna ?? "#9ca3af",
          total: 0,
        };
      }
      acc[katId].total += Number(curr.nominal);
      return acc;
    }, {});

    const sortedCategories = Object.values(grouped).sort((a, b) => b.total - a.total);
    const topCategories = sortedCategories.slice(0, 5);
    const otherCategories = sortedCategories.slice(5);

    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce(
        (sum, k) => sum + k.total,
        0,
      );
      topCategories.push({
        nama: dict.actions.export.otherCategories,
        warna: "#9ca3af",
        total: otherTotal,
      });
    }

    kategori_breakdown = topCategories.map((k) => ({
      ...k,
      persentase: total_expense > 0 ? (k.total / total_expense) * 100 : 0,
    }));
  }

  const summary: ExportSummary = {
    total_income,
    total_expense,
    net,
    count_income,
    count_expense,
    count_transfer,
    periode,
    kategori_breakdown,
  };

  return { success: true, data: { transaksi, summary, userName, preferences } };
}

export async function getExportCount(filter?: {
  dari?: string;
  sampai?: string;
}): Promise<ActionResult<{ count: number }>> {
  const ctx = await getAuthenticatedExportContext();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;

  let query = supabase
    .from("transaksi")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (filter?.dari) {
    query = query.gte("tanggal", filter.dari);
  }
  if (filter?.sampai) {
    query = query.lte("tanggal", filter.sampai);
  }

  const { count, error } = await query;

  if (error) return { success: false, error: error.message };

  return { success: true, data: { count: count ?? 0 } };
}

export async function getAccountExportSummary(): Promise<
  ActionResult<AccountExportSummary>
> {
  const ctx = await getAuthenticatedExportContext();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;

  const [
    walletsRes,
    categoriesRes,
    transactionsRes,
    debtsRes,
    budgetsRes,
    customPeriodsRes,
  ] = await Promise.all([
    supabase
      .from("rekening")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("kategori")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("transaksi")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("hutang")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("budget")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("rekap_periode_custom")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const firstError =
    walletsRes.error ??
    categoriesRes.error ??
    transactionsRes.error ??
    debtsRes.error ??
    budgetsRes.error ??
    customPeriodsRes.error;

  if (firstError) {
    return { success: false, error: firstError.message };
  }

  return {
    success: true,
    data: {
      walletsCount: walletsRes.count ?? 0,
      categoriesCount: categoriesRes.count ?? 0,
      transactionsCount: transactionsRes.count ?? 0,
      debtsCount: debtsRes.count ?? 0,
      budgetsCount: budgetsRes.count ?? 0,
      customPeriodsCount: customPeriodsRes.count ?? 0,
    },
  };
}

export async function getAccountExportData(): Promise<
  ActionResult<AccountBackupPayload>
> {
  const ctx = await getAuthenticatedExportContext();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user, dict } = ctx;

  const [{ data: profile, error: profileError }, { data: preferenceRow, error: prefError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, avatar_url, currency, locale, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select(USER_PREFERENCE_SELECT)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (profileError) {
    return { success: false, error: profileError.message };
  }
  if (prefError) {
    return { success: false, error: prefError.message };
  }

  const preferences = preferenceRow
    ? normalizeUserPreferences(preferenceRow)
    : DEFAULT_USER_PREFERENCES;

  try {
    const [rekening, kategori, transaksi, hutang, budget, rekap_periode_custom] =
      await Promise.all([
        fetchAllRows<Record<string, unknown>>(
          supabase
            .from("rekening")
            .select("*")
            .eq("user_id", user.id)
            .order("urutan", { ascending: true })
            .order("created_at", { ascending: true }),
        ),
        fetchAllRows<Record<string, unknown>>(
          supabase
            .from("kategori")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
        ),
        fetchAllRows<Record<string, unknown>>(
          supabase
            .from("transaksi")
            .select("*")
            .eq("user_id", user.id)
            .order("tanggal", { ascending: true })
            .order("waktu", { ascending: true }),
        ),
        fetchAllRows<Record<string, unknown>>(
          supabase
            .from("hutang")
            .select("*, cicilan:hutang_cicilan(*)")
            .eq("user_id", user.id)
            .order("tanggal_mulai", { ascending: true }),
        ),
        fetchAllRows<Record<string, unknown>>(
          supabase
            .from("budget")
            .select("*")
            .eq("user_id", user.id)
            .order("tahun", { ascending: true })
            .order("bulan", { ascending: true }),
        ),
        fetchAllRows<Record<string, unknown>>(
          supabase
            .from("rekap_periode_custom")
            .select("*")
            .eq("user_id", user.id)
            .order("tanggal_mulai", { ascending: true }),
        ),
      ]);

    const payload: AccountBackupPayload = {
      metadata: {
        app: "CatatZ",
        schemaVersion: "1.0",
        exportedAt: new Date().toISOString(),
      },
      account: {
        id: user.id,
        email: user.email ?? "",
        name:
          profile?.name ??
          (typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : null),
        avatar_url: profile?.avatar_url ?? null,
        currency: profile?.currency ?? null,
        locale: profile?.locale ?? null,
        created_at: profile?.created_at ?? user.created_at ?? null,
        updated_at: profile?.updated_at ?? null,
      },
      preferences,
      data: {
        rekening,
        kategori,
        transaksi,
        hutang,
        budget,
        rekap_periode_custom,
      },
      summary: {
        walletsCount: rekening.length,
        categoriesCount: kategori.length,
        transactionsCount: transaksi.length,
        debtsCount: hutang.length,
        budgetsCount: budget.length,
        customPeriodsCount: rekap_periode_custom.length,
      },
    };

    return { success: true, data: payload };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : dict.settings.export.accountToasts.fetchFailed,
    };
  }
}
