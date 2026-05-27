"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getQueue,
  offlineQueueChangedEvent,
  processQueue,
  type QueuedAction,
} from "@/lib/offline-queue";
import type { Rekening } from "@/types/rekening";
import type { Kategori, Transaksi } from "@/types/transaksi";

export type DisplayTransaksi = Transaksi & {
  _queuedId?: string;
  _pendingSync?: boolean;
};

export type UseOfflineQueueSyncParams = {
  rekening: Rekening[];
  kategori: Kategori[];
  onSyncSuccess: () => void;
};

export type UseOfflineQueueSyncReturn = {
  queuedActions: QueuedAction[];
  pendingCreateTransaksi: DisplayTransaksi[];
  handleQueued: (action: QueuedAction) => void;
};

/** Mengelola sinkronisasi offline queue dan transaksi pending di halaman transaksi. */
export function useOfflineQueueSync({
  rekening,
  kategori,
  onSyncSuccess,
}: UseOfflineQueueSyncParams): UseOfflineQueueSyncReturn {
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);

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
        onSyncSuccess();
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
  }, [onSyncSuccess]);

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

  function handleQueued(action: QueuedAction) {
    setQueuedActions((prev) => [
      action,
      ...prev.filter((item) => item.id !== action.id),
    ]);
  }

  return {
    queuedActions,
    pendingCreateTransaksi,
    handleQueued,
  };
}
