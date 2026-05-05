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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekening</h1>
          <p className="text-muted-foreground text-sm">
            Kelola sumber dana Anda
          </p>
        </div>
        <Button
          onClick={() => {
            setEditData(null);
            setDialogOpen(true);
          }}
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
          id="btn-tambah-rekening"
        >
          <Plus className="h-4 w-4" />
          Tambah Rekening
        </Button>
      </div>

      {/* Total Balance Card */}
      <div className="rounded-2xl border bg-linear-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
        <p className="text-sm text-indigo-200 mb-1">Total Saldo (aktif)</p>
        <p className="text-3xl font-bold">{formatRupiah(totalSaldo)}</p>
        <p className="text-xs text-indigo-300 mt-2">
          {rekening.filter((r) => r.exclude_total).length} rekening dikecualikan
        </p>
      </div>

      {/* Grouped Cards */}
      {rekening.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Landmark className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Belum ada rekening</p>
          <p className="text-xs mt-1">
            Tambah rekening atau dompet pertama Anda
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([jenis, items]) => {
          const cfg = JENIS_CONFIG[jenis as JenisRekening];
          const JenisIcon = cfg.icon;
          return (
            <div key={jenis}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <JenisIcon className="h-4 w-4" />
                {jenis}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {items!.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "relative rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md group",
                      r.exclude_total && "opacity-60",
                    )}
                  >
                    {/* Color accent */}
                    <div
                      className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                      style={{ background: r.warna }}
                    />
                    <div className="pl-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{r.nama}</p>
                          <Badge variant="secondary" className="text-xs mt-0.5">
                            {r.jenis}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditData(r);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                            onClick={() => handleDelete(r.id)}
                            disabled={deleting === r.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-lg font-bold mt-2">
                        {formatRupiah(Number(r.saldo_saat_ini))}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
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
