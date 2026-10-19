"use client";

import { useState, useMemo } from "react";
import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { deleteHutang } from "@/actions/hutang-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, HandCoins, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HutangDialog from "./hutang-dialog";
import { EmptyState, PageHeader } from "@/components/common";
import { HutangGroup } from "./hutang-group";
import { useSystemPreferences } from "@/providers/system-preference-provider";

type Props = { initialHutang: Hutang[]; rekening: Rekening[] };

export default function HutangPageClient({ initialHutang }: Props) {
  const { formatRupiah } = useSystemPreferences();
  const [hutang, setHutang] = useState(initialHutang);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Hutang | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "belum_lunas" | "lunas">("semua");

  // Summary calculation:
  // Card bertag Lunas (status === 'lunas' atau is_lunas_manual === true) tidak dihitung dalam ringkasan aktif
  const totalPiutangAktif = useMemo(() => {
    return hutang
      .filter((h) => h.tipe === "memberi" && h.status !== "lunas" && !h.is_lunas_manual)
      .reduce((sum, item) => sum + Math.max(Number(item.sisa_tagihan), 0), 0);
  }, [hutang]);

  const totalHutangAktif = useMemo(() => {
    return hutang
      .filter((h) => h.tipe === "menerima" && h.status !== "lunas" && !h.is_lunas_manual)
      .reduce((sum, item) => sum + Math.max(Number(item.sisa_tagihan), 0), 0);
  }, [hutang]);

  function replaceHutang(updated: Hutang) {
    setHutang((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleDelete(id: string) {
    const res = await deleteHutang(id);
    if (res.success) {
      setHutang((prev) => prev.filter((h) => h.id !== id));
      toast.success("Catatan pihak berhasil dihapus");
    } else {
      toast.error(res.error ?? "Gagal menghapus");
    }
  }

  function handleEdit(h: Hutang) {
    setEditData(h);
    setDialogOpen(true);
  }

  // Filtered items
  const filteredHutang = useMemo(() => {
    return hutang.filter((h) => {
      const matchSearch =
        h.nama_entitas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.catatan ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      const isLunas =
        h.status === "lunas" ||
        h.is_lunas_manual === true ||
        (Number(h.total_pinjaman) > 0 && Number(h.sisa_tagihan) <= 0);

      if (statusFilter === "lunas") {
        return isLunas;
      }
      if (statusFilter === "belum_lunas") {
        return !isLunas;
      }
      return true;
    });
  }, [hutang, searchQuery, statusFilter]);

  const memberi = filteredHutang.filter((h) => h.tipe === "memberi");
  const menerima = filteredHutang.filter((h) => h.tipe === "menerima");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Hutang & Piutang"
        subtitle="Kelola daftar pihak dan pantau sisa pinjaman"
        action={
          <Button
            onClick={() => {
              setEditData(null);
              setDialogOpen(true);
            }}
            className="gap-2 bg-primary hover:bg-primary-active text-white rounded-full font-semibold h-11 px-5 shadow-none"
            id="btn-tambah-hutang"
          >
            <Plus className="h-4 w-4" />
            Tambah Pihak
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-hairline bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Piutang Aktif
              </p>
              <p className="text-xs text-muted-foreground">
                Total nominal yang masih perlu diterima
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
                Hutang Aktif
              </p>
              <p className="text-xs text-muted-foreground">
                Total nominal yang masih perlu dibayar
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

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pihak atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-input h-11 bg-card border-hairline"
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
          className="shrink-0"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto h-11 rounded-full p-1 bg-surface-strong">
            <TabsTrigger value="semua" className="rounded-full text-xs font-semibold px-4">
              Semua
            </TabsTrigger>
            <TabsTrigger value="belum_lunas" className="rounded-full text-xs font-semibold px-4">
              Belum Lunas
            </TabsTrigger>
            <TabsTrigger value="lunas" className="rounded-full text-xs font-semibold px-4">
              Lunas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Contact Cards List */}
      {filteredHutang.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={hutang.length === 0 ? "Belum ada pihak hutang/piutang" : "Tidak ditemukan pihak yang cocok"}
          description={
            hutang.length === 0
              ? "Klik tombol '+ Tambah Pihak' untuk mulai mencatat kontak hutang atau piutang."
              : "Coba ubah kata kunci pencarian atau filter status."
          }
        />
      ) : (
        <div className="space-y-6">
          <HutangGroup
            title="Piutang (Memberi Pinjaman)"
            items={memberi}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <HutangGroup
            title="Hutang (Menerima Pinjaman)"
            items={menerima}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Simple Contact Add / Edit Dialog */}
      <HutangDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditData(null);
        }}
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
