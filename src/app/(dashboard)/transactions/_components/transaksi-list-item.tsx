"use client";

import type { DisplayTransaksi } from "@/hooks/use-offline-queue-sync";
import { cn } from "@/lib/utils";
import { getTipeConfig } from "@/constants/transaksi";
import { getTransaksiDisplayName } from "@/lib/transaksi-detail";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

export type TransaksiListItemProps = {
  transaksi: DisplayTransaksi;
  onEdit: (transaksi: DisplayTransaksi) => void;
  onDelete: (id: string) => void;
  onDetail?: (transaksi: DisplayTransaksi) => void;
  isDeleting: boolean;
};

export function TransaksiListItem({
  transaksi,
  onEdit,
  onDelete,
  onDetail,
  isDeleting,
}: TransaksiListItemProps) {
  const { formatRupiah, formatTanggal, formatWaktu } = useSystemPreferences();
  const { dict } = useTranslation();
  const tipeConfig = getTipeConfig(dict);
  const cfg = tipeConfig[transaksi.tipe] ?? tipeConfig.expense;
  const TipeIcon = cfg.icon;
  const isTransferOrCorrection =
    transaksi.tipe === "transfer" || transaksi.tipe === "correction";
  const displayName = getTransaksiDisplayName(transaksi, dict);
  const waktuLabel = formatWaktu(transaksi.waktu);
  const categoryBadgeText = transaksi.kategori
    ? `${transaksi.kategori.ikon ? `${transaksi.kategori.ikon} ` : ""}${transaksi.kategori.nama}`
    : !isTransferOrCorrection
      ? cfg.label
      : null;

  return (
    <div
      onClick={() => onDetail?.(transaksi)}
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border-b border-hairline last:border-b-0 bg-transparent hover:bg-surface-soft transition-colors text-left",
        onDetail && "cursor-pointer",
      )}
    >
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
          {(categoryBadgeText || transaksi._pendingSync) && (
            <div className="flex items-center gap-1 mt-0.5">
              {categoryBadgeText && (
                <Badge
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full border-0",
                    cfg.badge,
                  )}
                >
                  {categoryBadgeText}
                </Badge>
              )}
              {transaksi._pendingSync && (
                <Badge className="border-0 bg-accent-yellow/10 px-1 py-0 text-[10px] text-accent-yellow">
                  {dict.transactions.pendingSync}
                </Badge>
              )}
            </div>
          )}
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
          {categoryBadgeText && (
            <Badge
              className={cn(
                "text-xs px-2.5 py-0.5 rounded-full border-0",
                cfg.badge,
              )}
            >
              {categoryBadgeText}
            </Badge>
          )}
          {transaksi._pendingSync && (
            <Badge className="border-0 bg-accent-yellow/10 px-1.5 py-0 text-[10px] text-accent-yellow">
              {dict.transactions.pendingSync}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
            {formatTanggal(transaksi.tanggal)}
          </span>
          {waktuLabel && (
            <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
              {"\u00B7"} {waktuLabel}
            </span>
          )}
          {transaksi.rekening && (
            <span className="text-xs text-muted-foreground truncate max-w-35">
              {"\u00B7"} {transaksi.rekening.nama}
            </span>
          )}
          {transaksi.tipe === "transfer" && transaksi.rekening_tujuan_data && (
            <span className="text-xs text-muted-foreground truncate max-w-35">
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
        <div className="flex flex-col gap-0.5 sm:hidden min-w-0 flex-1 pr-2">
          {/* Baris 1: Tanggal & Waktu (serta Rekening jika bukan transfer) */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <span className="shrink-0 whitespace-nowrap">
              {formatTanggal(transaksi.tanggal)}
            </span>
            {waktuLabel && (
              <span className="shrink-0 whitespace-nowrap">
                {"\u00B7"} {waktuLabel}
              </span>
            )}
            {transaksi.tipe !== "transfer" && transaksi.rekening && (
              <span className="truncate min-w-0">
                {"\u00B7"} {transaksi.rekening.nama}
              </span>
            )}
          </div>

          {/* Baris 2: Khusus Transfer, tampilkan alur rekening asal -> rekening tujuan pada baris tersendiri agar rapi */}
          {transaksi.tipe === "transfer" &&
            (transaksi.rekening || transaksi.rekening_tujuan_data) && (
              <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-medium min-w-0 mt-0.5">
                {transaksi.rekening && (
                  <span className="truncate min-w-0 max-w-30">
                    {transaksi.rekening.nama}
                  </span>
                )}
                {transaksi.rekening && transaksi.rekening_tujuan_data && (
                  <span className="text-muted-foreground shrink-0 font-normal">
                    {"\u2192"}
                  </span>
                )}
                {transaksi.rekening_tujuan_data && (
                  <span className="truncate min-w-0 max-w-30">
                    {transaksi.rekening_tujuan_data.nama}
                  </span>
                )}
              </div>
            )}
        </div>

        <div
          className="flex gap-2 ml-auto shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {onDetail && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-surface-strong hover:bg-surface-strong/80 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDetail(transaksi);
              }}
              aria-label={`${dict.transactions.detail.detailAria} ${displayName}`}
              id={`btn-detail-${transaksi.id}`}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-surface-strong hover:bg-surface-strong/80 cursor-pointer"
            disabled={transaksi._pendingSync}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaksi);
            }}
            aria-label={`${dict.transactions.detail.editAria} ${displayName}`}
            id={`btn-edit-${transaksi.id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <ConfirmDialog
            title={
              transaksi.tipe === "correction"
                ? dict.transactions.detail.deleteCorrectionConfirmTitle
                : dict.transactions.detail.deleteConfirmTitle
            }
            description={
              transaksi.tipe === "correction"
                ? dict.transactions.detail.deleteCorrectionConfirmDescription
                : dict.transactions.detail.deleteConfirmDescription
            }
            onConfirm={() => onDelete(transaksi.id)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 cursor-pointer"
              disabled={isDeleting}
              onClick={(e) => e.stopPropagation()}
              aria-label={`${dict.transactions.detail.deleteAria} ${displayName}`}
              id={`btn-delete-${transaksi.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </ConfirmDialog>
        </div>
      </div>
    </div>
  );
}
