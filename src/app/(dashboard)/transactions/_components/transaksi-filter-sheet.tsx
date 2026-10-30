"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Rekening } from "@/types/rekening";
import type { Kategori, TransaksiFilter, TipeTransaksi } from "@/types/transaksi";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NominalInput } from "@/components/common/nominal-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/utils";
import { Check, RotateCcw, Search, X } from "lucide-react";

export type TransaksiFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: TransaksiFilter;
  onFilterChange: Dispatch<SetStateAction<TransaksiFilter>>;
  rekening: Rekening[];
  kategori: Kategori[];
};

export function TransaksiFilterSheet({
  open,
  onOpenChange,
  filter,
  onFilterChange,
  rekening,
  kategori,
}: TransaksiFilterSheetProps) {
  const isMobile = useIsMobile();
  const { dict } = useTranslation();
  const [kategoriSearch, setKategoriSearch] = useState("");

  // Tipe segmented control: "all" | "expense" | "income" | "transfer"
  const currentTipe =
    filter.tipe &&
    filter.tipe.length === 1 &&
    ["expense", "income", "transfer"].includes(filter.tipe[0])
      ? filter.tipe[0]
      : "all";

  const isTransfer = currentTipe === "transfer";

  const handleTipeChange = (val: string) => {
    onFilterChange((prev) => {
      if (val === "all") {
        return {
          ...prev,
          tipe: [],
          transfer_asal_id: undefined,
          transfer_tujuan_id: undefined,
        };
      }
      if (val === "transfer") {
        return {
          ...prev,
          tipe: ["transfer"],
          kategori_id: [], // transfer tidak memiliki kategori
        };
      }
      return {
        ...prev,
        tipe: [val as TipeTransaksi],
        transfer_asal_id: undefined,
        transfer_tujuan_id: undefined,
      };
    });
  };

  const handleToggleRekening = (id: string) => {
    onFilterChange((prev) => {
      const current = prev.rekening_id ?? [];
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      return { ...prev, rekening_id: updated };
    });
  };

  const handleToggleKategori = (id: string) => {
    onFilterChange((prev) => {
      const current = prev.kategori_id ?? [];
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      return { ...prev, kategori_id: updated };
    });
  };

  const handleReset = () => {
    onFilterChange({
      tipe: [],
      rekening_id: [],
      kategori_id: [],
      nominal_min: undefined,
      nominal_max: undefined,
      transfer_asal_id: undefined,
      transfer_tujuan_id: undefined,
      sortBy: "tanggal",
      sortOrder: "desc",
    });
    setKategoriSearch("");
  };

  // Kategori yang relevan berdasarkan tipe transaksi aktif
  const filteredKategori = useMemo(() => {
    let list = kategori;
    if (currentTipe === "expense") {
      list = list.filter((k) => k.tipe === "expense" || k.tipe === "all");
    } else if (currentTipe === "income") {
      list = list.filter((k) => k.tipe === "income" || k.tipe === "all");
    }
    if (kategoriSearch.trim()) {
      const q = kategoriSearch.trim().toLowerCase();
      list = list.filter((k) => k.nama.toLowerCase().includes(q));
    }
    return list;
  }, [kategori, currentTipe, kategoriSearch]);

  const selectedRek = filter.rekening_id ?? [];
  const selectedKat = filter.kategori_id ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        showCloseButton={false}
        className={cn(
          "p-0 flex flex-col gap-0 bg-card text-card-foreground transition-all duration-300",
          // Mobile: muncul dari bawah ke atas dan fullscreen
          isMobile
            ? "inset-0 h-dvh max-h-dvh w-full rounded-none border-none"
            : "w-full sm:max-w-md sm:h-full border-l border-hairline shadow-lg",
        )}
      >
        {/* Header dengan safe-area padding untuk notch/island di mobile */}
        <SheetHeader className="pt-[max(1.25rem,env(safe-area-inset-top))] px-5 sm:px-6 pb-4 border-b border-hairline shrink-0 text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <SheetTitle className="text-lg font-semibold text-foreground">
                {dict.transactions.filter.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {dict.transactions.filter.subtitle}
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-strong shrink-0 cursor-pointer"
                aria-label={dict.transactions.filter.closeFilter}
              >
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Scrollable Form Body dengan padding bawah ekstra agar konten tidak tertutup footer */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 pb-32">
          {/* 1. Tipe Transaksi (Segmented Control 2x2 agar teks tidak bertumpuk di drawer desktop & mobile) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              {dict.transactions.form.type}
            </Label>
            <Tabs
              value={currentTipe}
              onValueChange={handleTipeChange}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2 gap-1.5 p-1.5 bg-surface-strong rounded-[14px] h-auto">
                <TabsTrigger
                  value="all"
                  className="h-11 rounded-[10px] text-xs sm:text-sm font-medium transition-all"
                  id="tab-filter-semua"
                >
                  {dict.common.all}
                </TabsTrigger>
                <TabsTrigger
                  value="expense"
                  className="h-11 rounded-[10px] text-xs sm:text-sm font-medium transition-all"
                  id="tab-filter-pengeluaran"
                >
                  {dict.transactions.types.expense}
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="h-11 rounded-[10px] text-xs sm:text-sm font-medium transition-all"
                  id="tab-filter-pemasukan"
                >
                  {dict.transactions.types.income}
                </TabsTrigger>
                <TabsTrigger
                  value="transfer"
                  className="h-11 rounded-[10px] text-xs sm:text-sm font-medium transition-all"
                  id="tab-filter-transfer"
                >
                  {dict.transactions.types.transfer}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 2. Filter Transfer: Sumber Dana & Tujuan Transfer (HANYA tampil saat tipe Transfer) */}
          {isTransfer ? (
            <div className="space-y-4 rounded-2xl bg-surface-soft p-4 border border-hairline">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {dict.transactions.filter.transferFlow}
                </span>
                {(filter.transfer_asal_id || filter.transfer_tujuan_id) && (
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange((prev) => ({
                        ...prev,
                        transfer_asal_id: undefined,
                        transfer_tujuan_id: undefined,
                      }))
                    }
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    {dict.transactions.filter.resetFlow}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-transfer-asal"
                  className="text-xs text-foreground font-medium"
                >
                  {dict.transactions.filter.sourceWallet}
                </Label>
                <Select
                  value={filter.transfer_asal_id ?? "all"}
                  onValueChange={(val) =>
                    onFilterChange((prev) => ({
                      ...prev,
                      transfer_asal_id: val === "all" ? undefined : val,
                    }))
                  }
                >
                  <SelectTrigger
                    id="filter-transfer-asal"
                    className="h-12 rounded-input border-hairline bg-background text-sm"
                  >
                    <SelectValue placeholder={dict.transactions.filter.allSourceWallets} />
                  </SelectTrigger>
                  <SelectContent className="z-60">
                    <SelectItem value="all">{dict.transactions.filter.allSourceWallets}</SelectItem>
                    {rekening.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: r.warna }}
                          />
                          <span>{r.nama}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            ({r.jenis})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-transfer-tujuan"
                  className="text-xs text-foreground font-medium"
                >
                  {dict.transactions.filter.destinationWallet}
                </Label>
                <Select
                  value={filter.transfer_tujuan_id ?? "all"}
                  onValueChange={(val) =>
                    onFilterChange((prev) => ({
                      ...prev,
                      transfer_tujuan_id: val === "all" ? undefined : val,
                    }))
                  }
                >
                  <SelectTrigger
                    id="filter-transfer-tujuan"
                    className="h-12 rounded-input border-hairline bg-background text-sm"
                  >
                    <SelectValue placeholder={dict.transactions.filter.allDestinations} />
                  </SelectTrigger>
                  <SelectContent className="z-60">
                    <SelectItem value="all">{dict.transactions.filter.allDestinations}</SelectItem>
                    {rekening.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: r.warna }}
                          />
                          <span>{r.nama}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            ({r.jenis})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              {/* 3. Filter Rekening (saat BUKAN transfer) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">
                    {dict.common.wallet}
                  </Label>
                  {selectedRek.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onFilterChange((prev) => ({ ...prev, rekening_id: [] }))
                      }
                      className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      Reset ({selectedRek.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rekening.map((r) => {
                    const isSelected = selectedRek.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleToggleRekening(r.id)}
                        className={cn(
                          "inline-flex items-center gap-2 h-9 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none active:scale-95",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-surface-soft text-foreground border-hairline hover:bg-surface-strong",
                        )}
                        id={`filter-rek-${r.id}`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: isSelected ? "#ffffff" : r.warna,
                          }}
                        />
                        <span>{r.nama}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Filter Kategori (saat BUKAN transfer) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">
                    {dict.common.category}
                  </Label>
                  {selectedKat.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onFilterChange((prev) => ({ ...prev, kategori_id: [] }))
                      }
                      className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      Reset ({selectedKat.length})
                    </button>
                  )}
                </div>

                {kategori.length > 8 && (
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder={dict.transactions.filter.searchCategory}
                      value={kategoriSearch}
                      onChange={(e) => setKategoriSearch(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-input border border-hairline bg-background text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 max-h-56 sm:max-h-48 overflow-y-auto p-0.5">
                  {filteredKategori.map((k) => {
                    const isSelected = selectedKat.includes(k.id);
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => handleToggleKategori(k.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-9 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none active:scale-95",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-surface-soft text-foreground border-hairline hover:bg-surface-strong",
                        )}
                        id={`filter-kat-${k.id}`}
                      >
                        <span>{k.ikon}</span>
                        <span>{k.nama}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-3" />}
                      </button>
                    );
                  })}
                  {filteredKategori.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">
                      {dict.transactions.filter.noCategoriesFound}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 5. Filter Rentang Nominal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">
                {dict.transactions.filter.nominalRange}
              </Label>
              {(filter.nominal_min || filter.nominal_max) && (
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange((prev) => ({
                      ...prev,
                      nominal_min: undefined,
                      nominal_max: undefined,
                    }))
                  }
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  {dict.transactions.filter.resetNominal}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  {dict.transactions.filter.minNominal}
                </span>
                <NominalInput
                  id="filter-nominal-min"
                  placeholder="Rp Min"
                  value={filter.nominal_min ?? ""}
                  onValueChange={(val) =>
                    onFilterChange((prev) => ({
                      ...prev,
                      nominal_min:
                        typeof val === "number"
                          ? val
                          : val === ""
                            ? undefined
                            : Number(val),
                    }))
                  }
                  className="h-12 rounded-input text-sm font-mono border-hairline bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  {dict.transactions.filter.maxNominal}
                </span>
                <NominalInput
                  id="filter-nominal-max"
                  placeholder="Rp Max"
                  value={filter.nominal_max ?? ""}
                  onValueChange={(val) =>
                    onFilterChange((prev) => ({
                      ...prev,
                      nominal_max:
                        typeof val === "number"
                          ? val
                          : val === ""
                            ? undefined
                            : Number(val),
                    }))
                  }
                  className="h-12 rounded-input text-sm font-mono border-hairline bg-background"
                />
              </div>
            </div>
          </div>

          {/* 6. Urutkan (Sort) */}
          <div className="space-y-1.5">
            <Label
              htmlFor="filter-sort-select"
              className="text-sm font-semibold text-foreground"
            >
              {dict.transactions.filter.sortTransactions}
            </Label>
            <Select
              value={`${filter.sortBy ?? "tanggal"}-${filter.sortOrder ?? "desc"}`}
              onValueChange={(v) => {
                const [by, order] = v.split("-") as [
                  TransaksiFilter["sortBy"],
                  TransaksiFilter["sortOrder"],
                ];
                onFilterChange((f) => ({ ...f, sortBy: by, sortOrder: order }));
              }}
            >
              <SelectTrigger
                id="filter-sort-select"
                className="h-12 rounded-input border-hairline bg-background text-sm"
              >
                <SelectValue placeholder={dict.transactions.filter.sortPlaceholder} />
              </SelectTrigger>
              <SelectContent className="z-60">
                <SelectItem value="tanggal-desc">{dict.transactions.filter.sortDateDesc}</SelectItem>
                <SelectItem value="tanggal-asc">{dict.transactions.filter.sortDateAsc}</SelectItem>
                <SelectItem value="nominal-desc">{dict.transactions.filter.sortAmountDesc}</SelectItem>
                <SelectItem value="nominal-asc">{dict.transactions.filter.sortAmountAsc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fixed Footer dengan safe-area padding untuk home indicator bar di iOS */}
        <SheetFooter className="px-5 sm:px-6 py-4 border-t border-hairline bg-card/95 backdrop-blur-sm shrink-0 flex flex-row items-center justify-between gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="rounded-full h-12 px-5 text-xs font-medium border-hairline hover:bg-surface-soft gap-2 shrink-0 cursor-pointer"
            id="btn-reset-filter-sheet"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{dict.common.reset}</span>
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full h-12 px-6 bg-primary hover:bg-[#003ecc] text-white font-semibold text-sm transition-colors flex-1 cursor-pointer shadow-sm"
            id="btn-apply-filter-sheet"
          >
            {dict.transactions.filter.applyFilter}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
