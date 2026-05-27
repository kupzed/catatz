"use client";

import type { DisplayTransaksi } from "@/hooks/use-offline-queue-sync";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TIPE_CONFIG } from "@/constants/transaksi";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export type TransaksiListItemProps = {
  transaksi: DisplayTransaksi;
  onEdit: (transaksi: DisplayTransaksi) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function TransaksiListItem({
  transaksi,
  onEdit,
  onDelete,
  isDeleting,
}: TransaksiListItemProps) {
  const cfg = TIPE_CONFIG[transaksi.tipe] ?? TIPE_CONFIG.expense;
  const TipeIcon = cfg.icon;
  const displayName = transaksi.judul || transaksi.catatan || cfg.label;

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border-b border-hairline last:border-b-0 bg-transparent hover:bg-surface-soft transition-colors">
      {/* Mobile: Top Row (Icon, Title, Amount) */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-full bg-surface-strong flex items-center justify-center shrink-0">
          {transaksi.kategori?.ikon ?? (
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
              {transaksi.kategori
                ? `${transaksi.kategori.ikon} ${transaksi.kategori.nama}`
                : cfg.label}
            </Badge>
            {transaksi._pendingSync && (
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
              transaksi.tipe === "income"
                ? "text-semantic-up"
                : transaksi.tipe === "expense"
                  ? "text-semantic-down"
                  : transaksi.tipe === "correction"
                    ? "text-accent-yellow"
                    : "text-foreground",
            )}
          >
            {transaksi.tipe === "income"
              ? "+"
              : transaksi.tipe === "expense"
                ? "-"
                : ""}
            {formatRupiah(Number(transaksi.nominal))}
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
            {transaksi.kategori
              ? `${transaksi.kategori.ikon} ${transaksi.kategori.nama}`
              : cfg.label}
          </Badge>
          {transaksi._pendingSync && (
            <Badge className="border-0 bg-accent-yellow/10 px-1.5 py-0 text-[10px] text-accent-yellow">
              Menunggu sinkronisasi
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTanggal(transaksi.tanggal)}
          </span>
          {transaksi.rekening && (
            <span className="text-xs text-muted-foreground truncate max-w-30">
              {"\u00B7"} {transaksi.rekening.nama}
            </span>
          )}
          {transaksi.tipe === "transfer" && transaksi.rekening_tujuan_data && (
            <span className="text-xs text-muted-foreground truncate max-w-30">
              {"\u2192"} {transaksi.rekening_tujuan_data.nama}
            </span>
          )}
        </div>
      </div>

      {/* Desktop Amount */}
      <div className="hidden sm:block text-right px-2">
        <p
          className={cn(
            "font-mono font-semibold text-sm",
            transaksi.tipe === "income"
              ? "text-semantic-up"
              : transaksi.tipe === "expense"
                ? "text-semantic-down"
                : transaksi.tipe === "correction"
                  ? "text-accent-yellow"
                  : "text-foreground",
          )}
        >
          {transaksi.tipe === "income"
            ? "+"
            : transaksi.tipe === "expense"
              ? "-"
              : ""}
          {formatRupiah(Number(transaksi.nominal))}
        </p>
      </div>

      {/* Mobile Bottom Row (Meta & Actions) */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-dashed sm:border-0 sm:mt-0 sm:pt-0 w-full sm:w-auto">
        <div className="flex flex-col sm:hidden">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatTanggal(transaksi.tanggal)}</span>
            {transaksi.rekening && (
              <span>
                {"\u00B7"} {transaksi.rekening.nama}
              </span>
            )}
            {transaksi.tipe === "transfer" &&
              transaksi.rekening_tujuan_data && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {"\u2192"} {transaksi.rekening_tujuan_data.nama}
                </div>
              )}
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-surface-strong hover:bg-surface-strong/80"
            disabled={transaksi._pendingSync}
            onClick={() => onEdit(transaksi)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <ConfirmDialog
            title={
              transaksi.tipe === "correction"
                ? "Hapus Koreksi Saldo?"
                : "Hapus Transaksi?"
            }
            description={
              transaksi.tipe === "correction"
                ? "Koreksi saldo ini akan dihapus. Saldo rekening TIDAK akan otomatis dibalik."
                : "Transaksi ini akan dihapus secara permanen."
            }
            onConfirm={() => onDelete(transaksi.id)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </ConfirmDialog>
        </div>
      </div>
    </div>
  );
}
