"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type {
  JenisRekening,
  Rekening,
  RekeningUsageCounts,
} from "@/types/rekening";
import type { Kategori, Transaksi, TipeTransaksi } from "@/types/transaksi";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { toggleExcludeTotal } from "@/actions/rekening-action";
import { deleteTransaksi } from "@/actions/transaksi-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
    dateFilter,
    handlePrevDate,
    handleNextDate,
    dateLabel,
    canNavigateDate,
  } = useDateNavigation();

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/wallets")}
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground rounded-full h-8 px-2.5 mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Rekening
          </Button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[32px] font-normal tracking-[-0.4px] text-foreground">
              {rekening.nama}
            </h1>
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditRekeningOpen(true)}
            className="rounded-full h-9 px-3.5 border-hairline hover:bg-surface-soft text-foreground text-xs font-medium gap-1.5 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Rekening
          </Button>

          <Button
            size="sm"
            onClick={openCreateTx}
            className="rounded-full h-9 px-4 bg-primary hover:bg-[#003ecc] text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-none"
            id="btn-tambah-transaksi-wallet"
          >
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Saldo Card */}
      <div
        className="rounded-card border border-hairline bg-card p-6 sm:p-8 transition-colors border-t-4"
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

          <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
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
            <h2 className="text-lg font-semibold text-foreground">
              Histori Transaksi
            </h2>
            <p className="text-xs text-muted-foreground">
              Menampilkan {tipeFiltered.length} transaksi di rekening ini
            </p>
          </div>

          {/* Date Preset Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["semua", "bulan", "minggu", "hari"] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setPreset(p)}
                className={cn(
                  "rounded-full h-8 px-3 text-xs capitalize transition-colors",
                  preset === p
                    ? "bg-primary text-white font-semibold hover:bg-primary hover:text-white"
                    : "bg-surface-strong text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "semua" ? "Semua Waktu" : p}
              </Button>
            ))}

            {canNavigateDate && (
              <div className="flex items-center gap-1 ml-1 bg-surface-strong rounded-full px-2 py-0.5 text-xs text-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevDate}
                  className="h-6 w-6 rounded-full hover:bg-surface-soft p-0"
                  aria-label="Periode sebelumnya"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-1 text-[11px] font-medium whitespace-nowrap">
                  {dateLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDate}
                  className="h-6 w-6 rounded-full hover:bg-surface-soft p-0"
                  aria-label="Periode berikutnya"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls: Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Tipe Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {TIPE_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTipe(tab.value)}
                className={cn(
                  "rounded-full h-8 px-3 text-xs whitespace-nowrap cursor-pointer transition-colors",
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
          <div className="relative min-w-55 sm:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-input bg-card border-hairline"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
        onCreated={(t) => {
          setTransaksi((prev) => [t, ...prev]);
          setUsage((prev) => ({ ...prev, total: prev.total + 1 }));
          router.refresh();
        }}
        onUpdated={(t) => {
          setTransaksi((prev) => prev.map((item) => (item.id === t.id ? t : item)));
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
