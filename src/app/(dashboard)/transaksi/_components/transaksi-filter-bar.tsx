"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Rekening } from "@/types/rekening";
import type { TransaksiFilter } from "@/types/transaksi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RekeningSelect } from "@/components/common/rekening-select";
import { Plus, Search } from "lucide-react";

export type TransaksiFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filter: TransaksiFilter;
  onFilterChange: Dispatch<SetStateAction<TransaksiFilter>>;
  rekening: Rekening[];
  onAddClick: () => void;
};

export function TransaksiFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  rekening,
  onAddClick,
}: TransaksiFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul atau catatan..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={onAddClick}
          className="h-11 px-5 bg-primary hover:bg-[#003ecc] text-white rounded-full font-semibold gap-2 shrink-0 transition-colors"
          id="btn-tambah-transaksi"
        >
          <Plus className="h-4 w-4" />
          Transaksi Baru
        </Button>
      </div>

      <div className="flex w-full gap-2">
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
            className="flex-1 text-xs text-foreground border-hairline"
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

        <Select
          value={filter.tipe ?? "all"}
          onValueChange={(v) =>
            onFilterChange((f) => ({
              ...f,
              tipe: v as TransaksiFilter["tipe"],
            }))
          }
        >
          <SelectTrigger
            size="sm"
            className="flex-1 text-xs text-foreground border-hairline"
            id="filter-tipe"
          >
            <SelectValue placeholder="Semua tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="correction">Koreksi Saldo</SelectItem>
          </SelectContent>
        </Select>

        <RekeningSelect
          rekening={rekening}
          value={filter.rekening_id ?? "none"}
          onValueChange={(v) =>
            onFilterChange((f) => ({
              ...f,
              rekening_id: v === "none" ? undefined : v,
            }))
          }
          placeholder="Semua rekening"
          includeNone={true}
          noneLabel="Semua Rekening"
          size="sm"
          className="flex-1 text-xs text-foreground border-hairline"
          id="filter-rekening"
        />
      </div>
    </div>
  );
}
