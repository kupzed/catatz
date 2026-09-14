"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Rekening } from "@/types/rekening";
import type { Kategori, TransaksiFilter, TipeTransaksi } from "@/types/transaksi";
import { Button } from "@/components/ui/button";
import { ClearableInput } from "@/components/common/clearable-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus, Search } from "lucide-react";

export type TransaksiFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filter: TransaksiFilter;
  onFilterChange: Dispatch<SetStateAction<TransaksiFilter>>;
  rekening: Rekening[];
  kategori: Kategori[];
  onAddClick: () => void;
};

/* ------------------------------------------------------------------ */
/*  Helper: toggle item di dalam array                                 */
/* ------------------------------------------------------------------ */
function toggleArrayItem<T>(arr: T[] | undefined, item: T): T[] {
  const current = arr ?? [];
  return current.includes(item)
    ? current.filter((i) => i !== item)
    : [...current, item];
}

/* ------------------------------------------------------------------ */
/*  Tipe options                                                       */
/* ------------------------------------------------------------------ */
const TIPE_OPTIONS: { value: TipeTransaksi; label: string }[] = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
  { value: "correction", label: "Koreksi Saldo" },
];

/* ------------------------------------------------------------------ */
/*  Shared trigger className                                           */
/* ------------------------------------------------------------------ */
const triggerClassName =
  "flex h-12 w-full items-center justify-between gap-1 rounded-input border border-hairline bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-card [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

export function TransaksiFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  rekening,
  kategori,
  onAddClick,
}: TransaksiFilterBarProps) {
  /* ---- tipe helpers ---- */
  const selectedTipe = filter.tipe ?? [];
  const tipeLabel =
    selectedTipe.length === 0
      ? "Semua Tipe"
      : selectedTipe.length === 1
        ? TIPE_OPTIONS.find((o) => o.value === selectedTipe[0])?.label ?? "Tipe"
        : `Tipe`;

  /* ---- rekening helpers ---- */
  const selectedRek = filter.rekening_id ?? [];
  const rekLabel =
    selectedRek.length === 0
      ? "Semua Rekening"
      : selectedRek.length === 1
        ? rekening.find((r) => r.id === selectedRek[0])?.nama ?? "Rekening"
        : `Rekening`;

  /* ---- kategori helpers ---- */
  const selectedKat = filter.kategori_id ?? [];
  const katLabel =
    selectedKat.length === 0
      ? "Semua Kategori"
      : selectedKat.length === 1
        ? kategori.find((k) => k.id === selectedKat[0])?.nama ?? "Kategori"
        : `Kategori`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <ClearableInput
            placeholder="Cari judul, catatan, atau kategori..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            className="pl-9"
          />
        </div>
        <Button
          onClick={onAddClick}
          className="h-12 px-5 bg-primary hover:bg-[#003ecc] text-white rounded-full font-semibold gap-2 shrink-0 transition-colors"
          id="btn-tambah-transaksi"
        >
          <Plus className="h-4 w-4" />
          Transaksi Baru
        </Button>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        {/* ── Sort (tetap single-select) ── */}
        <Select
          value={`${filter.sortBy}-${filter.sortOrder}`}
          onValueChange={(v) => {
            const [by, order] = v.split("-") as [
              TransaksiFilter["sortBy"],
              TransaksiFilter["sortOrder"],
            ];
            onFilterChange((f) => ({ ...f, sortBy: by, sortOrder: order }));
          }}
        >
          <SelectTrigger
            size="sm"
            className="h-12! min-w-0 text-sm text-foreground border-hairline"
            id="filter-sort"
          >
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tanggal-desc">
              {"\uD83D\uDCC5 Terbaru"}
            </SelectItem>
            <SelectItem value="tanggal-asc">
              {"\uD83D\uDCC5 Terlama"}
            </SelectItem>
            <SelectItem value="nominal-desc">
              {"\uD83D\uDCB0 Terbesar"}
            </SelectItem>
            <SelectItem value="nominal-asc">
              {"\uD83D\uDCB0 Terkecil"}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* ── Tipe (multi-select) ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={triggerClassName}
              id="filter-tipe"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="truncate">{tipeLabel}</span>
                {selectedTipe.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center"
                  >
                    {selectedTipe.length}
                  </Badge>
                )}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuLabel>Tipe Transaksi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TIPE_OPTIONS.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={selectedTipe.includes(opt.value)}
                onCheckedChange={() =>
                  onFilterChange((f) => ({
                    ...f,
                    tipe: toggleArrayItem(f.tipe, opt.value),
                  }))
                }
                onSelect={(e) => e.preventDefault()}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Rekening (multi-select) ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={triggerClassName}
              id="filter-rekening"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="truncate">{rekLabel}</span>
                {selectedRek.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center"
                  >
                    {selectedRek.length}
                  </Badge>
                )}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuLabel>Rekening</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {rekening.map((r) => (
              <DropdownMenuCheckboxItem
                key={r.id}
                checked={selectedRek.includes(r.id)}
                onCheckedChange={() =>
                  onFilterChange((f) => ({
                    ...f,
                    rekening_id: toggleArrayItem(f.rekening_id, r.id),
                  }))
                }
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: r.warna }}
                  />
                  {r.nama}
                  <span className="text-muted-foreground text-xs ml-1 font-normal">
                    ({r.jenis})
                  </span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Kategori (multi-select, baru) ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={triggerClassName}
              id="filter-kategori"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="truncate">{katLabel}</span>
                {selectedKat.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center"
                  >
                    {selectedKat.length}
                  </Badge>
                )}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48 max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Kategori</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {kategori.map((k) => (
              <DropdownMenuCheckboxItem
                key={k.id}
                checked={selectedKat.includes(k.id)}
                onCheckedChange={() =>
                  onFilterChange((f) => ({
                    ...f,
                    kategori_id: toggleArrayItem(f.kategori_id, k.id),
                  }))
                }
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex items-center gap-2">
                  <span>{k.ikon}</span>
                  {k.nama}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
