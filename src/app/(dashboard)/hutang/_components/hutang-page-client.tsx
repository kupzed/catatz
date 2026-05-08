"use client";

import { useState } from "react";
import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import {
  formatRupiah,
  formatTanggal,
  percentage,
  waReminderUrl,
} from "@/lib/utils";
import { deleteHutang, createCicilan } from "@/actions/hutang-action";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  MessageCircle,
  HandCoins,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import HutangDialog from "./hutang-dialog";
import { cn } from "@/lib/utils";
import { todayISODate, currentTime } from "@/lib/utils";
import { NominalInput } from "@/components/common/nominal-input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

type Props = { initialHutang: Hutang[]; rekening: Rekening[] };

const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  lunas: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  overdue: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export default function HutangPageClient({ initialHutang, rekening }: Props) {
  const [hutang, setHutang] = useState(initialHutang);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Hutang | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cicilanData, setCicilanData] = useState<
    Record<string, { nominal: string; rekening_id: string }>
  >({});
  const [loadingCicilan, setLoadingCicilan] = useState<string | null>(null);

  const memberi = hutang.filter((h) => h.tipe === "memberi");
  const menerima = hutang.filter((h) => h.tipe === "menerima");

  async function handleDelete(id: string) {
    const res = await deleteHutang(id);
    if (res.success) {
      setHutang((prev) => prev.filter((h) => h.id !== id));
      toast.success("Hutang dihapus");
    } else {
      toast.error(res.error ?? "Gagal menghapus");
    }
  }

  async function handleLunas(h: Hutang) {
    if (h.sisa_tagihan <= 0) return;
    setLoadingCicilan(h.id);
    const res = await createCicilan({
      hutang_id: h.id,
      nominal: h.sisa_tagihan,
      rekening_id: h.rekening_id ?? undefined,
      tanggal: todayISODate(),
      waktu: currentTime(),
    });
    if (res.success) {
      setHutang((prev) =>
        prev.map((prevH) =>
          prevH.id === h.id
            ? {
                ...prevH,
                status: "lunas",
                sisa_tagihan: 0,
                cicilan: [...(prevH.cicilan ?? []), res.data!],
              }
            : prevH,
        ),
      );
      toast.success("Hutang dilunaskan");
    } else {
      toast.error(res.error ?? "Gagal melunaskan hutang");
    }
    setLoadingCicilan(null);
  }

  async function handleCicilan(
    hutangId: string,
    totalPinjaman: number,
    sisaTagihan: number,
  ) {
    const data = cicilanData[hutangId] || {};
    const nominal = parseFloat(data.nominal ?? "0");
    if (!nominal || nominal <= 0)
      return toast.error("Masukkan nominal cicilan");
    if (nominal > sisaTagihan)
      return toast.error("Nominal melebihi sisa tagihan");

    setLoadingCicilan(hutangId);
    const res = await createCicilan({
      hutang_id: hutangId,
      nominal,
      rekening_id:
        data.rekening_id && data.rekening_id !== "none"
          ? data.rekening_id
          : undefined,
      tanggal: todayISODate(),
      waktu: currentTime(),
    });
    if (res.success) {
      setHutang((prev) =>
        prev.map((h) => {
          if (h.id !== hutangId) return h;
          const newSisa = Math.max(h.sisa_tagihan - nominal, 0);
          return {
            ...h,
            sisa_tagihan: newSisa,
            status: newSisa === 0 ? "lunas" : h.status,
            cicilan: [...(h.cicilan ?? []), res.data!],
          };
        }),
      );
      setCicilanData((prev) => ({
        ...prev,
        [hutangId]: { nominal: "", rekening_id: "" },
      }));
      toast.success("Cicilan dicatat");
    } else {
      toast.error(res.error ?? "Gagal mencatat cicilan");
    }
    setLoadingCicilan(null);
  }

  function renderGroup(title: string, items: Hutang[], emoji: string) {
    if (items.length === 0) return null;
    return (
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          {emoji} {title}
        </h3>
        <div className="space-y-3">
          {items.map((h) => {
            const pct = percentage(
              h.total_pinjaman - h.sisa_tagihan,
              h.total_pinjaman,
            );
            const isExpanded = expanded === h.id;
            return (
              <div
                key={h.id}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {h.nama_entitas}
                        </span>
                        <Badge
                          className={cn(
                            "text-xs px-1.5 py-0 border-0",
                            STATUS_BADGE[h.status],
                          )}
                        >
                          {h.status === "lunas"
                            ? "✅ Lunas"
                            : h.status === "overdue"
                              ? "⚠️ Overdue"
                              : "⏳ Aktif"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          Total: {formatRupiah(Number(h.total_pinjaman))}
                        </span>
                        {h.tanggal_jatuh_tempo && (
                          <span>
                            · Jatuh tempo:{" "}
                            {formatTanggal(h.tanggal_jatuh_tempo, "d MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-rose-500">
                        {formatRupiah(Number(h.sisa_tagihan))}
                      </p>
                      <p className="text-xs text-muted-foreground">sisa</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Terbayar {pct}%</span>
                      <span>
                        {formatRupiah(h.total_pinjaman - h.sisa_tagihan, true)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {h.status !== "lunas" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setExpanded(isExpanded ? null : h.id)}
                        >
                          <Plus className="h-3 w-3" />
                          Cicilan
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                        <ConfirmDialog
                          title="Lunaskan Hutang?"
                          description={`Aksi ini akan mencatat cicilan sebesar sisa tagihan (${formatRupiah(Number(h.sisa_tagihan))}) dan mengubah status menjadi lunas.`}
                          onConfirm={() => handleLunas(h)}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-emerald-600"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Lunas
                          </Button>
                        </ConfirmDialog>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          asChild
                        >
                          <a
                            href={waReminderUrl(
                              "",
                              `Halo! Mengingatkan tagihan sebesar ${formatRupiah(Number(h.sisa_tagihan))}. Terima kasih.`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WA
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs ml-auto"
                      onClick={() => {
                        setEditData(h);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <ConfirmDialog
                      title="Hapus Catatan?"
                      description="Menghapus hutang/piutang ini juga akan menghapus semua riwayat cicilannya."
                      onConfirm={() => handleDelete(h.id)}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>

                {/* Cicilan Input */}
                {isExpanded && h.status !== "lunas" && (
                  <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Nominal Cicilan (Rp)</Label>
                        <NominalInput
                          placeholder="0"
                          value={cicilanData[h.id]?.nominal ?? ""}
                          onValueChange={(val) =>
                            setCicilanData((prev) => ({
                              ...prev,
                              [h.id]: {
                                ...prev[h.id],
                                nominal: val.toString(),
                              },
                            }))
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Dari / Ke Rekening</Label>
                        <Select
                          value={cicilanData[h.id]?.rekening_id ?? ""}
                          onValueChange={(val) =>
                            setCicilanData((prev) => ({
                              ...prev,
                              [h.id]: { ...prev[h.id], rekening_id: val },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="(Tanpa Rekening)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              (Tanpa Rekening)
                            </SelectItem>
                            {rekening.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleCicilan(
                            h.id,
                            Number(h.total_pinjaman),
                            Number(h.sisa_tagihan),
                          )
                        }
                        disabled={loadingCicilan === h.id}
                        className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        Catat
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hutang & Piutang
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola pinjaman masuk dan keluar
          </p>
        </div>
        <Button
          onClick={() => {
            setEditData(null);
            setDialogOpen(true);
          }}
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
          id="btn-tambah-hutang"
        >
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>

      {hutang.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HandCoins className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Belum ada catatan hutang</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup("Piutang (Memberi Pinjaman)", memberi, "📤")}
          {renderGroup("Hutang (Menerima Pinjaman)", menerima, "📥")}
        </div>
      )}

      <HutangDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditData(null);
        }}
        rekening={rekening}
        editData={editData}
        onCreated={(h) => {
          setHutang((prev) => [h, ...prev]);
          setDialogOpen(false);
        }}
        onUpdated={(h) => {
          setHutang((prev) => prev.map((x) => (x.id === h.id ? h : x)));
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
