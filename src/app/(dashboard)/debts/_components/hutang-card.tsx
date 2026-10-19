"use client";

import Link from "next/link";
import type { Hutang } from "@/types/hutang";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { percentage } from "@/lib/utils";

export type HutangCardProps = {
  hutang: Hutang;
  onEdit: (hutang: Hutang) => void;
  onDelete: (id: string) => void;
};

export function HutangCard({ hutang, onEdit, onDelete }: HutangCardProps) {
  const { formatRupiah } = useSystemPreferences();

  // Hitung total pinjaman (pokok awal + pinjaman tambahan)
  const additionalPinjaman = (hutang.cicilan ?? [])
    .filter((c) => c.jenis_transaksi === "pinjaman")
    .reduce((sum, c) => sum + Number(c.nominal), 0);
  const totalPinjaman = Number(hutang.total_pinjaman) + additionalPinjaman;

  // Hitung total pembayaran
  const totalPembayaran = (hutang.cicilan ?? [])
    .filter((c) => (c.jenis_transaksi ?? "pembayaran") === "pembayaran")
    .reduce((sum, c) => sum + Number(c.nominal), 0);

  const sisaTagihan = Math.max(totalPinjaman - totalPembayaran, 0);
  const pct = totalPinjaman > 0 ? percentage(totalPembayaran, totalPinjaman) : 100;
  const isLunasTag = hutang.status === "lunas" || hutang.is_lunas_manual === true;
  const isPiutang = hutang.tipe === "memberi";

  return (
    <div
      data-testid={`hutang-card-${hutang.id}`}
      className="group rounded-card border border-hairline bg-card p-4 transition-all hover:border-hairline/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/debts/${hutang.id}`}
          className="flex-1 min-w-0 space-y-1 block focus:outline-none"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
              {hutang.nama_entitas}
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate max-w-md">
            {hutang.catatan || (isPiutang ? "Pihak Piutang" : "Pihak Hutang")}
          </p>

          {totalPinjaman > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span>Pokok: {formatRupiah(totalPinjaman)}</span>
              <span>· Terbayar: {formatRupiah(totalPembayaran)}</span>
            </div>
          )}
        </Link>

        {/* Right side balance / tag */}
        <div className="text-right shrink-0 flex flex-col items-end justify-center min-h-10">
          {isLunasTag ? (
            <Badge
              className="text-xs px-3 py-1 border-0 rounded-full font-semibold bg-semantic-up/10 text-semantic-up"
            >
              ✓ Lunas
            </Badge>
          ) : (
            <>
              <p
                className={cn(
                  "font-mono text-lg font-semibold",
                  sisaTagihan > 0
                    ? isPiutang
                      ? "text-semantic-up"
                      : "text-semantic-down"
                    : "text-muted-foreground",
                )}
              >
                {formatRupiah(sisaTagihan)}
              </p>
              <p className="text-xs text-muted-foreground">
                {sisaTagihan > 0
                  ? isPiutang
                    ? "sisa piutang"
                    : "sisa hutang"
                  : "belum ada tagihan"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar if pinjaman > 0 */}
      {totalPinjaman > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Terbayar {pct}%</span>
            <span className="font-mono">{formatRupiah(totalPembayaran)}</span>
          </div>
          <Progress value={Math.min(pct, 100)} className="h-1.5 [&>div]:bg-primary" />
        </div>
      )}

      {/* Card Footer Actions */}
      <div className="mt-3.5 flex items-center justify-between border-t border-hairline/60 pt-3">
        <Link
          href={`/debts/${hutang.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-active transition-colors"
        >
          Buka Detail
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              onEdit(hutang);
            }}
            aria-label={`Edit ${hutang.nama_entitas}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <ConfirmDialog
            title="Hapus Catatan?"
            description="Menghapus kontak ini juga akan menghapus semua riwayat transaksi dan mengembalikan saldo rekening terkait."
            onConfirm={() => onDelete(hutang.id)}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-semantic-down hover:bg-semantic-down/10"
              aria-label={`Hapus ${hutang.nama_entitas}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </ConfirmDialog>
        </div>
      </div>
    </div>
  );
}
