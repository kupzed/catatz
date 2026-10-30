"use client";

import { Copy, Pencil, Trash2, X } from "lucide-react";
import type { DisplayTransaksi } from "@/hooks/use-offline-queue-sync";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useTranslation } from "@/i18n/use-translation";
import { TransaksiDetailContent } from "./transaksi-detail-content";

export type TransaksiDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaksi: DisplayTransaksi | null;
  onEdit: (transaksi: DisplayTransaksi) => void;
  onDelete: (id: string) => void;
  onCopy?: (transaksi: DisplayTransaksi) => void;
};

export function TransaksiDetailSheet({
  open,
  onOpenChange,
  transaksi,
  onEdit,
  onDelete,
  onCopy,
}: TransaksiDetailSheetProps) {
  const isMobile = useIsMobile();
  const { dict } = useTranslation();

  if (!transaksi) return null;

  const isPendingSync = !!transaksi._pendingSync;
  const isCorrection = transaksi.tipe === "correction";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        showCloseButton={false}
        className={cn(
          "p-0 flex flex-col gap-0 bg-card text-card-foreground transition-all duration-300",
          isMobile
            ? "inset-0 h-dvh max-h-dvh w-full rounded-none border-none"
            : "w-full sm:max-w-md sm:h-full border-l border-hairline shadow-lg",
        )}
      >
        {/* Header dengan safe-area padding untuk notch di mobile */}
        <SheetHeader className="pt-[max(1.25rem,env(safe-area-inset-top))] px-5 sm:px-6 pb-4 border-b border-hairline shrink-0 text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <SheetTitle className="text-lg font-semibold text-foreground">
                {dict.transactions.detail.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {dict.transactions.detail.subtitle}
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-strong shrink-0 cursor-pointer"
                aria-label={dict.transactions.detail.closeDetail}
              >
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 pb-32">
          <TransaksiDetailContent transaksi={transaksi} />
        </div>

        {/* Fixed Footer dengan safe-area padding */}
        <SheetFooter className="px-5 sm:px-6 py-4 border-t border-hairline bg-card/95 backdrop-blur-sm shrink-0 flex flex-row items-center justify-between gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Tombol Hapus */}
          <ConfirmDialog
            title={
              isCorrection
                ? dict.transactions.detail.deleteCorrectionConfirmTitle
                : dict.transactions.detail.deleteConfirmTitle
            }
            description={
              isCorrection
                ? dict.transactions.detail.deleteCorrectionConfirmDescription
                : dict.transactions.detail.deleteConfirmDescription
            }
            onConfirm={() => onDelete(transaksi.id)}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 shrink-0 cursor-pointer"
              aria-label={dict.transactions.detail.deleteAria}
              id="btn-delete-transaksi-sheet"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmDialog>

          {/* Tombol Copy Transaksi (hanya jika bukan koreksi) */}
          {!isCorrection && onCopy && (
            <Button
              type="button"
              variant="outline"
              disabled={isPendingSync}
              onClick={() => onCopy(transaksi)}
              className="rounded-full h-11 px-4 text-xs sm:text-sm font-medium border-hairline hover:bg-surface-soft gap-2 shrink-0 cursor-pointer"
              id="btn-copy-transaksi-sheet"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{dict.transactions.detail.copyButton}</span>
            </Button>
          )}

          {/* Tombol Edit Transaksi (CTA Utama) */}
          <Button
            type="button"
            disabled={isPendingSync}
            onClick={() => onEdit(transaksi)}
            className="rounded-full h-11 px-4 bg-primary hover:bg-[#003ecc] text-white font-semibold text-xs sm:text-sm transition-colors flex-1 gap-2 cursor-pointer shadow-none truncate"
            id="btn-edit-transaksi-sheet"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{dict.transactions.detail.editButton}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

