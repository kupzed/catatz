"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Rekening } from "@/types/rekening";
import type { CicilanData } from "@/hooks/use-hutang-cicilan";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NominalInput } from "@/components/common/nominal-input";
import { RekeningSelect } from "@/components/common/rekening-select";
import { useTranslation } from "@/i18n/use-translation";

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
  const { dict } = useTranslation();

  return (
    <div className="space-y-3 border-t border-hairline bg-surface-soft/60 p-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">{dict.debts.installment.amountLabel}</Label>
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
          <Label className="text-xs">{dict.debts.installment.walletLabel}</Label>
          <RekeningSelect
            rekening={rekening}
            value={cicilanData[hutangId]?.rekening_id ?? "none"}
            onValueChange={(val) =>
              onCicilanDataChange((prev) => ({
                ...prev,
                [hutangId]: { ...prev[hutangId], rekening_id: val },
              }))
            }
            placeholder={dict.debts.installment.noWallet}
            includeNone={true}
            noneLabel={dict.debts.installment.noWallet}
            className="h-12 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={isLoading}
          className="h-11 rounded-full bg-primary px-5 text-white hover:bg-primary-active"
        >
          {dict.debts.installment.record}
        </Button>
      </div>
    </div>
  );
}
