"use client";

import type { ReactNode } from "react";
import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { STATUS_BADGE } from "@/constants/hutang";
import { formatRupiah, formatTanggal, percentage } from "@/lib/utils";
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

export type HutangCardProps = {
  hutang: Hutang;
  rekening: Rekening[];
  isExpanded: boolean;
  onExpandToggle: (hutang: Hutang) => void;
  onDetail: (id: string) => void;
  onLunas: (hutang: Hutang) => void;
  onEdit: (hutang: Hutang) => void;
  onDelete: (id: string) => void;
  children?: ReactNode;
};

function getRekeningLabel(rekening: Rekening[], id?: string | null) {
  if (!id) return "Tanpa rekening";
  const item = rekening.find((r) => r.id === id);
  return item ? `${item.nama} (${item.jenis})` : "Rekening tidak ditemukan";
}

export function HutangCard({
  hutang,
  rekening,
  isExpanded,
  onExpandToggle,
  onDetail,
  onLunas,
  onEdit,
  onDelete,
  children,
}: HutangCardProps) {
  const totalPinjaman = Number(hutang.total_pinjaman);
  const sisaTagihan = Number(hutang.sisa_tagihan);
  const pct = percentage(totalPinjaman - sisaTagihan, totalPinjaman);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
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

        <div className="flex gap-2 mt-3 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 rounded-full bg-surface-strong text-foreground px-3"
            onClick={() => onDetail(hutang.id)}
          >
            <ListChecks className="h-3 w-3" />
            Detail
          </Button>
          {hutang.status !== "lunas" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 rounded-full bg-surface-strong text-foreground px-3"
                onClick={() => onExpandToggle(hutang)}
              >
                <Plus className="h-3 w-3" />
                Cicilan
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 rounded-full bg-semantic-up/10 text-semantic-up px-3"
                onClick={() => onLunas(hutang)}
              >
                <CheckCircle2 className="h-3 w-3" />
                Lunas
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs ml-auto rounded-full bg-surface-strong"
            onClick={() => onEdit(hutang)}
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
              className="h-7 text-xs rounded-full bg-semantic-down/10 text-semantic-down px-3"
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
