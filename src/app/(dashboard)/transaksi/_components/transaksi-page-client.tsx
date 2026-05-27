"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Transaksi, Kategori, TransaksiFilter } from "@/types/transaksi";
import { Rekening } from "@/types/rekening";
import { formatRupiah, formatTanggal, todayISODate } from "@/lib/utils";
import { deleteTransaksi } from "@/actions/transaksi-action";
import {
  addToQueue,
  getQueue,
  offlineQueueChangedEvent,
  processQueue,
  removeFromQueue,
  type QueuedAction,
} from "@/lib/offline-queue";
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
  ArrowLeftRight,
  Plus,
  Search,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
} from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RekeningSelect } from "@/components/common/rekening-select";
import { TIPE_CONFIG } from "@/constants/transaksi";
import TransaksiDialog from "./transaksi-dialog";
import { cn } from "@/lib/utils";

type Props = {
  initialTransaksi: Transaksi[];
  rekening: Rekening[];
  kategori: Kategori[];
};

type DisplayTransaksi = Transaksi & {
  _queuedId?: string;
  _pendingSync?: boolean;
};

export default function TransaksiPageClient({
  initialTransaksi,
  rekening,
  kategori,
}: Props) {
  const [transaksi, setTransaksi] = useState(initialTransaksi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Transaksi | null>(null);
  const [copyFrom, setCopyFrom] = useState<Transaksi | null>(null);
  const [filter, setFilter] = useState<TransaksiFilter>({
    tipe: "all",
    sortBy: "tanggal",
    sortOrder: "desc",
  });
  const [preset, setPreset] = useState<string>("hari");
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  // Untuk custom range: track apakah sedang pilih 'dari' atau 'sampai'
  const [customStep, setCustomStep] = useState<"dari" | "sampai">("dari");

  // ── Auto-open dialog via ?new=true (dari sidebar CTA) ──
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("new") !== "true") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEditData(null);
      setCopyFrom(null);
      setDialogOpen(true);
      // Hapus query param tanpa reload
      router.replace("/transaksi", { scroll: false });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchParams, router]);

  useEffect(() => {
    const refreshQueue = async () => {
      setQueuedActions(await getQueue());
    };

    const syncQueue = async () => {
      const result = await processQueue();
      await refreshQueue();

      if (result.success > 0) {
        toast.success(
          `${result.success} transaksi offline berhasil disinkronkan.`,
        );
        router.refresh();
      }

      if (result.failed > 0) {
        toast.warning(
          `${result.failed} transaksi masih menunggu sinkronisasi.`,
        );
      }
    };

    void refreshQueue();
    window.addEventListener(offlineQueueChangedEvent, refreshQueue);
    window.addEventListener("online", syncQueue);

    if (navigator.onLine) {
      void syncQueue();
    }

    return () => {
      window.removeEventListener(offlineQueueChangedEvent, refreshQueue);
      window.removeEventListener("online", syncQueue);
    };
  }, [router]);

  const pendingCreateTransaksi = useMemo<DisplayTransaksi[]>(() => {
    return queuedActions
      .filter((action) => action.type === "CREATE_TRANSAKSI")
      .map((action) => {
        const payload = action.payload as Partial<Transaksi>;
        const rekeningData = rekening.find(
          (item) => item.id === payload.rekening_id,
        );
        const kategoriData = kategori.find(
          (item) => item.id === payload.kategori_id,
        );
        const rekeningTujuanData = rekening.find(
          (item) => item.id === payload.rekening_tujuan,
        );

        return {
          id: action.id,
          user_id: "",
          tipe: payload.tipe ?? "expense",
          judul: payload.judul ?? null,
          nominal: Number(payload.nominal ?? 0),
          tanggal: payload.tanggal ?? format(new Date(), "yyyy-MM-dd"),
          waktu: payload.waktu ?? "00:00",
          kategori_id: payload.kategori_id ?? null,
          rekening_id: payload.rekening_id ?? null,
          rekening_tujuan: payload.rekening_tujuan ?? null,
          catatan: payload.catatan ?? null,
          tags: payload.tags ?? [],
          is_recurring: false,
          recurring_id: null,
          created_at: new Date(action.timestamp).toISOString(),
          updated_at: new Date(action.timestamp).toISOString(),
          kategori: kategoriData,
          rekening: rekeningData
            ? {
                id: rekeningData.id,
                nama: rekeningData.nama,
                jenis: rekeningData.jenis,
                logo: rekeningData.logo,
                warna: rekeningData.warna,
              }
            : undefined,
          rekening_tujuan_data: rekeningTujuanData
            ? {
                id: rekeningTujuanData.id,
                nama: rekeningTujuanData.nama,
                jenis: rekeningTujuanData.jenis,
                logo: rekeningTujuanData.logo,
                warna: rekeningTujuanData.warna,
              }
            : undefined,
          _queuedId: action.id,
          _pendingSync: true,
        };
      });
  }, [queuedActions, rekening, kategori]);

  const displayTransaksi = useMemo<DisplayTransaksi[]>(
    () => [...pendingCreateTransaksi, ...transaksi],
    [pendingCreateTransaksi, transaksi],
  );

  const filtered = useMemo(() => {
    const result = displayTransaksi.filter((t) => {
      if (filter.tipe && filter.tipe !== "all" && t.tipe !== filter.tipe)
        return false;
      if (filter.rekening_id && t.rekening_id !== filter.rekening_id)
        return false;
      if (filter.kategori_id && t.kategori_id !== filter.kategori_id)
        return false;
      if (
        search &&
        !t.catatan?.toLowerCase().includes(search.toLowerCase()) &&
        !t.judul?.toLowerCase().includes(search.toLowerCase())
      )
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
        valA = new Date(`${a.tanggal}T${a.waktu || "00:00:00"}`).getTime();
        valB = new Date(`${b.tanggal}T${b.waktu || "00:00:00"}`).getTime();
      }

      if (valA < valB) return filter.sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return filter.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [displayTransaksi, filter, search, preset, baseDate]);

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

  /** Handler saat user memilih tanggal dari DatePicker di dateLabel */
  function handleDateLabelPick(dateStr: string) {
    const picked = parseISO(dateStr);
    if (preset === "custom") {
      // Langkah 1: pilih 'dari', langkah 2: pilih 'sampai'
      if (customStep === "dari") {
        setFilter((f) => ({ ...f, dari: dateStr, sampai: undefined }));
        setCustomStep("sampai");
        // Jangan tutup popover, tunggu pilih sampai
        return;
      } else {
        // Pastikan sampai >= dari
        const dari = filter.dari ? parseISO(filter.dari) : null;
        if (dari && picked < dari) {
          // Jika pilih tanggal lebih awal dari 'dari', swap
          setFilter((f) => ({ ...f, sampai: f.dari, dari: dateStr }));
        } else {
          setFilter((f) => ({ ...f, sampai: dateStr }));
        }
        setCustomStep("dari"); // reset untuk pilihan berikutnya
      }
    } else {
      setBaseDate(picked);
    }
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
        if (customStep === "sampai")
          return `${format(parseISO(filter.dari), "dd MMM", { locale: idLocale })} → Pilih akhir`;
        return `Mulai ${format(parseISO(filter.dari), "dd MMM yyyy", { locale: idLocale })}`;
      }
      return "Klik untuk pilih rentang";
    }
    return "Rentang Waktu";
  }, [baseDate, preset, filter.dari, filter.sampai, customStep]);

  // Summary totals (correction tidak masuk hitungan income/expense)
  const totalIncome = filtered
    .filter((t) => t.tipe === "income")
    .reduce((s, t) => s + Number(t.nominal), 0);
  const totalExpense = filtered
    .filter((t) => t.tipe === "expense")
    .reduce((s, t) => s + Number(t.nominal), 0);

  async function handleDelete(id: string) {
    const target = filtered.find((item) => item.id === id);

    if (target?._queuedId) {
      await removeFromQueue(target._queuedId);
      toast.success("Transaksi sementara dihapus");
      return;
    }

    if (!navigator.onLine) {
      const queuedAction = await addToQueue({
        type: "DELETE_TRANSAKSI",
        payload: { id },
      });

      if (queuedAction) {
        setTransaksi((prev) => prev.filter((t) => t.id !== id));
        toast.success("Hapus transaksi akan disinkronkan saat online.");
      } else {
        toast.error("Perangkat tidak mendukung penyimpanan offline.");
      }

      return;
    }

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
    setCopyFrom(null);
  }

  function handleUpdated(t: Transaksi & { _isCopySignal?: boolean }) {
    // Copy Transaksi (Opsi B): signal dari dialog untuk buka mode create dengan copyFrom
    if (t._isCopySignal) {
      const original = editData;
      setEditData(null);
      setDialogOpen(false);
      // Delay sedikit agar dialog tutup dulu sebelum buka lagi
      setTimeout(() => {
        setCopyFrom(original);
        setDialogOpen(true);
      }, 150);
      return;
    }
    setTransaksi((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    setDialogOpen(false);
    setEditData(null);
    setCopyFrom(null);
  }

  function handleQueued(action: QueuedAction) {
    setQueuedActions((prev) => [
      action,
      ...prev.filter((item) => item.id !== action.id),
    ]);
    setDialogOpen(false);
    setEditData(null);
    setCopyFrom(null);
  }

  const canNavigateDate = preset !== "all" && preset !== "custom";
  const defaultDialogTanggal = useMemo(() => {
    if (preset === "all") return todayISODate();
    if (preset === "custom") return filter.dari ?? todayISODate();

    return format(baseDate, "yyyy-MM-dd");
  }, [baseDate, filter.dari, preset]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-normal tracking-[-0.4px] text-foreground truncate leading-tight">
            Transaksi
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <span className="truncate">Riwayat arus kas Anda</span>
            </div>
            <Badge
              variant="secondary"
              className="text-xs px-2.5 py-0.5 rounded-full bg-surface-strong text-muted-foreground border-none shrink-0"
            >
              {filtered.length} Data
            </Badge>
          </div>
        </div>
        <div className="shrink-0">
          <Select
            value={preset}
            onValueChange={(val) => {
              setPreset(val);
              setBaseDate(new Date());
              setCustomStep("dari");
              if (val !== "custom") {
                setFilter((f) => ({
                  ...f,
                  dari: undefined,
                  sampai: undefined,
                }));
              }
            }}
          >
            <SelectTrigger
              className="h-9 sm:h-10 text-sm w-32 sm:w-48 bg-background dark:bg-card border border-hairline text-foreground shrink-0 px-2 sm:px-3"
              id="filter-periode"
            >
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent align="end" className="min-w-48">
              <SelectItem value="hari">Hari Ini</SelectItem>
              <SelectItem value="minggu">Minggu Ini</SelectItem>
              <SelectItem value="bulan">Bulan Ini</SelectItem>
              <SelectItem value="tahun">Tahun Ini</SelectItem>
              <SelectItem value="all">Semua Waktu</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Navigator & Summary Card */}
      <div className="rounded-card border border-hairline bg-surface-dark dark:bg-surface-dark-elevated text-white overflow-hidden ring-1 ring-white/5">
        {/* Navigator Header */}
        <div className="bg-primary flex items-center justify-between px-6 py-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={handlePrevDate}
            disabled={!canNavigateDate}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* dateLabel yang bisa diklik */}
          <div className="relative inline-flex items-center">
            <button
              className={cn(
                "font-semibold text-sm md:text-base flex items-center gap-1.5 text-white",
                "hover:text-white/80 transition-colors rounded-[6px] px-2 py-1",
                preset !== "all" && "hover:underline underline-offset-2",
              )}
              disabled={preset === "all"}
              title={preset !== "all" ? "Klik untuk pilih tanggal" : undefined}
            >
              <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
              {dateLabel}
            </button>
            {preset !== "all" && (
              <input
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                value={
                  preset === "custom"
                    ? customStep === "dari"
                      ? filter.dari || ""
                      : filter.sampai || ""
                    : format(baseDate, "yyyy-MM-dd")
                }
                onChange={(e) => {
                  if (e.target.value) {
                    handleDateLabelPick(e.target.value);
                  }
                }}
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={handleNextDate}
            disabled={!canNavigateDate}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary — correction tidak dihitung */}
        <div className="grid grid-cols-3 divide-x divide-hairline px-3 sm:px-6 py-4 text-center bg-background dark:bg-card text-foreground rounded-b-card">
          <div className="px-0.5 sm:px-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              Pemasukan
            </p>
            <p className="font-mono text-sm sm:text-base font-semibold text-semantic-up mt-0.5 break-all leading-tight">
              {totalIncome > 0 ? "+" : ""}
              {formatRupiah(totalIncome)}
            </p>
          </div>
          <div className="px-0.5 sm:px-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              Pengeluaran
            </p>
            <p className="font-mono text-sm sm:text-base font-semibold text-semantic-down mt-0.5 break-all leading-tight">
              {formatRupiah(totalExpense)}
            </p>
          </div>
          <div className="px-0.5 sm:px-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              Selisih
            </p>
            <p
              className={cn(
                "font-mono text-sm sm:text-base font-semibold mt-0.5 break-all leading-tight",
                totalIncome - totalExpense >= 0
                  ? "text-semantic-up"
                  : "text-semantic-down",
              )}
            >
              {formatRupiah(totalIncome - totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari judul atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => {
              setEditData(null);
              setCopyFrom(null);
              setDialogOpen(true);
            }}
            className="h-11 px-5 bg-primary hover:bg-[#003ecc] text-white rounded-full font-semibold gap-2 shrink-0 transition-colors"
            id="btn-tambah-transaksi"
          >
            <Plus className="h-4 w-4" />
            Transaksi Baru
          </Button>
        </div>

        <div className="flex w-full gap-2">
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
            <SelectTrigger
              size="sm"
              className="flex-1 text-xs text-foreground border-hairline"
            >
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
            <SelectTrigger
              size="sm"
              className="flex-1 text-xs text-foreground border-hairline"
              id="filter-tipe"
            >
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="correction">Koreksi Saldo</SelectItem>
            </SelectContent>
          </Select>

          <RekeningSelect
            rekening={rekening}
            value={filter.rekening_id ?? "none"}
            onValueChange={(v) =>
              setFilter((f) => ({
                ...f,
                rekening_id: v === "none" ? undefined : v,
              }))
            }
            placeholder="Semua rekening"
            includeNone={true}
            noneLabel="Semua Rekening"
            size="sm"
            className="flex-1 text-xs text-foreground border-hairline"
            id="filter-rekening"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-card border border-hairline overflow-hidden">
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
            const cfg = TIPE_CONFIG[t.tipe] ?? TIPE_CONFIG.expense;
            const TipeIcon = cfg.icon;
            const displayName = t.judul || t.catatan || cfg.label;
            return (
              <div
                key={t.id}
                className="group relative flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border-b border-hairline last:border-b-0 bg-transparent hover:bg-surface-soft transition-colors"
              >
                {/* Mobile: Top Row (Icon, Title, Amount) */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-surface-strong flex items-center justify-center shrink-0">
                    {t.kategori?.ikon ?? (
                      <TipeIcon className={cn("h-5 w-5", cfg.color)} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 sm:hidden">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full border-0",
                          cfg.badge,
                        )}
                      >
                        {t.kategori
                          ? `${t.kategori.ikon} ${t.kategori.nama}`
                          : cfg.label}
                      </Badge>
                      {t._pendingSync && (
                        <Badge className="border-0 bg-accent-yellow/10 px-1 py-0 text-[10px] text-accent-yellow">
                          Menunggu sinkronisasi
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:hidden">
                    <p
                      className={cn(
                        "font-mono font-semibold text-sm",
                        t.tipe === "income"
                          ? "text-semantic-up"
                          : t.tipe === "expense"
                            ? "text-semantic-down"
                            : t.tipe === "correction"
                              ? "text-accent-yellow"
                              : "text-foreground",
                      )}
                    >
                      {t.tipe === "income"
                        ? "+"
                        : t.tipe === "expense"
                          ? "-"
                          : ""}
                      {formatRupiah(Number(t.nominal))}
                    </p>
                  </div>
                </div>

                {/* Desktop/Tablet Info */}
                <div className="hidden sm:flex flex-1 flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {displayName}
                    </span>
                    <Badge
                      className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full border-0",
                        cfg.badge,
                      )}
                    >
                      {t.kategori
                        ? `${t.kategori.ikon} ${t.kategori.nama}`
                        : cfg.label}
                    </Badge>
                    {t._pendingSync && (
                      <Badge className="border-0 bg-accent-yellow/10 px-1.5 py-0 text-[10px] text-accent-yellow">
                        Menunggu sinkronisasi
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTanggal(t.tanggal)}
                    </span>
                    {t.rekening && (
                      <span className="text-xs text-muted-foreground truncate max-w-30">
                        · {t.rekening.nama}
                      </span>
                    )}
                    {t.tipe === "transfer" && t.rekening_tujuan_data && (
                      <span className="text-xs text-muted-foreground truncate max-w-30">
                        → {t.rekening_tujuan_data.nama}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop Amount */}
                <div className="hidden sm:block text-right px-2">
                  <p
                    className={cn(
                      "font-mono font-semibold text-sm",
                      t.tipe === "income"
                        ? "text-semantic-up"
                        : t.tipe === "expense"
                          ? "text-semantic-down"
                          : t.tipe === "correction"
                            ? "text-accent-yellow"
                            : "text-foreground",
                    )}
                  >
                    {t.tipe === "income"
                      ? "+"
                      : t.tipe === "expense"
                        ? "-"
                        : ""}
                    {formatRupiah(Number(t.nominal))}
                  </p>
                </div>

                {/* Mobile Bottom Row (Meta & Actions) */}
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-dashed sm:border-0 sm:mt-0 sm:pt-0 w-full sm:w-auto">
                  <div className="flex flex-col sm:hidden">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{formatTanggal(t.tanggal)}</span>
                      {t.rekening && <span>· {t.rekening.nama}</span>}
                      {t.tipe === "transfer" && t.rekening_tujuan_data && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          → {t.rekening_tujuan_data.nama}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-surface-strong hover:bg-surface-strong/80"
                      disabled={t._pendingSync}
                      onClick={() => {
                        setEditData(t);
                        setCopyFrom(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDialog
                      title={
                        t.tipe === "correction"
                          ? "Hapus Koreksi Saldo?"
                          : "Hapus Transaksi?"
                      }
                      description={
                        t.tipe === "correction"
                          ? "Koreksi saldo ini akan dihapus. Saldo rekening TIDAK akan otomatis dibalik."
                          : "Transaksi ini akan dihapus secara permanen."
                      }
                      onConfirm={() => handleDelete(t.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
                        disabled={deleting === t.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </ConfirmDialog>
                  </div>
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
          if (!open) {
            setEditData(null);
            setCopyFrom(null);
          }
        }}
        rekening={rekening}
        kategori={kategori}
        editData={editData}
        copyFrom={copyFrom}
        defaultTanggal={defaultDialogTanggal}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        onQueued={handleQueued}
      />
    </div>
  );
}
