"use client";

import { useState, useTransition } from "react";
import type { Kategori } from "@/types/transaksi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
import KategoriDialog from "./kategori-dialog";
import { deleteKategori } from "@/actions/kategori-action";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState, PageHeader } from "@/components/common";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  kategori: Kategori[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPE_CONFIG = {
  income: {
    label: "Pemasukan",
    icon: TrendingUp,
    badgeClass: "bg-semantic-up/10 text-semantic-up border-0",
  },
  expense: {
    label: "Pengeluaran",
    icon: TrendingDown,
    badgeClass: "bg-semantic-down/10 text-semantic-down border-0",
  },
  all: {
    label: "Semua Tipe",
    icon: ArrowLeftRight,
    badgeClass: "bg-primary/10 text-primary border-0",
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

type KategoriCardProps = {
  kategori: Kategori;
  onEdit: (k: Kategori) => void;
  onDelete: (k: Kategori) => void;
};

// ─── KategoriCard ─────────────────────────────────────────────────────────────

function KategoriCard({ kategori, onEdit, onDelete }: KategoriCardProps) {
  return (
    <div className="group flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3 transition-colors hover:bg-surface-soft">
      <div className="flex items-center gap-3 min-w-0">
        {/* Ikon + warna indikator */}
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-base shrink-0"
          style={{
            background: kategori.warna ? `${kategori.warna}20` : undefined,
          }}
        >
          {kategori.ikon ?? "📂"}
        </div>
        {/* Nama + tipe */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
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
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full bg-surface-strong text-foreground hover:bg-surface-strong/80"
              onClick={() => onEdit(kategori)}
              aria-label={`Edit ${kategori.nama}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <ConfirmDialog
              title={`Hapus kategori "${kategori.nama}"?`}
              description="Tindakan ini tidak dapat dibatalkan. Kategori ini akan dihapus dari sistem."
              onConfirm={() => onDelete(kategori)}
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
                aria-label={`Hapus ${kategori.nama}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ConfirmDialog>
          </div>
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
  const [items, setItems] = useState<Kategori[]>(kategori);
  const [, startTransition] = useTransition();

  const systemKat = items.filter((k) => k.is_system);
  const customKat = items.filter((k) => !k.is_system);

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
    startTransition(async () => {
      const res = await deleteKategori(k.id);
      if (res.success) {
        setItems((prev) => prev.filter((x) => x.id !== k.id));
        toast.success(`Kategori "${k.nama}" berhasil dihapus`);
      } else {
        toast.error(res.error ?? "Gagal menghapus kategori");
      }
    });
  }

  function handleOpenAdd() {
    setEditTarget(null);
    setShowDialog(true);
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <PageHeader
        title="Kategori"
        subtitle="Kelola kategori untuk transaksi Anda."
        subtitleClassName="mt-0.5"
        action={
          <Button
            onClick={handleOpenAdd}
            className="gap-2 bg-primary hover:bg-primary-active text-white rounded-full font-semibold shrink-0"
            id="btn-tambah-kategori"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        }
      />

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
                "inline-flex items-center rounded-full px-4 py-1 text-sm font-medium transition-colors",
                filterTipe === t
                  ? "bg-primary text-white"
                  : "bg-surface-strong text-muted-foreground hover:text-foreground",
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
          <EmptyState
            icon={Tags}
            title="Belum ada kategori kustom."
            className="rounded-lg border border-dashed bg-muted/30 py-10 text-center"
            iconClassName="h-8 w-8 mx-auto text-muted-foreground/40 mb-2 opacity-100"
            titleClassName="text-sm text-muted-foreground"
            actionClassName="contents"
            action={
              <Button
                variant="link"
                size="sm"
                onClick={handleOpenAdd}
                className="mt-1 text-primary h-auto p-0 underline-offset-4 hover:underline"
              >
                + Tambah kategori pertama
              </Button>
            }
          />
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

      <KategoriDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editData={editTarget}
        onCreated={(k) => {
          setItems((prev) => [k, ...prev]);
          setShowDialog(false);
        }}
        onUpdated={(k) => {
          setItems((prev) => prev.map((x) => (x.id === k.id ? k : x)));
          setShowDialog(false);
        }}
      />
    </div>
  );
}
