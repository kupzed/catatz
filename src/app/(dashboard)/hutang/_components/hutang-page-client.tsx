"use client";

import { useMemo, useState } from "react";
import type { Hutang, HutangCicilan } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import {
  currentTime,
  formatRupiah,
  formatTanggal,
  percentage,
  todayISODate,
} from "@/lib/utils";
import {
  createCicilan,
  deleteCicilan,
  deleteHutang,
  updateCicilan,
} from "@/actions/hutang-action";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HandCoins,
  ListChecks,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import HutangDialog from "./hutang-dialog";
import { cn } from "@/lib/utils";
import { NominalInput } from "@/components/common/nominal-input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RekeningSelect } from "@/components/common/rekening-select";
import { STATUS_BADGE } from "@/constants/hutang";

type Props = { initialHutang: Hutang[]; rekening: Rekening[] };

type CicilanDraft = {
  nominal: string;
  rekening_id: string;
  tanggal: string;
  waktu: string;
  catatan: string;
};

const emptyEditDraft = (): CicilanDraft => ({
  nominal: "",
  rekening_id: "none",
  tanggal: todayISODate(),
  waktu: currentTime(),
  catatan: "",
});

function sortCicilan(cicilan?: HutangCicilan[]) {
  return [...(cicilan ?? [])].sort((a, b) => {
    const timeA = new Date(`${a.tanggal}T${a.waktu ?? "00:00"}`).getTime();
    const timeB = new Date(`${b.tanggal}T${b.waktu ?? "00:00"}`).getTime();
    return timeB - timeA;
  });
}

export default function HutangPageClient({ initialHutang, rekening }: Props) {
  const [hutang, setHutang] = useState(initialHutang);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Hutang | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailHutangId, setDetailHutangId] = useState<string | null>(null);
  const [lunasTarget, setLunasTarget] = useState<Hutang | null>(null);
  const [lunasRekeningId, setLunasRekeningId] = useState("none");
  const [cicilanData, setCicilanData] = useState<
    Record<string, { nominal: string; rekening_id: string }>
  >({});
  const [loadingCicilan, setLoadingCicilan] = useState<string | null>(null);
  const [editingCicilanId, setEditingCicilanId] = useState<string | null>(null);
  const [editCicilanDraft, setEditCicilanDraft] =
    useState<CicilanDraft>(emptyEditDraft);

  const memberi = hutang.filter((h) => h.tipe === "memberi");
  const menerima = hutang.filter((h) => h.tipe === "menerima");
  const detailHutang = useMemo(
    () => hutang.find((item) => item.id === detailHutangId) ?? null,
    [detailHutangId, hutang],
  );

  function getRekeningLabel(id?: string | null) {
    if (!id) return "Tanpa rekening";
    const item = rekening.find((r) => r.id === id);
    return item ? `${item.nama} (${item.jenis})` : "Rekening tidak ditemukan";
  }

  function replaceHutang(updated: Hutang) {
    setHutang((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleDelete(id: string) {
    const res = await deleteHutang(id);
    if (res.success) {
      setHutang((prev) => prev.filter((h) => h.id !== id));
      if (detailHutangId === id) setDetailHutangId(null);
      toast.success("Hutang dihapus");
    } else {
      toast.error(res.error ?? "Gagal menghapus");
    }
  }

  function openLunasDialog(h: Hutang) {
    setLunasTarget(h);
    setLunasRekeningId(h.rekening_id ?? "none");
  }

  async function handleLunas() {
    if (!lunasTarget || Number(lunasTarget.sisa_tagihan) <= 0) return;

    setLoadingCicilan(lunasTarget.id);
    const res = await createCicilan({
      hutang_id: lunasTarget.id,
      nominal: Number(lunasTarget.sisa_tagihan),
      rekening_id:
        lunasRekeningId && lunasRekeningId !== "none"
          ? lunasRekeningId
          : undefined,
      tanggal: todayISODate(),
      waktu: currentTime(),
      catatan: "Pelunasan",
    });

    if (res.success && res.data) {
      replaceHutang(res.data);
      setLunasTarget(null);
      toast.success("Catatan dilunaskan");
    } else {
      toast.error(res.error ?? "Gagal melunaskan hutang");
    }

    setLoadingCicilan(null);
  }

  async function handleCicilan(h: Hutang) {
    const data = cicilanData[h.id] || {};
    const nominal = Number(data.nominal ?? "0");
    const sisaTagihan = Number(h.sisa_tagihan);

    if (!nominal || nominal <= 0) {
      return toast.error("Masukkan nominal cicilan");
    }

    if (nominal > sisaTagihan) {
      return toast.error("Nominal melebihi sisa tagihan");
    }

    setLoadingCicilan(h.id);
    const res = await createCicilan({
      hutang_id: h.id,
      nominal,
      rekening_id:
        data.rekening_id && data.rekening_id !== "none"
          ? data.rekening_id
          : undefined,
      tanggal: todayISODate(),
      waktu: currentTime(),
    });

    if (res.success && res.data) {
      replaceHutang(res.data);
      setCicilanData((prev) => ({
        ...prev,
        [h.id]: { nominal: "", rekening_id: "" },
      }));
      toast.success("Cicilan dicatat");
    } else {
      toast.error(res.error ?? "Gagal mencatat cicilan");
    }

    setLoadingCicilan(null);
  }

  function startEditCicilan(cicilan: HutangCicilan) {
    setEditingCicilanId(cicilan.id);
    setEditCicilanDraft({
      nominal: String(Number(cicilan.nominal)),
      rekening_id: cicilan.rekening_id ?? "none",
      tanggal: cicilan.tanggal,
      waktu: cicilan.waktu?.substring(0, 5) ?? currentTime(),
      catatan: cicilan.catatan ?? "",
    });
  }

  async function handleUpdateCicilan(h: Hutang, cicilan: HutangCicilan) {
    const nominal = Number(editCicilanDraft.nominal);
    if (!nominal || nominal <= 0) {
      return toast.error("Masukkan nominal cicilan");
    }

    const otherCicilanTotal = (h.cicilan ?? [])
      .filter((item) => item.id !== cicilan.id)
      .reduce((acc, item) => acc + Number(item.nominal), 0);
    const maxNominal = Math.max(
      Number(h.total_pinjaman) - otherCicilanTotal,
      0,
    );

    if (nominal > maxNominal) {
      return toast.error("Total cicilan melebihi total pinjaman");
    }

    setLoadingCicilan(h.id);
    const res = await updateCicilan(cicilan.id, {
      nominal,
      rekening_id: editCicilanDraft.rekening_id,
      tanggal: editCicilanDraft.tanggal,
      waktu: editCicilanDraft.waktu,
      catatan: editCicilanDraft.catatan,
    });

    if (res.success && res.data) {
      replaceHutang(res.data);
      setEditingCicilanId(null);
      setEditCicilanDraft(emptyEditDraft());
      toast.success("Cicilan diperbarui");
    } else {
      toast.error(res.error ?? "Gagal memperbarui cicilan");
    }

    setLoadingCicilan(null);
  }

  async function handleDeleteCicilan(id: string) {
    const res = await deleteCicilan(id);
    if (res.success && res.data) {
      replaceHutang(res.data);
      toast.success("Cicilan dihapus");
    } else {
      toast.error(res.error ?? "Gagal menghapus cicilan");
    }
  }

  function renderCicilanDetail(h: Hutang) {
    const cicilan = sortCicilan(h.cicilan);

    if (cicilan.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Belum ada cicilan.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {cicilan.map((item) => {
          const isEditing = editingCicilanId === item.id;

          return (
            <div key={item.id} className="rounded-lg border p-3 space-y-3">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nominal</Label>
                      <NominalInput
                        value={editCicilanDraft.nominal}
                        onValueChange={(value) =>
                          setEditCicilanDraft((prev) => ({
                            ...prev,
                            nominal: value.toString(),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rekening</Label>
                      <RekeningSelect
                        rekening={rekening}
                        value={editCicilanDraft.rekening_id}
                        onValueChange={(value) =>
                          setEditCicilanDraft((prev) => ({
                            ...prev,
                            rekening_id: value,
                          }))
                        }
                        placeholder="Tanpa rekening"
                        includeNone={true}
                        noneLabel="Tanpa rekening"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tanggal</Label>
                      <Input
                        type="date"
                        value={editCicilanDraft.tanggal}
                        onChange={(event) =>
                          setEditCicilanDraft((prev) => ({
                            ...prev,
                            tanggal: event.target.value,
                          }))
                        }
                        className="w-full appearance-none bg-background border-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Waktu</Label>
                      <Input
                        type="time"
                        value={editCicilanDraft.waktu}
                        onChange={(event) =>
                          setEditCicilanDraft((prev) => ({
                            ...prev,
                            waktu: event.target.value,
                          }))
                        }
                        className="w-full appearance-none bg-background border-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Catatan</Label>
                    <Input
                      value={editCicilanDraft.catatan}
                      onChange={(event) =>
                        setEditCicilanDraft((prev) => ({
                          ...prev,
                          catatan: event.target.value,
                        }))
                      }
                      placeholder="Catatan opsional"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => {
                        setEditingCicilanId(null);
                        setEditCicilanDraft(emptyEditDraft());
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1 bg-primary hover:bg-primary-active text-white rounded-full"
                      disabled={loadingCicilan === h.id}
                      onClick={() => handleUpdateCicilan(h, item)}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Simpan
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">
                        {formatRupiah(Number(item.nominal))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTanggal(item.tanggal, "d MMM yyyy")}
                        {item.waktu ? `, ${item.waktu.substring(0, 5)}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {getRekeningLabel(item.rekening_id)}
                      </p>
                      {item.catatan && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.catatan}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => startEditCicilan(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <ConfirmDialog
                        title="Hapus Cicilan?"
                        description="Cicilan ini akan dihapus dan saldo rekening terkait akan dikembalikan oleh trigger database."
                        onConfirm={() => handleDeleteCicilan(item.id)}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderGroup(title: string, items: Hutang[]) {
    if (items.length === 0) return null;

    return (
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">
          {title}
        </h3>
        <div className="space-y-3">
          {items.map((h) => {
            const totalPinjaman = Number(h.total_pinjaman);
            const sisaTagihan = Number(h.sisa_tagihan);
            const pct = percentage(totalPinjaman - sisaTagihan, totalPinjaman);
            const isExpanded = expanded === h.id;

            return (
              <div
                key={h.id}
                className="rounded-2xl border bg-card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {h.nama_entitas}
                        </span>
                        <Badge
                          className={cn(
                            "text-xs px-2.5 py-0.5 border-0 rounded-full",
                            STATUS_BADGE[h.status],
                          )}
                        >
                          {h.status === "lunas"
                            ? "Lunas"
                            : h.status === "overdue"
                              ? "Overdue"
                              : "Aktif"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Total: {formatRupiah(totalPinjaman)}</span>
                        <span>Rekening: {getRekeningLabel(h.rekening_id)}</span>
                        {h.tanggal_jatuh_tempo && (
                          <span>
                            Jatuh tempo:{" "}
                            {formatTanggal(h.tanggal_jatuh_tempo, "d MMM yyyy")}
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
                      <span>
                        {formatRupiah(totalPinjaman - sisaTagihan, true)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2 [&>div]:bg-primary" />
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 rounded-full bg-surface-strong text-foreground px-3"
                      onClick={() => setDetailHutangId(h.id)}
                    >
                      <ListChecks className="h-3 w-3" />
                      Detail
                    </Button>
                    {h.status !== "lunas" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 rounded-full bg-surface-strong text-foreground px-3"
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 rounded-full bg-semantic-up/10 text-semantic-up px-3"
                          onClick={() => openLunasDialog(h)}
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
                      onClick={() => {
                        setEditData(h);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <ConfirmDialog
                      title="Hapus Catatan?"
                      description="Menghapus hutang/piutang ini juga akan menghapus semua riwayat cicilannya dan mengembalikan saldo rekening terkait."
                      onConfirm={() => handleDelete(h.id)}
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

                {isExpanded && h.status !== "lunas" && (
                  <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Dari / Ke Rekening</Label>
                        <RekeningSelect
                          rekening={rekening}
                          value={cicilanData[h.id]?.rekening_id ?? "none"}
                          onValueChange={(val) =>
                            setCicilanData((prev) => ({
                              ...prev,
                              [h.id]: { ...prev[h.id], rekening_id: val },
                            }))
                          }
                          placeholder="Tanpa rekening"
                          includeNone={true}
                          noneLabel="Tanpa rekening"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleCicilan(h)}
                        disabled={loadingCicilan === h.id}
                        className="h-8 bg-primary hover:bg-primary-active text-white rounded-full px-4"
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
          <h1 className="text-[32px] font-normal tracking-[-0.4px] text-foreground leading-tight">
            Hutang &amp; Piutang
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pinjaman masuk dan keluar
          </p>
        </div>
        <Button
          onClick={() => {
            setEditData(null);
            setDialogOpen(true);
          }}
          className="gap-2 bg-primary hover:bg-primary-active text-white rounded-full font-semibold"
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
          {renderGroup("Piutang (Memberi Pinjaman)", memberi)}
          {renderGroup("Hutang (Menerima Pinjaman)", menerima)}
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
          replaceHutang(h);
          setDialogOpen(false);
        }}
      />

      <Dialog
        open={!!lunasTarget}
        onOpenChange={(open) => {
          if (!open) setLunasTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pilih Rekening Pelunasan</DialogTitle>
            <DialogDescription>
              Pilih rekening yang digunakan untuk mencatat pelunasan sebesar{" "}
              {formatRupiah(Number(lunasTarget?.sisa_tagihan ?? 0))}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rekening</Label>
            <RekeningSelect
              rekening={rekening}
              value={lunasRekeningId}
              onValueChange={setLunasRekeningId}
              placeholder="Tanpa rekening"
              includeNone={true}
              noneLabel="Tanpa rekening"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLunasTarget(null)}>
              Batal
            </Button>
            <Button
              onClick={handleLunas}
              disabled={!!lunasTarget && loadingCicilan === lunasTarget.id}
              className="bg-primary hover:bg-primary-active text-white rounded-full"
            >
              Lunaskan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detailHutang}
        onOpenChange={(open) => {
          if (!open) {
            setDetailHutangId(null);
            setEditingCicilanId(null);
            setEditCicilanDraft(emptyEditDraft());
          }
        }}
      >
        <DialogContent className="max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Cicilan</DialogTitle>
            <DialogDescription>
              {detailHutang
                ? `${detailHutang.nama_entitas} - sisa ${formatRupiah(
                    Number(detailHutang.sisa_tagihan),
                  )}`
                : "Daftar cicilan hutang/piutang."}
            </DialogDescription>
          </DialogHeader>
          {detailHutang && renderCicilanDetail(detailHutang)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
