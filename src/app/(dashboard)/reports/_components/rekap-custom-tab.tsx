"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, Plus } from "lucide-react";
import { toast } from "sonner";
import { getRekapRingkasanPeriodeList } from "@/actions/rekap-action";
import { listCustomPeriods } from "@/actions/rekap-period-action";
import { getSaldoPeriodeList } from "@/actions/rekap-saldo-action";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPeriodLabel, getTodayInJakarta } from "@/lib/rekap-period";
import type { CustomPeriod, RekapSettings } from "@/types/rekap";
import { useTranslation } from "@/i18n/use-translation";
import { RekapCustomDialog } from "./rekap-custom-dialog";
import { RekapPeriodCard, type RekapPeriodCardData } from "./rekap-period-card";

export type RekapCustomTabProps = {
  settings: RekapSettings;
};

export function RekapCustomTab({ settings }: RekapCustomTabProps) {
  const { dict, locale } = useTranslation();
  const rekapLocale = locale === "en" ? "en-US" : "id-ID";
  const [periods, setPeriods] = useState<CustomPeriod[]>([]);
  const [items, setItems] = useState<RekapPeriodCardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State Dialog Tambah / Edit
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<CustomPeriod | null>(null);

  const today = useMemo(() => getTodayInJakarta(), []);

  // Helper pure data fetcher tanpa setState langsung
  const fetchCustomPeriodData = useCallback(async (): Promise<{
    customList: CustomPeriod[];
    mapped: RekapPeriodCardData[];
  }> => {
    const res = await listCustomPeriods();
    if (!res.success || !res.data) {
      toast.error(res.error ?? dict.reports.toasts.loadCustomFailed);
      return { customList: [], mapped: [] };
    }

    const customList = res.data;
    if (customList.length === 0) {
      return { customList: [], mapped: [] };
    }

    const ranges = customList.map((p) => ({
      startDate: p.tanggal_mulai,
      endDate: p.tanggal_selesai,
      label: formatPeriodLabel(p.tanggal_mulai, p.tanggal_selesai, rekapLocale),
    }));

    const [ringkasanList, saldoResult] = await Promise.all([
      getRekapRingkasanPeriodeList(ranges),
      settings.akumulasi_saldo
        ? getSaldoPeriodeList(ranges)
        : Promise.resolve({ success: true, data: [] }),
    ]);

    const ringkasanMap = new Map(
      ringkasanList.map((r) => [`${r.startDate}_${r.endDate}`, r]),
    );

    const saldoMap = new Map(
      (saldoResult.success && saldoResult.data ? saldoResult.data : []).map(
        (s) => [`${s.startDate}_${s.endDate}`, s],
      ),
    );

    const mapped: RekapPeriodCardData[] = customList.map((p) => {
      const key = `${p.tanggal_mulai}_${p.tanggal_selesai}`;
      const ringkasan = ringkasanMap.get(key);
      const saldo = saldoMap.get(key);

      const isCurrent = today >= p.tanggal_mulai && today <= p.tanggal_selesai;

      return {
        id: p.id,
        nama: p.nama,
        startDate: p.tanggal_mulai,
        endDate: p.tanggal_selesai,
        label: formatPeriodLabel(p.tanggal_mulai, p.tanggal_selesai, rekapLocale),
        isCurrent,
        total_expense: ringkasan?.total_expense ?? 0,
        total_income: ringkasan?.total_income ?? 0,
        net: ringkasan?.net ?? 0,
        net_arus_kas_hutang_piutang:
          ringkasan?.net_arus_kas_hutang_piutang ?? 0,
        koreksi: ringkasan?.koreksi,
        saldo_awal: saldo?.saldo_awal,
        saldo_akhir: saldo?.saldo_akhir,
      };
    });

    return { customList, mapped };
  }, [dict.reports.toasts.loadCustomFailed, rekapLocale, settings.akumulasi_saldo, today]);

  // Track previous settings akumulasi_saldo untuk update loading state saat render
  const [prevAkumulasi, setPrevAkumulasi] = useState(settings.akumulasi_saldo);
  if (prevAkumulasi !== settings.akumulasi_saldo) {
    setPrevAkumulasi(settings.akumulasi_saldo);
    setIsLoading(true);
  }

  // Load awal dan refetch saat setting berubah
  useEffect(() => {
    let ignore = false;

    fetchCustomPeriodData()
      .then(({ customList, mapped }) => {
        if (!ignore) {
          setPeriods(customList);
          setItems(mapped);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Gagal memuat rekap custom:", err);
          toast.error("Gagal memuat data periode kustom");
          setPeriods([]);
          setItems([]);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [fetchCustomPeriodData]);

  // Reload callback setelah mutasi dialog (tambah, edit, hapus)
  const reloadData = useCallback(() => {
    setIsLoading(true);
    fetchCustomPeriodData()
      .then(({ customList, mapped }) => {
        setPeriods(customList);
        setItems(mapped);
      })
      .catch((err) => {
        console.error("Gagal memuat rekap custom:", err);
        toast.error("Gagal memuat data periode kustom");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fetchCustomPeriodData]);

  // Handler membuka dialog tambah
  const handleOpenAdd = () => {
    setEditingPeriod(null);
    setIsDialogOpen(true);
  };

  // Handler membuka dialog edit
  const handleOpenEdit = (periodId: string) => {
    const found = periods.find((p) => p.id === periodId);
    if (found) {
      setEditingPeriod(found);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="relative space-y-6 pb-20">
      {/* Skeleton Loading State */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-card border border-hairline bg-card p-5 sm:p-6"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="size-4 rounded-full" />
              </div>
              <div className="mt-3 space-y-2.5">
                {Array.from({ length: settings.akumulasi_saldo ? 6 : 4 }).map(
                  (_, j) => (
                    <div key={j} className="flex justify-between py-1">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-4 w-28 rounded" />
                    </div>
                  ),
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <Card className="rounded-card border border-hairline bg-card">
          <div className="p-8">
            <EmptyState
              icon={CalendarRange}
              title={dict.reports.emptyState.customTitle}
              description={dict.reports.emptyState.customDesc}
              action={
                <Button
                  type="button"
                  onClick={handleOpenAdd}
                  className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90 h-11 min-h-11 gap-2 transition-colors"
                >
                  <Plus className="size-4" />
                  <span>{dict.reports.emptyState.createCustomButton}</span>
                </Button>
              }
            />
          </div>
        </Card>
      ) : (
        /* Grid Kartu Periode Kustom dengan Perataan Tinggi Sama (items-stretch) */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {items.map((item) => (
            <RekapPeriodCard
              key={item.id ?? `${item.startDate}_${item.endDate}`}
              period={item}
              akumulasiAktif={settings.akumulasi_saldo}
              jenis="custom"
              onEdit={() => item.id && handleOpenEdit(item.id)}
            />
          ))}
        </div>
      )}

      {/*
        Floating Action Button (FAB)
        Posisi:
        - Mobile: fixed right-4 bottom-[calc(7.5rem+env(safe-area-inset-bottom))]
          Menghindari tabrakan dengan:
          1. OfflineIndicator (fixed inset-x-3 bottom-3, tinggi ~44px s/d 56px)
          2. Tombol iOS install guide (fixed right-4 bottom-16, tinggi 40px s/d 104px)
          Memberikan celah aman 16px di atas tombol iOS install guide.
        - Desktop (md+): fixed right-8 bottom-8
        - Tap target: h-12 min-h-[44px] px-5 (memenuhi kriteria aksesibilitas)
      */}
      <Button
        type="button"
        onClick={handleOpenAdd}
        aria-label={dict.reports.customDialog.newPeriodAria}
        className="fixed right-4 md:right-8 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] md:bottom-8 z-40 h-12 min-h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
      >
        <Plus className="size-5 shrink-0" />
        <span className="font-medium">{dict.reports.customDialog.newPeriodButton}</span>
      </Button>

      {/* Modal Dialog Tambah / Edit Periode Kustom */}
      <RekapCustomDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editData={editingPeriod}
        onSuccess={reloadData}
      />
    </div>
  );
}
