"use client";

import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { RekeningSelect } from "@/components/common/rekening-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSystemPreferences } from "@/providers/system-preference-provider";

export type HutangLunasFormProps = {
  hutang: Hutang;
  rekening: Rekening[];
  rekeningId: string;
  onRekeningChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function HutangLunasForm({
  hutang,
  rekening,
  rekeningId,
  onRekeningChange,
  onSubmit,
  isLoading,
}: HutangLunasFormProps) {
  const { formatRupiah } = useSystemPreferences();

  return (
    <div
      data-testid={`hutang-lunas-panel-${hutang.id}`}
      className="space-y-3 border-t border-hairline bg-surface-soft/60 p-4"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Pelunasan</p>
        <p className="text-xs text-muted-foreground">
          Catat pelunasan penuh sebesar{" "}
          <span className="font-mono text-foreground">
            {formatRupiah(Number(hutang.sisa_tagihan))}
          </span>
          .
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Dari / Ke Rekening</Label>
        <RekeningSelect
          rekening={rekening}
          value={rekeningId}
          onValueChange={onRekeningChange}
          placeholder="Tanpa rekening"
          includeNone={true}
          noneLabel="Tanpa rekening"
          className="h-11 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="h-11 rounded-full bg-primary px-5 text-white hover:bg-primary-active"
        >
          Lunaskan
        </Button>
      </div>
    </div>
  );
}
