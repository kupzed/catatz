"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type {
  JenisRekening,
  Rekening,
  RekeningUsageCounts,
} from "@/types/rekening";
import type { Kategori, Transaksi, TipeTransaksi } from "@/types/transaksi";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useSetBreadcrumbTitle } from "@/providers/breadcrumb-title-provider";
import { toggleExcludeTotal } from "@/actions/rekening-action";
import { deleteTransaksi } from "@/actions/transaksi-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Wallet,
  Landmark,
  Smartphone,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RekeningDialog from "../../_components/rekening-dialog";
import TransaksiDialog from "@/app/(dashboard)/transactions/_components/transaksi-dialog";
import { TransaksiList } from "@/app/(dashboard)/transactions/_components/transaksi-list";
import { TransaksiDetailSheet } from "@/app/(dashboard)/transactions/_components/transaksi-detail-sheet";
import { TransaksiPagination } from "@/app/(dashboard)/transactions/_components/transaksi-pagination";
import { useDateNavigation } from "@/hooks/use-date-navigation";
import { useTransaksiFilter } from "@/hooks/use-transaksi-filter";
import {
  useOfflineQueueSync,
  type DisplayTransaksi,
} from "@/hooks/use-offline-queue-sync";
import { RekeningStatCards } from "./rekening-stat-cards";

type Props = {
  initialRekening: Rekening;
  initialUsage: RekeningUsageCounts;
  initialTransaksi: Transaksi[];
  allRekening: Rekening[];
  kategori: Kategori[];
};

const JENIS_CONFIG: Record<
  JenisRekening,
  { icon: React.ElementType; color: string }
> = {
  Tunai: { icon: Wallet, color: "text-amber-500 bg-amber-500/10" },
  Bank: { icon: Landmark, color: "text-blue-500 bg-blue-500/10" },
  "E-Wallet": { icon: Smartphone, color: "text-purple-500 bg-purple-500/10" },
  Investasi: { icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
};

const TIPE_TABS: { label: string; value: TipeTransaksi | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Pemasukan", value: "income" },
  { label: "Pengeluaran", value: "expense" },
  { label: "Transfer", value: "transfer" },
  { label: "Koreksi", value: "correction" },
];

export function RekeningDetailClient({
  initialRekening,
  initialUsage,
  initialTransaksi,
  allRekening,
  kategori,
}: Props) {
  const router = useRouter();
  const { formatRupiah } = useSystemPreferences();

  // Core States
  const [rekening, setRekening] = useState<Rekening>(initialRekening);
  const [usage, setUsage] = useState<RekeningUsageCounts>(initialUsage);
  const [transaksi, setTransaksi] = useState<Transaksi[]>(initialTransaksi);

  // Sync state if props update from server revalidation
  const [prevRekening, setPrevRekening] = useState(initialRekening);
  if (initialRekening !== prevRekening) {
    setPrevRekening(initialRekening);
    setRekening(initialRekening);
  }

  const [prevUsage, setPrevUsage] = useState(initialUsage);
  if (initialUsage !== prevUsage) {
    setPrevUsage(initialUsage);
    setUsage(initialUsage);
  }

  const [prevTransaksi, setPrevTransaksi] = useState(initialTransaksi);
  if (initialTransaksi !== prevTransaksi) {
    setPrevTransaksi(initialTransaksi);
    setTransaksi(initialTransaksi);
  }

  // Set topnav breadcrumb title to nama rekening (via Zustand store)
  useSetBreadcrumbTitle(rekening.nama);

  // Dialog States
  const [editRekeningOpen, setEditRekeningOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editTxData, setEditTxData] = useState<Transaksi | null>(null);
  const [copyTxData, setCopyTxData] = useState<Transaksi | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Filter States
  const [selectedTipe, setSelectedTipe] = useState<TipeTransaksi | "all">("all");

  const {
    preset,
    setPreset,
    baseDate,
    setBaseDate,
    customStep,
    setCustomStep,
    dateFilter,
    setDateFilter,
    handlePrevDate,
    handleNextDate,
    handleDateLabelPick,
    dateLabel,
    canNavigateDate,
  } = useDateNavigation("all");

  const currentDate = useMemo(() => {
    if (preset === "custom") {
      return customStep === "dari"
        ? dateFilter.dari || ""
        : dateFilter.sampai || "";
    }
    return format(baseDate, "yyyy-MM-dd");
  }, [baseDate, customStep, dateFilter.dari, dateFilter.sampai, preset]);

  // Offline sync hook
  const handleSyncSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const { pendingCreateTransaksi, handleQueued } = useOfflineQueueSync({
    rekening: allRekening,
    kategori,
    onSyncSuccess: handleSyncSuccess,
  });

  const displayTransaksi = useMemo<DisplayTransaksi[]>(() => {
    const combined = [...pendingCreateTransaksi, ...transaksi];
    // Pastikan hanya transaksi terkait rekening ini
    return combined.filter(
      (t) => t.rekening_id === rekening.id || t.rekening_tujuan === rekening.id,
    );
  }, [pendingCreateTransaksi, transaksi, rekening.id]);

  const { search, setSearch, filtered } = useTransaksiFilter<DisplayTransaksi>({
    transaksi: displayTransaksi,
    preset,
    baseDate,
    dateFilter,
  });

  // Filter berdasarkan selectedTipe tab
  const tipeFiltered = useMemo(() => {
    if (selectedTipe === "all") return filtered;
    return filtered.filter((t) => t.tipe === selectedTipe);
  }, [filtered, selectedTipe]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const listTopRef = useRef<HTMLDivElement>(null);

  // Reset page saat filter/tipe berubah
  const filterKey = `${search}_${selectedTipe}_${preset}_${baseDate.getTime()}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(tipeFiltered.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedTransaksi = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tipeFiltered.slice(start, start + pageSize);
  }, [tipeFiltered, currentPage, pageSize]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Detail item
  const detailTransaksi = useMemo(() => {
    if (!selectedDetailId) return null;
    return displayTransaksi.find((t) => t.id === selectedDetailId) ?? null;
  }, [selectedDetailId, displayTransaksi]);

  // Actions
  async function handleToggleExclude() {
    const nextVal = !rekening.exclude_total;
    const res = await toggleExcludeTotal(rekening.id, nextVal);
    if (res.success) {
      setRekening((prev) => ({ ...prev, exclude_total: nextVal }));
      toast.success(
        nextVal
          ? "Rekening dikecualikan dari total saldo"
          : "Rekening dimasukkan ke dalam total saldo",
      );
    } else {
      toast.error(res.error ?? "Gagal memperbarui status");
    }
  }

  async function handleDeleteTx(id: string) {
    setDeletingTxId(id);
    const res = await deleteTransaksi(id);
    if (res.success) {
      setTransaksi((prev) => prev.filter((t) => t.id !== id));
      setSelectedDetailId(null);
      setUsage((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      toast.success("Transaksi berhasil dihapus");
      router.refresh();
    } else {
      toast.error(res.error ?? "Gagal menghapus transaksi");
    }
    setDeletingTxId(null);
  }

  function openCreateTx() {
    setEditTxData(null);
    setCopyTxData(null);
    setTxDialogOpen(true);
  }

  function openEditTx(t: DisplayTransaksi) {
    setEditTxData(t);
    setCopyTxData(null);
    setSelectedDetailId(null);
    setTxDialogOpen(true);
  }

  function openCopyTx(t: DisplayTransaksi) {
    setEditTxData(null);
    setCopyTxData(t);
    setSelectedDetailId(null);
    setTxDialogOpen(true);
  }

  const jenisCfg = JENIS_CONFIG[rekening.jenis] ?? JENIS_CONFIG.Bank;
  const JenisIcon = jenisCfg.icon;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/wallets")}
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground rounded-full h-8 px-2.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Rekening
          </Button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[32px] font-normal tracking-[-0.4px] text-foreground">
              {rekening.nama}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 flex items-center gap-1",
                  jenisCfg.color,
                )}
              >
                <JenisIcon className="h-3.5 w-3.5" />
                {rekening.jenis}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-normal border-hairline",
                  rekening.exclude_total
                    ? "bg-surface-soft text-muted-foreground"
                    : "bg-surface-strong text-foreground",
                )}
              >
                {rekening.exclude_total ? "Dikecualikan" : "Aktif di Total"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons: 2 columns on mobile, auto width flex on desktop */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:shrink-0">
          <Button
            variant="outline"
            onClick={() => setEditRekeningOpen(true)}
            className="rounded-full h-10 sm:h-9 px-4 border-hairline hover:bg-surface-soft text-foreground text-xs font-medium gap-1.5 cursor-pointer justify-center"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Rekening</span>
          </Button>

          <Button
            onClick={openCreateTx}
            className="rounded-full h-10 sm:h-9 px-4 bg-primary hover:bg-[#003ecc] text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-none justify-center"
            id="btn-tambah-transaksi-wallet"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </Button>
        </div>
      </div>

      {/* Saldo Card */}
      <div
        className="rounded-card border border-hairline bg-card p-5 sm:p-8 transition-colors border-t-4"
        style={{ borderTopColor: rekening.warna ?? "#0052ff" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Saldo Saat Ini
            </p>
            <p className="font-mono text-3xl sm:text-4xl lg:text-5xl font-normal text-foreground tracking-tight">
              {formatRupiah(Number(rekening.saldo_saat_ini))}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-hairline">
            <Switch
              checked={!rekening.exclude_total}
              onCheckedChange={handleToggleExclude}
              id="toggle-exclude-detail"
              className="scale-90"
            />
            <label
              htmlFor="toggle-exclude-detail"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              {!rekening.exclude_total
                ? "Termasuk dalam total saldo aktif"
                : "Dikecualikan dari total saldo"}
            </label>
          </div>
        </div>
      </div>

      {/* Rekening Statistics & Usage Badges */}
      <RekeningStatCards
        rekening={rekening}
        usage={usage}
        transaksi={transaksi}
      />

      {/* Transactions Section */}
      <div className="space-y-4 pt-2" ref={listTopRef}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                Histori Transaksi
              </h2>
              <Badge
                variant="secondary"
                className="text-xs px-2.5 py-0.5 rounded-full bg-surface-strong text-muted-foreground border-none font-mono"
              >
                {tipeFiltered.length} Data
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Catatan transaksi terkait rekening ini
            </p>
          </div>

          {/* Controls Periode & Navigasi Tanggal (Fungsi & Tampilan identik Index Transaksi) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Dropdown Periode */}
            <Select
              value={preset}
              onValueChange={(val) => {
                setPreset(val);
                setBaseDate(new Date());
                setCustomStep("dari");
                if (val !== "custom") {
                  setDateFilter((f) => ({
                    ...f,
                    dari: undefined,
                    sampai: undefined,
                  }));
                }
              }}
            >
              <SelectTrigger
                size="sm"
                className={cn(
                  "h-9! rounded-full! border border-hairline bg-surface-strong dark:bg-surface-dark-elevated text-foreground hover:bg-surface-soft dark:hover:bg-surface-dark text-xs sm:text-sm font-medium transition-colors shadow-none cursor-pointer",
                  preset !== "all"
                    ? "w-32 sm:w-36 shrink-0 px-3"
                    : "w-full sm:w-40 px-3.5",
                )}
                id="wallet-filter-periode"
              >
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-44 rounded-2xl">
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="bulan">Bulan Ini</SelectItem>
                <SelectItem value="minggu">Minggu Ini</SelectItem>
                <SelectItem value="hari">Hari Ini</SelectItem>
                <SelectItem value="tahun">Tahun Ini</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Navigator Bar jika periode bukan 'all' */}
            {preset !== "all" && (
              <div className="flex flex-1 sm:flex-initial items-center justify-between sm:justify-start gap-1 bg-surface-strong dark:bg-surface-dark-elevated border border-hairline rounded-full px-2 py-0.5 h-9! text-xs min-w-0">
                {canNavigateDate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevDate}
                    className="h-6 w-6 rounded-full hover:bg-surface-soft dark:hover:bg-surface-dark p-0 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label="Periode sebelumnya"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                )}

                {/* Clickable dateLabel with date input */}
                <div className="relative inline-flex items-center justify-center px-1.5 min-w-0">
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground hover:underline cursor-pointer flex items-center gap-1.5 min-w-0"
                    title="Klik untuk pilih tanggal"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-32.5 sm:max-w-none">{dateLabel}</span>
                  </button>
                  <input
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    value={currentDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleDateLabelPick(e.target.value);
                      }
                    }}
                  />
                </div>

                {canNavigateDate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextDate}
                    className="h-6 w-6 rounded-full hover:bg-surface-soft dark:hover:bg-surface-dark p-0 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label="Periode berikutnya"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls: Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
          {/* Tipe Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1">
            {TIPE_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTipe(tab.value)}
                className={cn(
                  "rounded-full h-8 px-3 text-xs whitespace-nowrap cursor-pointer transition-colors shrink-0",
                  selectedTipe === tab.value
                    ? "bg-foreground text-background font-medium hover:bg-foreground hover:text-background"
                    : "bg-surface-strong text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-input bg-card border-hairline w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Transactions Feed List */}
        <TransaksiList
          transaksi={paginatedTransaksi}
          onDetail={(t) => setSelectedDetailId(t.id)}
          onEdit={openEditTx}
          onDelete={handleDeleteTx}
          deleting={deletingTxId}
        />

        {/* Pagination */}
        {tipeFiltered.length > 0 && (
          <TransaksiPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={tipeFiltered.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* Transaction Detail Sheet */}
      <TransaksiDetailSheet
        open={!!selectedDetailId}
        onOpenChange={(open) => !open && setSelectedDetailId(null)}
        transaksi={detailTransaksi}
        onEdit={openEditTx}
        onCopy={openCopyTx}
        onDelete={handleDeleteTx}
      />

      {/* Add / Edit Transaction Dialog */}
      <TransaksiDialog
        open={txDialogOpen}
        onOpenChange={(open) => {
          setTxDialogOpen(open);
          if (!open) {
            setEditTxData(null);
            setCopyTxData(null);
          }
        }}
        rekening={allRekening}
        kategori={kategori}
        editData={editTxData}
        copyFrom={copyTxData}
        defaultRekeningId={rekening.id}
        lockRekening
        defaultTanggal={currentDate}
        onCreated={(t) => {
          setTransaksi((prev) => [t, ...prev]);
          setUsage((prev) => ({ ...prev, total: prev.total + 1 }));
          router.refresh();
        }}
        onUpdated={(updatedTx: Transaksi & { _isCopySignal?: boolean }) => {
          if (updatedTx._isCopySignal) {
            setEditTxData(null);
            setCopyTxData(updatedTx);
            setTxDialogOpen(true);
            return;
          }
          setTransaksi((prev) => {
            const exists = prev.some((t) => t.id === updatedTx.id);
            const isRelevant =
              updatedTx.rekening_id === rekening.id ||
              updatedTx.rekening_tujuan === rekening.id;
            if (isRelevant) {
              return exists
                ? prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
                : [updatedTx, ...prev];
            } else {
              return prev.filter((t) => t.id !== updatedTx.id);
            }
          });
          router.refresh();
        }}
        onQueued={handleQueued}
      />

      {/* Edit Rekening Dialog */}
      <RekeningDialog
        open={editRekeningOpen}
        onOpenChange={(open) => setEditRekeningOpen(open)}
        editData={rekening}
        onUpdated={(updated) => {
          setRekening(updated);
          router.refresh();
        }}
      />
    </div>
  );
}
