"use client";

import { useMemo, useState } from "react";
import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { currentTime, formatRupiah, todayISODate } from "@/lib/utils";
import { createCicilan, deleteHutang } from "@/actions/hutang-action";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HandCoins, Plus } from "lucide-react";
import HutangDialog from "./hutang-dialog";
import { RekeningSelect } from "@/components/common/rekening-select";
import {
  emptyEditDraft,
  useHutangCicilan,
} from "@/hooks/use-hutang-cicilan";
import { HutangCicilanDetail } from "./hutang-cicilan-detail";
import { HutangGroup } from "./hutang-group";

type Props = { initialHutang: Hutang[]; rekening: Rekening[] };
type LunasTarget = Hutang & { lunasRekeningId: string };

export default function HutangPageClient({ initialHutang, rekening }: Props) {
  const [hutang, setHutang] = useState(initialHutang);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Hutang | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailHutangId, setDetailHutangId] = useState<string | null>(null);
  const [lunasTarget, setLunasTarget] = useState<LunasTarget | null>(null);

  const memberi = hutang.filter((h) => h.tipe === "memberi");
  const menerima = hutang.filter((h) => h.tipe === "menerima");
  const detailHutang = useMemo(
    () => hutang.find((item) => item.id === detailHutangId) ?? null,
    [detailHutangId, hutang],
  );
  const cicilanHook = useHutangCicilan({
    rekening,
    onHutangUpdated: replaceHutang,
  });

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
    setLunasTarget({
      ...h,
      lunasRekeningId: h.rekening_id ?? "none",
    });
  }

  async function handleLunas() {
    if (!lunasTarget || Number(lunasTarget.sisa_tagihan) <= 0) return;

    cicilanHook.setLoadingCicilan(lunasTarget.id);
    const res = await createCicilan({
      hutang_id: lunasTarget.id,
      nominal: Number(lunasTarget.sisa_tagihan),
      rekening_id:
        lunasTarget.lunasRekeningId && lunasTarget.lunasRekeningId !== "none"
          ? lunasTarget.lunasRekeningId
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

    cicilanHook.setLoadingCicilan(null);
  }

  function handleEdit(h: Hutang) {
    setEditData(h);
    setDialogOpen(true);
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
          <HutangGroup
            title="Piutang (Memberi Pinjaman)"
            items={memberi}
            rekening={rekening}
            onExpandToggle={setExpanded}
            expanded={expanded}
            cicilanHook={cicilanHook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLunas={openLunasDialog}
            onDetail={setDetailHutangId}
          />
          <HutangGroup
            title="Hutang (Menerima Pinjaman)"
            items={menerima}
            rekening={rekening}
            onExpandToggle={setExpanded}
            expanded={expanded}
            cicilanHook={cicilanHook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLunas={openLunasDialog}
            onDetail={setDetailHutangId}
          />
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
              value={lunasTarget?.lunasRekeningId ?? "none"}
              onValueChange={(value) =>
                setLunasTarget((target) =>
                  target ? { ...target, lunasRekeningId: value } : target,
                )
              }
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
              disabled={
                !!lunasTarget &&
                cicilanHook.loadingCicilan === lunasTarget.id
              }
              className="bg-primary hover:bg-primary-active text-white rounded-full"
            >
              Lunaskan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HutangCicilanDetail
        hutang={detailHutang}
        rekening={rekening}
        open={!!detailHutang}
        onOpenChange={(open) => {
          if (!open) {
            setDetailHutangId(null);
            cicilanHook.setEditingCicilanId(null);
            cicilanHook.setEditCicilanDraft(emptyEditDraft());
          }
        }}
        cicilanHook={cicilanHook}
      />
    </div>
  );
}
