"use client";

import { useState, useMemo } from "react";
import { Transaksi, Kategori, TransaksiFilter } from "@/types/transaksi";
import { Rekening } from "@/types/rekening";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { deleteTransaksi } from "@/actions/transaksi-action";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  isAfter,
  isBefore,
  parseISO,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  format,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Search,
  Trash2,
  Pencil,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import TransaksiDialog from "./transaksi-dialog";
import { cn } from "@/lib/utils";

type Props = {
  initialTransaksi: Transaksi[];
  rekening: Rekening[];
  kategori: Kategori[];
};

const TIPE_CONFIG = {
  income: {
    label: "Pemasukan",
    icon: ArrowDownLeft,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  expense: {
    label: "Pengeluaran",
    icon: ArrowUpRight,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  transfer: {
    label: "Transfer",
    icon: ArrowLeftRight,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

export default function TransaksiPageClient({
  initialTransaksi,
  rekening,
  kategori,
}: Props) {
  const [transaksi, setTransaksi] = useState(initialTransaksi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Transaksi | null>(null);
  const [filter, setFilter] = useState<TransaksiFilter>({
    tipe: "all",
    sortBy: "tanggal",
    sortOrder: "desc",
  });
  const [preset, setPreset] = useState<string>("hari");
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = transaksi.filter((t) => {
      if (filter.tipe && filter.tipe !== "all" && t.tipe !== filter.tipe)
        return false;
      if (filter.rekening_id && t.rekening_id !== filter.rekening_id)
        return false;
      if (filter.kategori_id && t.kategori_id !== filter.kategori_id)
        return false;
      if (search && !t.catatan?.toLowerCase().includes(search.toLowerCase()))
        return false;

      const tDate = parseISO(t.tanggal);
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (preset === "hari") {
        startDate = startOfDay(baseDate);
        endDate = endOfDay(baseDate);
      } else if (preset === "minggu") {
        startDate = startOfWeek(baseDate, { weekStartsOn: 1 });
        endDate = endOfWeek(baseDate, { weekStartsOn: 1 });
      } else if (preset === "bulan") {
        startDate = startOfMonth(baseDate);
        endDate = endOfMonth(baseDate);
      } else if (preset === "tahun") {
        startDate = startOfYear(baseDate);
        endDate = endOfYear(baseDate);
      } else if (preset === "custom" && filter.dari && filter.sampai) {
        startDate = startOfDay(parseISO(filter.dari));
        endDate = endOfDay(parseISO(filter.sampai));
      }

      if (startDate && isBefore(tDate, startDate)) return false;
      if (endDate && isAfter(tDate, endDate)) return false;

      return true;
    });

    result.sort((a, b) => {
      let valA, valB;
      if (filter.sortBy === "nominal") {
        valA = Number(a.nominal);
        valB = Number(b.nominal);
      } else if (filter.sortBy === "created_at") {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else {
        // default tanggal + waktu
        valA = new Date(`${a.tanggal}T${a.waktu || "00:00:00"}`).getTime();
        valB = new Date(`${b.tanggal}T${b.waktu || "00:00:00"}`).getTime();
      }

      if (valA < valB) return filter.sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return filter.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [transaksi, filter, search, preset, baseDate]);

  // Date Navigation Logic
  function handlePrevDate() {
    if (preset === "hari") setBaseDate(subDays(baseDate, 1));
    else if (preset === "minggu") setBaseDate(subWeeks(baseDate, 1));
    else if (preset === "bulan") setBaseDate(subMonths(baseDate, 1));
    else if (preset === "tahun") setBaseDate(subYears(baseDate, 1));
  }

  function handleNextDate() {
    if (preset === "hari") setBaseDate(addDays(baseDate, 1));
    else if (preset === "minggu") setBaseDate(addWeeks(baseDate, 1));
    else if (preset === "bulan") setBaseDate(addMonths(baseDate, 1));
    else if (preset === "tahun") setBaseDate(addYears(baseDate, 1));
  }

  const dateLabel = useMemo(() => {
    if (preset === "all") return "Semua Waktu";
    if (preset === "hari")
      return format(baseDate, "EEEE, dd MMM yyyy", { locale: idLocale });
    if (preset === "minggu") {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      return `${format(start, "dd MMM", { locale: idLocale })} - ${format(end, "dd MMM yyyy", { locale: idLocale })}`;
    }
    if (preset === "bulan")
      return format(baseDate, "MMMM yyyy", { locale: idLocale });
    if (preset === "tahun")
      return format(baseDate, "yyyy", { locale: idLocale });
    if (preset === "custom") {
      if (filter.dari && filter.sampai) {
        return `${format(parseISO(filter.dari), "dd MMM yy", { locale: idLocale })} - ${format(parseISO(filter.sampai), "dd MMM yyyy", { locale: idLocale })}`;
      } else if (filter.dari) {
        return `Mulai ${format(parseISO(filter.dari), "dd MMM yyyy", { locale: idLocale })}`;
      } else if (filter.sampai) {
        return `Hingga ${format(parseISO(filter.sampai), "dd MMM yyyy", { locale: idLocale })}`;
      }
      return "Pilih Tanggal";
    }
    return "Rentang Waktu";
  }, [baseDate, preset, filter.dari, filter.sampai]);

  // Summary totals
  const totalIncome = filtered
    .filter((t) => t.tipe === "income")
    .reduce((s, t) => s + Number(t.nominal), 0);
  const totalExpense = filtered
    .filter((t) => t.tipe === "expense")
    .reduce((s, t) => s + Number(t.nominal), 0);

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await deleteTransaksi(id);
    if (res.success) {
      setTransaksi((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transaksi dihapus");
    } else {
      toast.error(res.error ?? "Gagal menghapus");
    }
    setDeleting(null);
  }

  function handleCreated(t: Transaksi) {
    setTransaksi((prev) => [t, ...prev]);
    setDialogOpen(false);
    setEditData(null);
  }

  function handleUpdated(t: Transaksi) {
    setTransaksi((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    setDialogOpen(false);
    setEditData(null);
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
          <p className="text-muted-foreground text-sm">
            Catat semua arus kas Anda
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditData(null);
            setDialogOpen(true);
          }}
          className="gap-2"
          id="btn-tambah-transaksi"
        >
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>

      {/* Date Navigator & Summary Card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Navigator Header */}
        <div className="bg-linear-to-br from-indigo-600 to-violet-600  text-white flex items-center justify-between p-3 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={handlePrevDate}
            disabled={preset === "all" || preset === "custom"}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm md:text-base">
            {dateLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={handleNextDate}
            disabled={preset === "all" || preset === "custom"}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 divide-x p-4 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Pemasukan</p>
            <p className="text-sm md:text-base font-bold text-emerald-500">
              {totalIncome > 0 ? "+" : ""}
              {formatRupiah(totalIncome)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Pengeluaran</p>
            <p className="text-sm md:text-base font-bold text-rose-500">
              {formatRupiah(totalExpense)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Selisih</p>
            <p
              className={cn(
                "text-sm md:text-base font-bold",
                totalIncome - totalExpense >= 0
                  ? "text-emerald-500"
                  : "text-rose-500",
              )}
            >
              {formatRupiah(totalIncome - totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="space-y-4">
        {/* Preset & Custom Range Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Select
            value={preset}
            onValueChange={(val) => {
              setPreset(val);
              setBaseDate(new Date());
            }}
          >
            <SelectTrigger className="w-40 h-8 text-sm" id="filter-periode">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hari">Hari Ini</SelectItem>
              <SelectItem value="minggu">Minggu Ini</SelectItem>
              <SelectItem value="bulan">Bulan Ini</SelectItem>
              <SelectItem value="tahun">Tahun Ini</SelectItem>
              <SelectItem value="all">Semua Waktu</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filter.dari ?? ""}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, dari: e.target.value }))
                }
                className="h-8 text-xs w-32.5"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="date"
                value={filter.sampai ?? ""}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, sampai: e.target.value }))
                }
                className="h-8 text-xs w-32.5"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select
            value={`${filter.sortBy}-${filter.sortOrder}`}
            onValueChange={(v) => {
              const [by, order] = v.split("-") as [
                TransaksiFilter["sortBy"],
                TransaksiFilter["sortOrder"],
              ];
              setFilter((f) => ({ ...f, sortBy: by, sortOrder: order }));
            }}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tanggal-desc">📅 Terbaru</SelectItem>
              <SelectItem value="tanggal-asc">📅 Terlama</SelectItem>
              <SelectItem value="nominal-desc">💰 Terbesar</SelectItem>
              <SelectItem value="nominal-asc">💰 Terkecil</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.tipe ?? "all"}
            onValueChange={(v) =>
              setFilter((f) => ({ ...f, tipe: v as TransaksiFilter["tipe"] }))
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm" id="filter-tipe">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.rekening_id ?? "all"}
            onValueChange={(v) =>
              setFilter((f) => ({
                ...f,
                rekening_id: v === "all" ? undefined : v,
              }))
            }
          >
            <SelectTrigger className="w-40 h-8 text-sm" id="filter-rekening">
              <SelectValue placeholder="Semua rekening" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Rekening</SelectItem>
              {rekening.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Belum ada transaksi</p>
            <p className="text-xs mt-1">
              Klik tombol Tambah untuk mulai mencatat
            </p>
          </div>
        ) : (
          filtered.map((t) => {
            const cfg = TIPE_CONFIG[t.tipe];
            const TipeIcon = cfg.icon;
            return (
              <div
                key={t.id}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow group"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg",
                    cfg.bg,
                  )}
                >
                  {t.kategori?.ikon ?? (
                    <TipeIcon className={cn("h-5 w-5", cfg.color)} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {t.catatan || cfg.label}
                    </span>
                    <Badge
                      className={cn("text-xs px-1.5 py-0 border-0", cfg.badge)}
                    >
                      {cfg.label}
                    </Badge>
                    {t.kategori && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {t.kategori.ikon} {t.kategori.nama}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatTanggal(t.tanggal)}
                    </span>
                    {t.rekening && (
                      <span className="text-xs text-muted-foreground">
                        · {t.rekening.nama}
                      </span>
                    )}
                    {t.tipe === "transfer" && t.rekening_tujuan_data && (
                      <span className="text-xs text-muted-foreground">
                        → {t.rekening_tujuan_data.nama}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className={cn("font-semibold text-sm", cfg.color)}>
                    {t.tipe === "income"
                      ? "+"
                      : t.tipe === "expense"
                        ? "-"
                        : ""}
                    {formatRupiah(Number(t.nominal))}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditData(t);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmDialog
                    title="Hapus Transaksi?"
                    description="Transaksi ini akan dihapus secara permanen beserta pengaruhnya pada saldo rekening."
                    onConfirm={() => handleDelete(t.id)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                      disabled={deleting === t.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog */}
      <TransaksiDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditData(null);
        }}
        rekening={rekening}
        kategori={kategori}
        editData={editData}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
