"use client";

import type { ReactNode } from "react";
import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { STATUS_BADGE } from "@/constants/hutang";
import { percentage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";

export type HutangCardProps = {
  hutang: Hutang;
  rekening: Rekening[];
  activePanel: HutangPanelMode | null;
  onPanelToggle: (mode: HutangPanelMode) => void;
  onEdit: (hutang: Hutang) => void;
  onDelete: (id: string) => void;
  children?: ReactNode;
};

export type HutangPanelMode = "detail" | "cicilan" | "lunas";

function getRekeningLabel(rekening: Rekening[], id?: string | null) {
  if (!id) return "Tanpa rekening";
  const item = rekening.find((r) => r.id === id);
  return item ? `${item.nama} (${item.jenis})` : "Rekening tidak ditemukan";
}

export function HutangCard({
  hutang,
  rekening,
  activePanel,
  onPanelToggle,
  onEdit,
  onDelete,
  children,
}: HutangCardProps) {
  const { formatRupiah, formatTanggal, formatWaktu } = useSystemPreferences();
  const totalPinjaman = Number(hutang.total_pinjaman);
  const sisaTagihan = Number(hutang.sisa_tagihan);
  const pct = percentage(totalPinjaman - sisaTagihan, totalPinjaman);

  return (
    <div
      data-testid={`hutang-card-${hutang.id}`}
      className="overflow-hidden rounded-card border border-hairline bg-card"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">
                {hutang.nama_entitas}
              </span>
              <Badge
                className={cn(
                  "text-xs px-2.5 py-0.5 border-0 rounded-full",
                  STATUS_BADGE[hutang.status],
                )}
              >
                {hutang.status === "lunas"
                  ? "Lunas"
                  : hutang.status === "overdue"
                    ? "Overdue"
                    : "Aktif"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>Total: {formatRupiah(totalPinjaman)}</span>
              {hutang.waktu && <span>Waktu: {formatWaktu(hutang.waktu)}</span>}
              <span>
                Rekening: {getRekeningLabel(rekening, hutang.rekening_id)}
              </span>
              {hutang.tanggal_jatuh_tempo && (
                <span>
                  Jatuh tempo:{" "}
                  {formatTanggal(hutang.tanggal_jatuh_tempo, "d MMM yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-lg font-semibold text-semantic-down">
              {formatRupiah(sisaTagihan)}
            </p>
            <p className="text-xs text-muted-foreground">sisa</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Terbayar {pct}%</span>
            <span>{formatRupiah(totalPinjaman - sisaTagihan, true)}</span>
          </div>
          <Progress value={pct} className="h-2 [&>div]:bg-primary" />
        </div>

        <div
          className={cn(
            "mt-3 grid gap-1",
            hutang.status === "lunas"
              ? "grid-cols-[minmax(0,1fr)_2.75rem_2.75rem]"
              : "grid-cols-[repeat(3,minmax(0,1fr))_2.75rem_2.75rem]",
          )}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-11 min-w-0 w-full gap-0.5 rounded-full bg-surface-strong px-1 text-[10px] text-foreground min-[360px]:text-xs"
            onClick={() => onPanelToggle("detail")}
            aria-expanded={activePanel === "detail"}
          >
            <ListChecks className="hidden h-3 w-3 sm:block" />
            Detail
          </Button>
          {hutang.status !== "lunas" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-11 min-w-0 w-full gap-0.5 rounded-full bg-surface-strong px-1 text-[10px] text-foreground min-[360px]:text-xs"
                onClick={() => onPanelToggle("cicilan")}
                aria-expanded={activePanel === "cicilan"}
              >
                <Plus className="hidden h-3 w-3 sm:block" />
                <span className="min-[360px]:hidden">Cicil</span>
                <span className="hidden min-[360px]:inline">Cicilan</span>
                {activePanel === "cicilan" ? (
                  <ChevronUp className="hidden h-3 w-3 sm:block" />
                ) : (
                  <ChevronDown className="hidden h-3 w-3 sm:block" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-11 min-w-0 w-full gap-0.5 rounded-full bg-surface-strong px-1 text-[10px] text-semantic-up min-[360px]:text-xs"
                onClick={() => onPanelToggle("lunas")}
                aria-expanded={activePanel === "lunas"}
              >
                <CheckCircle2 className="hidden h-3 w-3 sm:block" />
                Lunas
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-11 min-w-0 w-full rounded-full bg-surface-strong p-0"
            onClick={() => onEdit(hutang)}
            aria-label={`Edit hutang ${hutang.nama_entitas}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <ConfirmDialog
            title="Hapus Catatan?"
            description="Menghapus hutang/piutang ini juga akan menghapus semua riwayat cicilannya dan mengembalikan saldo rekening terkait."
            onConfirm={() => onDelete(hutang.id)}
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-11 min-w-0 w-full rounded-full bg-surface-strong p-0 text-semantic-down"
              aria-label={`Hapus hutang ${hutang.nama_entitas}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      {children}
    </div>
  );
}
