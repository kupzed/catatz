"use server";

import { createClient } from "@/configs/supabase/server";
import type { ActionResult } from "@/types/general";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

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

export async function getExportData(filter?: {
  dari?: string;
  sampai?: string;
}): Promise<
  ActionResult<{
    transaksi: ExportTransaksi[];
    summary: ExportSummary;
    userName: string;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terautentikasi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const userName = profile?.name || user.user_metadata?.name || user.email || "Pengguna";

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

  const { data: tData, error } = await query;
  if (error) return { success: false, error: error.message };

  const formatTipe = (tipe: string) => {
    switch (tipe) {
      case "income":
        return "Pemasukan";
      case "expense":
        return "Pengeluaran";
      case "transfer":
        return "Transfer";
      case "correction":
        return "Koreksi Saldo";
      default:
        return tipe;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy", { locale: id });
    } catch {
      return dateString;
    }
  };

  const transaksi: ExportTransaksi[] = (tData || []).map((t: any) => ({
    tanggal: formatDate(t.tanggal),
    waktu: t.waktu ? t.waktu.substring(0, 5) : "-",
    tipe: formatTipe(t.tipe),
    judul: t.judul ?? "-",
    nominal: Number(t.nominal),
    kategori: t.kategori?.nama ?? "-",
    rekening: t.rekening?.nama ?? "-",
    rekening_tujuan:
      t.tipe === "transfer" ? (t.rekening_tujuan_data?.nama ?? "-") : "-",
    catatan: t.catatan ?? "-",
  }));

  let total_income = 0;
  let total_expense = 0;
  let count_income = 0;
  let count_expense = 0;
  let count_transfer = 0;

  (tData || []).forEach((t: any) => {
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

  let periode = "Semua Waktu";
  if (filter?.dari && filter?.sampai) {
    periode = `${format(parseISO(filter.dari), "dd MMM yyyy", { locale: id })} – ${format(parseISO(filter.sampai), "dd MMM yyyy", { locale: id })}`;
  } else if (filter?.dari) {
    periode = `Sejak ${format(parseISO(filter.dari), "dd MMM yyyy", { locale: id })}`;
  } else if (filter?.sampai) {
    periode = `Hingga ${format(parseISO(filter.sampai), "dd MMM yyyy", { locale: id })}`;
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

  const { data: katData, error: katError } = await katQuery;

  let kategori_breakdown: any[] = [];
  if (!katError && katData) {
    const grouped = katData.reduce((acc: any, curr: any) => {
      const katId = curr.kategori_id;
      if (!katId || !curr.kategori) return acc;
      if (!acc[katId]) {
        acc[katId] = {
          nama: curr.kategori.nama,
          warna: curr.kategori.warna,
          total: 0,
        };
      }
      acc[katId].total += Number(curr.nominal);
      return acc;
    }, {});

    const sortedCategories = Object.values(grouped).sort(
      (a: any, b: any) => b.total - a.total,
    );
    let topCategories = sortedCategories.slice(0, 5);
    const otherCategories = sortedCategories.slice(5);

    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce(
        (sum, k: any) => sum + k.total,
        0,
      );
      topCategories.push({
        nama: "Kategori Lain-lain",
        warna: "#9ca3af",
        total: otherTotal,
      });
    }

    kategori_breakdown = topCategories.map((k: any) => ({
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

  return { success: true, data: { transaksi, summary, userName } };
}

export async function getExportCount(): Promise<
  ActionResult<{ count: number }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak terautentikasi" };

  const { count, error } = await supabase
    .from("transaksi")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  return { success: true, data: { count: count ?? 0 } };
}
