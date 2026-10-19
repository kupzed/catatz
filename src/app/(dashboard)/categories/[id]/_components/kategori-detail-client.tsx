"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type {
  Kategori,
  KategoriUsageCounts,
  Transaksi,
  TipeTransaksi,
} from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";
import { useSetBreadcrumbTitle } from "@/providers/breadcrumb-title-provider";
import { deleteKategori } from "@/actions/kategori-action";
import { deleteTransaksi } from "@/actions/transaksi-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClearableInput } from "@/components/common/clearable-input";
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
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import KategoriDialog from "../../_components/kategori-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
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
import { KategoriStatCards } from "./kategori-stat-cards";

type Props = {
  initialKategori: Kategori;
  initialUsage: KategoriUsageCounts;
  initialTransaksi: Transaksi[];
  allRekening: Rekening[];
  allKategori: Kategori[];
};

const TIPE_CONFIG = {
  expense: {
    label: "Pengeluaran",
    color: "text-semantic-down bg-semantic-down/10",
  },
  income: {
    label: "Pemasukan",
    color: "text-semantic-up bg-semantic-up/10",
  },
  all: {
    label: "Semua Tipe",
    color: "text-primary bg-primary/10",
  },
} as const;

function TipeBadge({ tipe }: { tipe: Kategori["tipe"] }) {
  const cfg = TIPE_CONFIG[tipe] ?? TIPE_CONFIG.all;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold leading-none",
        cfg.color,
      )}
    >
      {cfg.label}
    </span>
  );
}

function usageDescription(usage: KategoriUsageCounts) {
  const parts = [
    usage.transaksi > 0 ? `${usage.transaksi} transaksi` : null,
    usage.budget > 0 ? `${usage.budget} budget bulanan` : null,
    usage.recurring > 0 ? `${usage.recurring} template transaksi berulang` : null,
  ].filter(Boolean);

  return `Kategori ini masih dipakai oleh ${parts.join(", ")}. Hapus atau ubah data terkait terlebih dahulu sebelum menghapus kategori.`;
}

export function KategoriDetailClient({
  initialKategori,
  initialUsage,
  initialTransaksi,
  allRekening,
  allKategori,
}: Props) {
  const router = useRouter();

  // Core States
  const [kategori, setKategori] = useState<Kategori>(initialKategori);
  const [usage, setUsage] = useState<KategoriUsageCounts>(initialUsage);
  const [transaksi, setTransaksi] = useState<Transaksi[]>(initialTransaksi);

  // Set topnav breadcrumb title to nama kategori
  useSetBreadcrumbTitle(kategori.nama);

  // Dialog States
  const [editKategoriOpen, setEditKategoriOpen] = useState(false);
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
    kategori: allKategori,
    onSyncSuccess: handleSyncSuccess,
  });

  const displayTransaksi = useMemo<DisplayTransaksi[]>(() => {
    const combined = [...pendingCreateTransaksi, ...transaksi];
    // Filter hanya transaksi yang menggunakan kategori ini
    return combined.filter((t) => t.kategori_id === kategori.id);
  }, [pendingCreateTransaksi, transaksi, kategori.id]);

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

  // Reset page saat filter berubah
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
  async function handleDeleteKategori() {
    const res = await deleteKategori(kategori.id);
    if (res.success) {
      toast.success(`Kategori "${kategori.nama}" berhasil dihapus`);
      router.push("/categories");
    } else {
      toast.error(res.error ?? "Gagal menghapus kategori");
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
        transaksi: Math.max(0, prev.transaksi - 1),
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

  const isUsed = usage.total > 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/categories")}
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground rounded-full h-8 px-2.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Kategori
          </Button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className="w-10 h-10 rounded-input flex items-center justify-center text-xl shrink-0"
              style={{
                background: kategori.warna ? `${kategori.warna}20` : undefined,
              }}
            >
              {kategori.ikon ?? "📂"}
            </div>
            <h1 className="text-2xl sm:text-[32px] font-normal tracking-[-0.4px] text-foreground">
              {kategori.nama}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <TipeBadge tipe={kategori.tipe} />
              {isUsed && (
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-xs font-normal border-hairline bg-surface-strong text-foreground"
                >
                  Dipakai {usage.total} data
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setEditKategoriOpen(true)}
            className="rounded-full h-10 sm:h-9 px-4 border-hairline hover:bg-surface-soft text-foreground text-xs font-medium gap-1.5 cursor-pointer justify-center"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>

          {isUsed ? (
            <Button
              variant="outline"
              onClick={() => toast.warning(usageDescription(usage))}
              className="rounded-full h-10 sm:h-9 px-4 border-hairline hover:bg-surface-soft text-semantic-down hover:text-semantic-down text-xs font-medium gap-1.5 cursor-pointer justify-center"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus</span>
            </Button>
          ) : (
            <ConfirmDialog
              title={`Hapus kategori "${kategori.nama}"?`}
              description="Tindakan ini tidak dapat dibatalkan. Kategori ini akan dihapus permanen."
              onConfirm={handleDeleteKategori}
            >
              <Button
                variant="outline"
                className="rounded-full h-10 sm:h-9 px-4 border-hairline hover:bg-surface-soft text-semantic-down hover:text-semantic-down text-xs font-medium gap-1.5 cursor-pointer justify-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus</span>
              </Button>
            </ConfirmDialog>
          )}

          <Button
            onClick={openCreateTx}
            className="rounded-full h-10 sm:h-9 px-4 bg-primary hover:bg-[#003ecc] text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-none justify-center"
            id="btn-tambah-transaksi-kategori"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </Button>
        </div>
      </div>

      {/* Category Hero Accent Card */}
      <div
        className="rounded-card border border-hairline bg-card p-5 sm:p-6 transition-colors border-t-4"
        style={{ borderTopColor: kategori.warna ?? "#0052ff" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Ringkasan Kategori
            </p>
            <p className="text-sm text-muted-foreground">
              Menampilkan seluruh riwayat transaksi, alokasi anggaran, dan frekuensi pencatatan untuk kategori <strong className="text-foreground">{kategori.nama}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-4 rounded-full border border-hairline shrink-0"
              style={{ backgroundColor: kategori.warna }}
              title={`Kode warna: ${kategori.warna}`}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {kategori.warna}
            </span>
          </div>
        </div>
      </div>

      {/* Category Statistics */}
      <KategoriStatCards
        kategori={kategori}
        usage={usage}
        transaksi={filtered}
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
              Catatan transaksi terkait kategori ini
            </p>
          </div>

          {/* Controls Periode & Navigasi Tanggal */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={preset}
              onValueChange={(val) => {
                setPreset(val);
                setBaseDate(new Date());
                setCustomStep("dari");
                if (val !== "custom") {
                  setDateFilter({ dari: undefined, sampai: undefined });
                }
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-32.5 rounded-full text-xs font-medium border-hairline bg-card cursor-pointer">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="this_month">Bulan Ini</SelectItem>
                <SelectItem value="last_30_days">30 Hari Terakhir</SelectItem>
                <SelectItem value="this_year">Tahun Ini</SelectItem>
                <SelectItem value="custom">Pilih Tanggal</SelectItem>
              </SelectContent>
            </Select>

            {preset !== "all" && (
              <div className="flex items-center border border-hairline rounded-full bg-card overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full cursor-pointer hover:bg-surface-soft"
                  onClick={handlePrevDate}
                  disabled={!canNavigateDate}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="relative flex items-center justify-center min-w-25 px-2">
                  <span className="text-xs font-semibold text-foreground pointer-events-none select-none">
                    {dateLabel}
                  </span>
                  <input
                    type={preset === "this_year" ? "number" : "date"}
                    value={currentDate}
                    onChange={(e) => handleDateLabelPick(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pilih tanggal"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full cursor-pointer hover:bg-surface-soft"
                  onClick={handleNextDate}
                  disabled={!canNavigateDate}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter bar: Search + Tipe filter tabs (jika kategori.tipe === 'all') */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <ClearableInput
              placeholder="Cari transaksi pada kategori ini..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              className="pl-9 h-10 rounded-input border-hairline bg-card text-xs"
            />
          </div>

          {kategori.tipe === "all" && (
            <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-strong p-1 sm:inline-grid sm:w-auto shrink-0">
              {[
                { label: "Semua", value: "all" as const },
                { label: "Pengeluaran", value: "expense" as const },
                { label: "Pemasukan", value: "income" as const },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTipe(tab.value)}
                  className={cn(
                    "inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors",
                    selectedTipe === tab.value
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transaksi List */}
        <TransaksiList
          transaksi={paginatedTransaksi}
          onDetail={(t) => setSelectedDetailId(t.id)}
          onEdit={openEditTx}
          onDelete={handleDeleteTx}
          deleting={deletingTxId}
        />

        {/* Pagination */}
        {tipeFiltered.length > 0 && (
          <div className="pt-2">
            <TransaksiPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={tipeFiltered.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* Edit Kategori Dialog */}
      <KategoriDialog
        open={editKategoriOpen}
        onOpenChange={setEditKategoriOpen}
        editData={kategori}
        onUpdated={(updated) => {
          setKategori(updated);
          toast.success("Kategori berhasil diperbarui");
          router.refresh();
        }}
      />

      {/* Transaksi Dialog (Tambah / Edit / Copy) */}
      <TransaksiDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        rekening={allRekening}
        kategori={allKategori}
        editData={editTxData}
        copyFrom={copyTxData}
        defaultKategoriId={kategori.id}
        onCreated={(newTx) => {
          setTransaksi((prev) => [newTx, ...prev]);
          setUsage((prev) => ({
            ...prev,
            total: prev.total + 1,
            transaksi: prev.transaksi + 1,
            transaksi_masuk:
              newTx.tipe === "income"
                ? prev.transaksi_masuk + 1
                : prev.transaksi_masuk,
            transaksi_keluar:
              newTx.tipe === "expense"
                ? prev.transaksi_keluar + 1
                : prev.transaksi_keluar,
          }));
          router.refresh();
        }}
        onUpdated={(updatedTx) => {
          setTransaksi((prev) =>
            prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
          );
          router.refresh();
        }}
        onQueued={handleQueued}
      />

      {/* Transaksi Detail Sheet */}
      <TransaksiDetailSheet
        transaksi={detailTransaksi}
        open={!!selectedDetailId}
        onOpenChange={(open) => {
          if (!open) setSelectedDetailId(null);
        }}
        onEdit={(t) => openEditTx(t as DisplayTransaksi)}
        onDelete={handleDeleteTx}
        onCopy={(t) => openCopyTx(t as DisplayTransaksi)}
      />
    </div>
  );
}
