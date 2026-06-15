"use client";

import { useState } from "react";
import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { currentTime, todayISODate } from "@/lib/utils";
import { createCicilan, deleteHutang } from "@/actions/hutang-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, HandCoins, Plus } from "lucide-react";
import HutangDialog from "./hutang-dialog";
import { EmptyState, PageHeader } from "@/components/common";
import {
  emptyEditDraft,
  useHutangCicilan,
} from "@/hooks/use-hutang-cicilan";
import {
  HutangGroup,
  type ExpandedHutangPanel,
} from "./hutang-group";
import type { HutangPanelMode } from "./hutang-card";
import { useSystemPreferences } from "@/providers/system-preference-provider";

type Props = { initialHutang: Hutang[]; rekening: Rekening[] };

export default function HutangPageClient({ initialHutang, rekening }: Props) {
  const { formatRupiah } = useSystemPreferences();
  const [hutang, setHutang] = useState(initialHutang);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Hutang | null>(null);
  const [expandedPanel, setExpandedPanel] =
    useState<ExpandedHutangPanel | null>(null);
  const [lunasRekening, setLunasRekening] = useState<Record<string, string>>(
    {},
  );

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
      if (expandedPanel?.id === id) setExpandedPanel(null);
      toast.success("Hutang dihapus");
    } else {
      toast.error(res.error ?? "Gagal menghapus");
    }
  }

  function handlePanelToggle(h: Hutang, mode: HutangPanelMode) {
    setExpandedPanel((current) =>
      current?.id === h.id && current.mode === mode
        ? null
        : { id: h.id, mode },
    );

    if (mode === "lunas") {
      setLunasRekening((current) => ({
        ...current,
        [h.id]: current[h.id] ?? h.rekening_id ?? "none",
      }));
    }

    if (mode !== "detail") {
      cicilanHook.setEditingCicilanId(null);
      cicilanHook.setEditCicilanDraft(emptyEditDraft());
    }
  }

  async function handleLunas(target: Hutang) {
    if (Number(target.sisa_tagihan) <= 0) return;

    cicilanHook.setLoadingCicilan(target.id);
    const rekeningId =
      lunasRekening[target.id] ?? target.rekening_id ?? "none";
    const res = await createCicilan({
      hutang_id: target.id,
      nominal: Number(target.sisa_tagihan),
      rekening_id:
        rekeningId && rekeningId !== "none" ? rekeningId : undefined,
      tanggal: todayISODate(),
      waktu: currentTime(),
      catatan: "Pelunasan",
    });

    if (res.success && res.data) {
      replaceHutang(res.data);
      setExpandedPanel(null);
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
            expandedPanel={expandedPanel}
            onPanelToggle={handlePanelToggle}
            cicilanHook={cicilanHook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            lunasRekening={lunasRekening}
            onLunasRekeningChange={(id, value) =>
              setLunasRekening((current) => ({ ...current, [id]: value }))
            }
            onLunasSubmit={(target) => {
              void handleLunas(target);
            }}
          />
          <HutangGroup
            title="Hutang (Menerima Pinjaman)"
            items={menerima}
            rekening={rekening}
            expandedPanel={expandedPanel}
            onPanelToggle={handlePanelToggle}
            cicilanHook={cicilanHook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            lunasRekening={lunasRekening}
            onLunasRekeningChange={(id, value) =>
              setLunasRekening((current) => ({ ...current, [id]: value }))
            }
            onLunasSubmit={(target) => {
              void handleLunas(target);
            }}
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
    </div>
  );
}
