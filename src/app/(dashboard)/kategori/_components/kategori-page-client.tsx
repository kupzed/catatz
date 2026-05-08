"use client";

import { useState, useTransition } from "react";
import type { Kategori } from "@/types/transaksi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  kategori: Kategori[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPE_CONFIG = {
  income: {
    label: "Pemasukan",
    icon: TrendingUp,
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  expense: {
    label: "Pengeluaran",
    icon: TrendingDown,
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  all: {
    label: "Semua Tipe",
    icon: ArrowLeftRight,
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
} as const;

type TipeBadgeProps = { tipe: Kategori["tipe"] };
function TipeBadge({ tipe }: TipeBadgeProps) {
  const cfg = TIPE_CONFIG[tipe as keyof typeof TIPE_CONFIG];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        cfg.badgeClass,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── KategoriCard ─────────────────────────────────────────────────────────────

function KategoriCard({
  kategori,
  onEdit,
  onDelete,
}: {
  kategori: Kategori;
  onEdit: (k: Kategori) => void;
  onDelete: (k: Kategori) => void;
}) {
  return (
    <div className="group flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-all hover:border-border/80 hover:bg-accent/30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Ikon + warna indikator */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{
            background: kategori.warna ? `${kategori.warna}20` : undefined,
          }}
        >
          {kategori.ikon ?? "📂"}
        </div>
        {/* Nama + tipe */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-tight">
            {kategori.nama}
          </p>
          <div className="mt-0.5">
            <TipeBadge tipe={kategori.tipe} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {kategori.is_system ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Sistem
          </span>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(kategori)}
              aria-label={`Edit ${kategori.nama}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
              onClick={() => onDelete(kategori)}
              aria-label={`Hapus ${kategori.nama}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Client ─────────────────────────────────────────────────────────

export default function KategoriPageClient({ kategori }: Props) {
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | null>(null);
  const [, startTransition] = useTransition();

  const systemKat = kategori.filter((k) => k.is_system);
  const customKat = kategori.filter((k) => !k.is_system);

  function applyFilter(list: Kategori[]) {
    return list.filter((k) => {
      const matchSearch =
        !search ||
        k.nama.toLowerCase().includes(search.toLowerCase()) ||
        (k.ikon ?? "").includes(search);
      const matchTipe = filterTipe === "all" || k.tipe === filterTipe;
      return matchSearch && matchTipe;
    });
  }

  const filteredSystem = applyFilter(systemKat);
  const filteredCustom = applyFilter(customKat);

  function handleEdit(k: Kategori) {
    setEditTarget(k);
    setShowDialog(true);
  }

  function handleDelete(k: Kategori) {
    startTransition(() => {
      toast.info(`Hapus kategori "${k.nama}" — segera hadir`);
    });
  }

  function handleOpenAdd() {
    setEditTarget(null);
    setShowDialog(true);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {/* <Tags className="h-6 w-6 text-indigo-500" /> */}
            Kategori
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Kelola kategori untuk transaksi Anda.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
          id="btn-tambah-kategori"
        >
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id="kategori-search"
          placeholder="Cari kategori…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", "income", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipe(t)}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all",
                filterTipe === t
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "text-muted-foreground hover:text-foreground hover:border-border/80",
              )}
            >
              {t === "all"
                ? "Semua"
                : (TIPE_CONFIG[t as keyof typeof TIPE_CONFIG]?.label ?? t)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom kategori */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Kategori Kustom
          </h2>
          <Badge variant="secondary" className="text-xs">
            {filteredCustom.length}
          </Badge>
        </div>
        {filteredCustom.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 py-10 text-center">
            <Tags className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Belum ada kategori kustom.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={handleOpenAdd}
              className="mt-1 text-indigo-500 h-auto p-0"
            >
              + Tambah kategori pertama
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredCustom.map((k) => (
              <KategoriCard
                key={k.id}
                kategori={k}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* System kategori */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Kategori Sistem
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tidak dapat diubah atau dihapus
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredSystem.length}
          </Badge>
        </div>
        <div className="grid gap-2">
          {filteredSystem.map((k) => (
            <KategoriCard
              key={k.id}
              kategori={k}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>

      {/* Add/Edit Dialog (placeholder) */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `Edit: ${editTarget.nama}` : "Tambah Kategori"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="kat-nama">Nama</Label>
              <Input
                id="kat-nama"
                defaultValue={editTarget?.nama ?? ""}
                placeholder="cth. Belanja Mingguan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kat-ikon">Ikon (emoji)</Label>
              <Input
                id="kat-ikon"
                defaultValue={editTarget?.ikon ?? ""}
                placeholder="🛒"
                className="text-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Form lengkap dengan pilihan tipe & warna segera hadir.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => {
                toast.info("Simpan kategori — segera hadir");
                setShowDialog(false);
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
