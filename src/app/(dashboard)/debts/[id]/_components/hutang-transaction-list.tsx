"use client";

import type { Hutang, HutangCicilan } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { deleteCicilan } from "@/actions/hutang-action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  hutang: Hutang;
  rekening: Rekening[];
  onEditTransaction: (item: HutangCicilan) => void;
  onSuccess: (refreshed: Hutang) => void;
};

function getRekeningName(rekening: Rekening[], id?: string | null) {
  if (!id) return "Tanpa Rekening";
  const item = rekening.find((r) => r.id === id);
  return item ? `${item.nama} (${item.jenis})` : "Rekening tidak ditemukan";
}

export function HutangTransactionList({
  hutang,
  rekening,
  onEditTransaction,
  onSuccess,
}: Props) {
  const { formatRupiah, formatTanggal, formatWaktu } = useSystemPreferences();
  const isPiutang = hutang.tipe === "memberi";

  const cicilanList = [...(hutang.cicilan ?? [])].sort((a, b) => {
    const timeA = new Date(`${a.tanggal}T${a.waktu ?? "00:00"}`).getTime();
    const timeB = new Date(`${b.tanggal}T${b.waktu ?? "00:00"}`).getTime();
    return timeB - timeA;
  });

  const hasLegacyPinjaman = Number(hutang.total_pinjaman) > 0;

  async function handleDelete(id: string) {
    const res = await deleteCicilan(id);
    if (res.success && res.data) {
      toast.success("Transaksi dihapus");
      onSuccess(res.data);
    } else {
      toast.error(res.error ?? "Gagal menghapus transaksi");
    }
  }

  if (cicilanList.length === 0 && !hasLegacyPinjaman) {
    return (
      <div className="rounded-card border border-dashed border-hairline p-8 text-center">
        <p className="text-sm font-medium text-foreground">Belum ada transaksi</p>
        <p className="text-xs text-muted-foreground mt-1">
          Gunakan tombol di atas untuk mencatat pinjaman baru atau pembayaran.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cicilanList.map((item) => {
        const isPinjaman = item.jenis_transaksi === "pinjaman";

        // Alur uang:
        // Jika Piutang: Pinjaman = uang keluar (-), Pembayaran = uang masuk (+)
        // Jika Hutang: Pinjaman = uang masuk (+), Pembayaran = uang keluar (-)
        const isMoneyIn = isPiutang ? !isPinjaman : isPinjaman;

        const label = isPiutang
          ? isPinjaman
            ? "Pinjaman Diberikan"
            : "Pembayaran Diterima"
          : isPinjaman
            ? "Pinjaman Diterima"
            : "Pembayaran Hutang";

        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-card border border-hairline bg-card p-4 transition-colors hover:bg-surface-soft/40"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                  isMoneyIn
                    ? "bg-semantic-up/10 text-semantic-up"
                    : "bg-semantic-down/10 text-semantic-down",
                )}
              >
                {isMoneyIn ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </span>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">
                    {label}
                  </span>
                  <Badge variant="secondary" className="text-[10px] rounded-full px-2">
                    {getRekeningName(rekening, item.rekening_id)}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatTanggal(item.tanggal, "d MMM yyyy")}</span>
                  {item.waktu && <span>· {formatWaktu(item.waktu)}</span>}
                  {item.catatan && (
                    <span className="truncate max-w-[200px] sm:max-w-xs">
                      · {item.catatan}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p
                  className={cn(
                    "font-mono text-base font-semibold",
                    isMoneyIn ? "text-semantic-up" : "text-semantic-down",
                  )}
                >
                  {isMoneyIn ? "+" : "-"}
                  {formatRupiah(Number(item.nominal))}
                </p>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => onEditTransaction(item)}
                  aria-label="Edit transaksi"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>

                <ConfirmDialog
                  title="Hapus Transaksi?"
                  description="Saldo rekening terkait akan dikembalikan secara otomatis sesuai dengan nominal transaksi ini."
                  onConfirm={() => handleDelete(item.id)}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-semantic-down hover:bg-semantic-down/10"
                    aria-label="Hapus transaksi"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </ConfirmDialog>
              </div>
            </div>
          </div>
        );
      })}

      {/* Legacy initial loan card if any exists from migration */}
      {hasLegacyPinjaman && (
        <div className="flex items-center justify-between gap-3 rounded-card border border-hairline/70 bg-surface-soft/60 p-4">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                isPiutang
                  ? "bg-semantic-down/10 text-semantic-down"
                  : "bg-semantic-up/10 text-semantic-up",
              )}
            >
              {isPiutang ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
            </span>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  {isPiutang ? "Pinjaman Awal (Diberikan)" : "Pinjaman Awal (Diterima)"}
                </span>
                <Badge variant="outline" className="text-[10px] rounded-full px-2">
                  {getRekeningName(rekening, hutang.rekening_id)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatTanggal(hutang.tanggal_mulai, "d MMM yyyy")}</span>
                {hutang.waktu && <span>· {formatWaktu(hutang.waktu)}</span>}
                {hutang.catatan && (
                  <span className="truncate max-w-[200px] sm:max-w-xs">
                    · {hutang.catatan}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p
              className={cn(
                "font-mono text-base font-semibold",
                isPiutang ? "text-semantic-down" : "text-semantic-up",
              )}
            >
              {isPiutang ? "-" : "+"}
              {formatRupiah(Number(hutang.total_pinjaman))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
