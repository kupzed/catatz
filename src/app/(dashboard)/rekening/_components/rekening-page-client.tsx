"use client";

import { useState, useMemo } from "react";
import type { Rekening, JenisRekening } from "@/types/rekening";
import { formatRupiah } from "@/lib/utils";
import { deleteRekening, toggleExcludeTotal } from "@/actions/rekening-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Landmark,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import RekeningDialog from "./rekening-dialog";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState, PageHeader } from "@/components/common";

type Props = { initialRekening: Rekening[] };

const JENIS_CONFIG: Record<
  JenisRekening,
  { icon: React.ElementType; color: string }
> = {
  Tunai: { icon: Wallet, color: "text-amber-500 bg-amber-500/10" },
  Bank: { icon: Landmark, color: "text-blue-500 bg-blue-500/10" },
  "E-Wallet": { icon: Smartphone, color: "text-purple-500 bg-purple-500/10" },
  Investasi: { icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
};

const JENIS_ORDER: JenisRekening[] = ["Bank", "E-Wallet", "Tunai", "Investasi"];

export default function RekeningPageClient({ initialRekening }: Props) {
  const [rekening, setRekening] = useState(initialRekening);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Rekening | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalSaldo = useMemo(
    () =>
      rekening
        .filter((r) => !r.exclude_total)
        .reduce((s, r) => s + Number(r.saldo_saat_ini), 0),
    [rekening],
  );

  const grouped = useMemo(() => {
    const g: Partial<Record<JenisRekening, Rekening[]>> = {};
    JENIS_ORDER.forEach((j) => {
      const items = rekening.filter((r) => r.jenis === j);
      if (items.length > 0) g[j] = items;
    });
    return g;
  }, [rekening]);

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await deleteRekening(id);
    if (res.success) {
      setRekening((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rekening dihapus");
    } else {
      toast.error(res.error ?? "Gagal menghapus");
    }
    setDeleting(null);
  }

  async function handleExcludeToggle(id: string, current: boolean) {
    const res = await toggleExcludeTotal(id, !current);
    if (res.success) {
      setRekening((prev) =>
        prev.map((r) => (r.id === id ? { ...r, exclude_total: !current } : r)),
      );
    } else {
      toast.error(res.error ?? "Gagal memperbarui");
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Rekening"
        subtitle="Kelola sumber dana Anda"
        action={
          <Button
            onClick={() => {
              setEditData(null);
              setDialogOpen(true);
            }}
            className="gap-2 bg-primary hover:bg-primary-active text-white rounded-full font-semibold"
            id="btn-tambah-rekening"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        }
      />

      {/* Total Balance Card */}
      <div className="rounded-card bg-primary p-8 text-white ring-1 ring-white/5">
        <p className="text-sm text-white uppercase tracking-wider mb-2">
          Total Saldo (aktif)
        </p>
        <p className="font-mono text-[44px] font-normal tracking-[-1px] text-white leading-none">
          {formatRupiah(totalSaldo)}
        </p>
        <p className="text-xs text-white/60 mt-3">
          {rekening.filter((r) => r.exclude_total).length} rekening dikecualikan
        </p>
      </div>

      {/* Grouped Cards */}
      {rekening.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Belum ada rekening"
          description="Tambah rekening atau dompet pertama Anda"
        />
      ) : (
        Object.entries(grouped).map(([jenis, items]) => {
          const cfg = JENIS_CONFIG[jenis as JenisRekening];
          const JenisIcon = cfg.icon;
          return (
            <div key={jenis}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <JenisIcon className="h-4 w-4" />
                {jenis}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {items!.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "relative rounded-card border border-hairline bg-card p-6 transition-colors hover:bg-surface-soft group border-t-2",
                      r.exclude_total && "opacity-60",
                    )}
                    style={{ borderTopColor: r.warna ?? undefined }}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {r.nama}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-xs mt-0.5 rounded-full bg-surface-strong text-muted-foreground"
                          >
                            {r.jenis}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-surface-strong hover:bg-surface-strong/80"
                            onClick={() => {
                              setEditData(r);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <ConfirmDialog
                            title="Hapus Rekening?"
                            description="Transaksi yang terkait dengan rekening ini mungkin akan kehilangan referensinya."
                            onConfirm={() => handleDelete(r.id)}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
                              disabled={deleting === r.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </div>
                      <p className="font-mono text-xl font-medium text-foreground mt-3">
                        {formatRupiah(Number(r.saldo_saat_ini))}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Switch
                          checked={!r.exclude_total}
                          onCheckedChange={() =>
                            handleExcludeToggle(r.id, r.exclude_total)
                          }
                          id={`exclude-${r.id}`}
                          className="scale-75"
                        />
                        <label
                          htmlFor={`exclude-${r.id}`}
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          {r.exclude_total
                            ? "Dikecualikan dari total"
                            : "Termasuk dalam total"}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <RekeningDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditData(null);
        }}
        editData={editData}
        onCreated={(r) => {
          setRekening((prev) => [...prev, r]);
          setDialogOpen(false);
        }}
        onUpdated={(r) => {
          setRekening((prev) => prev.map((x) => (x.id === r.id ? r : x)));
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
