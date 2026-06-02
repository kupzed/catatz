"use client";

import { useMemo, useState } from "react";
import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { currentTime, todayISODate } from "@/lib/utils";
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
import { ArrowDownRight, ArrowUpRight, HandCoins, Plus } from "lucide-react";
import HutangDialog from "./hutang-dialog";
import { EmptyState, PageHeader } from "@/components/common";
import { RekeningSelect } from "@/components/common/rekening-select";
import {
  emptyEditDraft,
  useHutangCicilan,
} from "@/hooks/use-hutang-cicilan";
import { HutangCicilanDetail } from "./hutang-cicilan-detail";
import { HutangGroup } from "./hutang-group";
import { useSystemPreferences } from "@/providers/system-preference-provider";

type Props = { initialHutang: Hutang[]; rekening: Rekening[] };
type LunasTarget = Hutang & { lunasRekeningId: string };

export default function HutangPageClient({ initialHutang, rekening }: Props) {
  const { formatRupiah } = useSystemPreferences();
  const [hutang, setHutang] = useState(initialHutang);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Hutang | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailHutangId, setDetailHutangId] = useState<string | null>(null);
  const [lunasTarget, setLunasTarget] = useState<LunasTarget | null>(null);

  const memberi = hutang.filter((h) => h.tipe === "memberi");
  const menerima = hutang.filter((h) => h.tipe === "menerima");
  const totalPiutangAktif = memberi.reduce(
    (sum, item) => sum + Number(item.sisa_tagihan),
    0,
  );
  const totalHutangAktif = menerima.reduce(
    (sum, item) => sum + Number(item.sisa_tagihan),
    0,
  );
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
      <PageHeader
        title="Hutang & Piutang"
        subtitle="Kelola pinjaman masuk dan keluar"
        action={
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
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-hairline bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Piutang aktif
              </p>
              <p className="text-xs text-muted-foreground">
                Sisa yang masih perlu diterima
              </p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-strong text-semantic-up">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 font-mono text-2xl font-semibold text-semantic-up">
            {formatRupiah(totalPiutangAktif)}
          </p>
        </div>

        <div className="rounded-card border border-hairline bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Hutang aktif
              </p>
              <p className="text-xs text-muted-foreground">
                Sisa yang masih perlu dibayar
              </p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-strong text-semantic-down">
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 font-mono text-2xl font-semibold text-semantic-down">
            {formatRupiah(totalHutangAktif)}
          </p>
        </div>
      </div>

      {hutang.length === 0 ? (
        <EmptyState icon={HandCoins} title="Belum ada catatan hutang" />
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
