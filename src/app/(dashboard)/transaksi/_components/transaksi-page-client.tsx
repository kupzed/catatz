"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Kategori, Transaksi } from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";
import { todayISODate } from "@/lib/utils";
import { deleteTransaksi } from "@/actions/transaksi-action";
import {
  addToQueue,
  removeFromQueue,
  type QueuedAction,
} from "@/lib/offline-queue";
import { useDateNavigation } from "@/hooks/use-date-navigation";
import {
  useOfflineQueueSync,
  type DisplayTransaksi,
} from "@/hooks/use-offline-queue-sync";
import { useTransaksiFilter } from "@/hooks/use-transaksi-filter";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common";
import TransaksiDialog from "./transaksi-dialog";
import { TransaksiFilterBar } from "./transaksi-filter-bar";
import { TransaksiList } from "./transaksi-list";
import { TransaksiSummaryCard } from "./transaksi-summary-card";

type Props = {
  initialTransaksi: Transaksi[];
  rekening: Rekening[];
  kategori: Kategori[];
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
  const [deleting, setDeleting] = useState<string | null>(null);

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
  } = useDateNavigation();

  const searchParams = useSearchParams();
  const router = useRouter();
  const handleSyncSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const { pendingCreateTransaksi, handleQueued } = useOfflineQueueSync({
    rekening,
    kategori,
    onSyncSuccess: handleSyncSuccess,
  });

  const displayTransaksi = useMemo<DisplayTransaksi[]>(
    () => [...pendingCreateTransaksi, ...transaksi],
    [pendingCreateTransaksi, transaksi],
  );

  const { filter, search, setFilter, setSearch, filtered } =
    useTransaksiFilter<DisplayTransaksi>({
      transaksi: displayTransaksi,
      preset,
      baseDate,
      dateFilter,
    });

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

  // Summary totals (correction tidak masuk hitungan income/expense)
  const totalIncome = filtered
    .filter((t) => t.tipe === "income")
    .reduce((s, t) => s + Number(t.nominal), 0);
  const totalExpense = filtered
    .filter((t) => t.tipe === "expense")
    .reduce((s, t) => s + Number(t.nominal), 0);

  const currentDate = useMemo(() => {
    if (preset === "custom") {
      return customStep === "dari"
        ? dateFilter.dari || ""
        : dateFilter.sampai || "";
    }

    return format(baseDate, "yyyy-MM-dd");
  }, [baseDate, customStep, dateFilter.dari, dateFilter.sampai, preset]);

  const defaultDialogTanggal = useMemo(() => {
    if (preset === "all") return todayISODate();
    if (preset === "custom") return dateFilter.dari ?? todayISODate();

    return format(baseDate, "yyyy-MM-dd");
  }, [baseDate, dateFilter.dari, preset]);

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

  function handleDialogQueued(action: QueuedAction) {
    handleQueued(action);
    setDialogOpen(false);
    setEditData(null);
    setCopyFrom(null);
  }

  function handleAddClick() {
    setEditData(null);
    setCopyFrom(null);
    setDialogOpen(true);
  }

  function handleEdit(t: DisplayTransaksi) {
    setEditData(t);
    setCopyFrom(null);
    setDialogOpen(true);
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Transaksi"
        subtitle="Riwayat arus kas Anda"
        titleClassName="truncate"
        subtitleClassName="truncate"
        subtitleAction={
          <Badge
            variant="secondary"
            className="text-xs px-2.5 py-0.5 rounded-full bg-surface-strong text-muted-foreground border-none shrink-0"
          >
            {filtered.length} Data
          </Badge>
        }
        action={
          <div className="shrink-0">
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
        }
      />

      <TransaksiSummaryCard
        dateLabel={dateLabel}
        canNavigateDate={canNavigateDate}
        onPrev={handlePrevDate}
        onNext={handleNextDate}
        onDatePick={handleDateLabelPick}
        preset={preset}
        currentDate={currentDate}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      <TransaksiFilterBar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        rekening={rekening}
        onAddClick={handleAddClick}
      />

      <TransaksiList
        transaksi={filtered}
        rekening={rekening}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleting={deleting}
      />

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
        onQueued={handleDialogQueued}
      />
    </div>
  );
}
