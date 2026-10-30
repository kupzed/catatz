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
import { Input } from "@/components/ui/input";
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
  Calendar as CalendarIcon,
  X,
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
import { useOfflineQueueSync, type DisplayTransaksi } from "@/hooks/use-offline-queue-sync";
import { useTranslation } from "@/i18n/use-translation";
import type { Dictionary } from "@/i18n/types";
import { KategoriStatCards } from "./kategori-stat-cards";

type Props = {
  initialKategori: Kategori;
  initialUsage: KategoriUsageCounts;
  initialTransaksi: Transaksi[];
  allRekening: Rekening[];
  allKategori: Kategori[];
};

function TipeBadge({
  tipe,
  dict,
}: {
  tipe: Kategori["tipe"];
  dict: Dictionary;
}) {
  const isExpense = tipe === "expense";
  const isIncome = tipe === "income";

  const color = isExpense
    ? "text-semantic-down bg-semantic-down/10"
    : isIncome
      ? "text-semantic-up bg-semantic-up/10"
      : "text-primary bg-primary/10";

  const label = isExpense
    ? dict.categories.types.expense
    : isIncome
      ? dict.categories.types.income
      : dict.categories.types.all;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold leading-none",
        color,
      )}
    >
      {label}
    </span>
  );
}

function getUsageDescription(usage: KategoriUsageCounts, dict: Dictionary) {
  const parts = [
    usage.transaksi > 0
      ? dict.categories.usageTx.replace("{count}", String(usage.transaksi))
      : null,
    usage.budget > 0
      ? dict.categories.usageBudget.replace("{count}", String(usage.budget))
      : null,
    usage.recurring > 0
      ? dict.categories.usageRecurring.replace(
          "{count}",
          String(usage.recurring),
        )
      : null,
  ].filter(Boolean);

  return dict.categories.usageWarning.replace("{parts}", parts.join(", "));
}

export function KategoriDetailClient({
  initialKategori,
  initialUsage,
  initialTransaksi,
  allRekening,
  allKategori,
}: Props) {
  const router = useRouter();
  const { dict } = useTranslation();

  // Core States
  const [kategori, setKategori] = useState<Kategori>(initialKategori);
  const [usage, setUsage] = useState<KategoriUsageCounts>(initialUsage);
  const [transaksi, setTransaksi] = useState<Transaksi[]>(initialTransaksi);

  // Sync state if props update from server revalidation
  const [prevKategori, setPrevKategori] = useState(initialKategori);
  if (initialKategori !== prevKategori) {
    setPrevKategori(initialKategori);
    setKategori(initialKategori);
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

  const mergedAllKategori = useMemo(() => {
    const exists = allKategori.some((k) => k.id === kategori.id);
    return exists
      ? allKategori.map((k) => (k.id === kategori.id ? kategori : k))
      : [kategori, ...allKategori];
  }, [allKategori, kategori]);

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
      toast.success(dict.categories.toasts.deleted.replace("{name}", kategori.nama));
      router.push("/categories");
    } else {
      toast.error(res.error ?? dict.categories.toasts.deleteFailed);
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
      toast.success(dict.toast.transactionDeleted);
      router.refresh();
    } else {
      toast.error(res.error ?? dict.toast.error);
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

  const [summaryDescPrefix, summaryDescSuffix] =
    dict.categories.detail.summaryDesc.split("{name}");

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
            {dict.categories.detail.backToCategories}
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
              <TipeBadge tipe={kategori.tipe} dict={dict} />
              {isUsed && (
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-xs font-normal border-hairline bg-surface-strong text-foreground"
                >
                  {dict.categories.usedCount.replace(
                    "{count}",
                    String(usage.total),
                  )}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: 2 cols on mobile (Edit + Hapus 50/50, Tambah full width), auto flex on desktop */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:shrink-0">
          <Button
            variant="outline"
            onClick={() => setEditKategoriOpen(true)}
            className="rounded-full h-10 sm:h-9 px-4 border-hairline hover:bg-surface-soft text-foreground text-xs font-medium gap-1.5 cursor-pointer justify-center"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>{dict.categories.detail.editCategory}</span>
          </Button>

          {isUsed ? (
            <Button
              variant="outline"
              onClick={() => toast.warning(getUsageDescription(usage, dict))}
              className="rounded-full h-10 sm:h-9 px-4 border-hairline hover:bg-surface-soft text-semantic-down hover:text-semantic-down text-xs font-medium gap-1.5 cursor-pointer justify-center"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{dict.categories.detail.deleteCategory}</span>
            </Button>
          ) : (
            <ConfirmDialog
              title={dict.categories.deleteItemConfirmTitle.replace(
                "{name}",
                kategori.nama,
              )}
              description={dict.categories.deleteItemConfirmDescription}
              onConfirm={handleDeleteKategori}
            >
              <Button
                variant="outline"
                className="rounded-full h-10 sm:h-9 px-4 border-hairline hover:bg-surface-soft text-semantic-down hover:text-semantic-down text-xs font-medium gap-1.5 cursor-pointer justify-center w-full"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{dict.categories.detail.deleteCategory}</span>
              </Button>
            </ConfirmDialog>
          )}

          <Button
            onClick={openCreateTx}
            className="col-span-2 sm:col-span-1 rounded-full h-10 sm:h-9 px-4 bg-primary hover:bg-[#003ecc] text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-none justify-center"
            id="btn-tambah-transaksi-kategori"
          >
            <Plus className="h-4 w-4" />
            <span>{dict.categories.detail.addTransaction}</span>
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
              {dict.categories.detail.summaryTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {summaryDescPrefix}
              <strong className="text-foreground">{kategori.nama}</strong>
              {summaryDescSuffix ?? ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-4 rounded-full border border-hairline shrink-0"
              style={{ backgroundColor: kategori.warna }}
              title={dict.categories.detail.colorCodeTitle.replace(
                "{color}",
                kategori.warna ?? "",
              )}
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
                {dict.categories.detail.txHistoryTitle}
              </h2>
              <Badge
                variant="secondary"
                className="text-xs px-2.5 py-0.5 rounded-full bg-surface-strong text-muted-foreground border-none font-mono"
              >
                {dict.categories.detail.dataCount.replace(
                  "{count}",
                  String(tipeFiltered.length),
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dict.categories.detail.txHistorySubtitle}
            </p>
          </div>

          {/* Controls Periode & Navigasi Tanggal (Identik dengan Rekening & Index Transaksi) */}
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
                id="kategori-filter-periode"
              >
                <SelectValue placeholder={dict.categories.detail.periodPlaceholder} />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-44 rounded-2xl">
                <SelectItem value="all">{dict.categories.detail.periodAll}</SelectItem>
                <SelectItem value="bulan">{dict.categories.detail.periodMonth}</SelectItem>
                <SelectItem value="minggu">{dict.categories.detail.periodWeek}</SelectItem>
                <SelectItem value="hari">{dict.categories.detail.periodDay}</SelectItem>
                <SelectItem value="tahun">{dict.categories.detail.periodYear}</SelectItem>
                <SelectItem value="custom">{dict.categories.detail.periodCustom}</SelectItem>
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
                    aria-label={dict.categories.detail.prevPeriodAria}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                )}

                {/* Clickable dateLabel with date input */}
                <div className="relative inline-flex items-center justify-center px-1.5 min-w-0">
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground hover:underline cursor-pointer flex items-center gap-1.5 min-w-0"
                    title={dict.categories.detail.clickDatePick}
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
                    aria-label={dict.categories.detail.nextPeriodAria}
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
          {kategori.tipe === "all" ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1">
              {[
                { label: dict.categories.types.all, value: "all" as const },
                { label: dict.categories.types.expense, value: "expense" as const },
                { label: dict.categories.types.income, value: "income" as const },
              ].map((tab) => (
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
          ) : (
            <div />
          )}

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={dict.categories.detail.searchTxPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-input bg-card border-hairline w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={dict.categories.detail.clearSearchAria}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
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
          router.refresh();
        }}
      />

      {/* Transaksi Dialog (Tambah / Edit / Copy) */}
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
        kategori={mergedAllKategori}
        editData={editTxData}
        copyFrom={copyTxData}
        defaultKategoriId={kategori.id}
        lockKategori={true}
        defaultTanggal={currentDate}
        onCreated={(newTx) => {
          if (newTx.kategori_id === kategori.id) {
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
          }
          router.refresh();
        }}
        onUpdated={(updatedTx) => {
          setTransaksi((prev) => {
            const exists = prev.some((t) => t.id === updatedTx.id);
            if (updatedTx.kategori_id === kategori.id) {
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
