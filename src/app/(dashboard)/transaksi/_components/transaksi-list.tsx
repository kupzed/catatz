"use client";

import type { DisplayTransaksi } from "@/hooks/use-offline-queue-sync";
import type { Rekening } from "@/types/rekening";
import { ArrowLeftRight } from "lucide-react";
import { TransaksiListItem } from "./transaksi-list-item";

export type TransaksiListProps = {
  transaksi: DisplayTransaksi[];
  rekening: Rekening[];
  onEdit: (transaksi: DisplayTransaksi) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
};

export function TransaksiList({
  transaksi,
  onEdit,
  onDelete,
  deleting,
}: TransaksiListProps) {
  return (
    <div className="rounded-card border border-hairline overflow-hidden">
      {transaksi.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Belum ada transaksi</p>
          <p className="text-xs mt-1">Klik tombol Tambah untuk mulai mencatat</p>
        </div>
      ) : (
        transaksi.map((item) => (
          <TransaksiListItem
            key={item.id}
            transaksi={item}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={deleting === item.id}
          />
        ))
      )}
    </div>
  );
}
