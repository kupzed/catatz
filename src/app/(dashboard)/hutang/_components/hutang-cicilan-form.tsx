"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Rekening } from "@/types/rekening";
import type { CicilanData } from "@/hooks/use-hutang-cicilan";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NominalInput } from "@/components/common/nominal-input";
import { RekeningSelect } from "@/components/common/rekening-select";

export type HutangCicilanFormProps = {
  hutangId: string;
  rekening: Rekening[];
  cicilanData: CicilanData;
  onCicilanDataChange: Dispatch<SetStateAction<CicilanData>>;
  onSubmit: () => void;
  isLoading: boolean;
};

export function HutangCicilanForm({
  hutangId,
  rekening,
  cicilanData,
  onCicilanDataChange,
  onSubmit,
  isLoading,
}: HutangCicilanFormProps) {
  return (
    <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Nominal Cicilan (Rp)</Label>
          <NominalInput
            placeholder="0"
            value={cicilanData[hutangId]?.nominal ?? ""}
            onValueChange={(val) =>
              onCicilanDataChange((prev) => ({
                ...prev,
                [hutangId]: {
                  ...prev[hutangId],
                  nominal: val.toString(),
                },
              }))
            }
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Dari / Ke Rekening</Label>
          <RekeningSelect
            rekening={rekening}
            value={cicilanData[hutangId]?.rekening_id ?? "none"}
            onValueChange={(val) =>
              onCicilanDataChange((prev) => ({
                ...prev,
                [hutangId]: { ...prev[hutangId], rekening_id: val },
              }))
            }
            placeholder="Tanpa rekening"
            includeNone={true}
            noneLabel="Tanpa rekening"
            className="h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={isLoading}
          className="h-8 bg-primary hover:bg-primary-active text-white rounded-full px-4"
        >
          Catat
        </Button>
      </div>
    </div>
  );
}
