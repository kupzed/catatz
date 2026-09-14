"use client";

import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import type { UseHutangCicilanReturn } from "@/hooks/use-hutang-cicilan";
import {
  HutangCard,
  type HutangPanelMode,
} from "./hutang-card";
import { HutangCicilanForm } from "./hutang-cicilan-form";
import { HutangCicilanDetail } from "./hutang-cicilan-detail";
import { HutangLunasForm } from "./hutang-lunas-form";

export type ExpandedHutangPanel = {
  id: string;
  mode: HutangPanelMode;
};

export type HutangGroupProps = {
  title: string;
  items: Hutang[];
  rekening: Rekening[];
  expandedPanel: ExpandedHutangPanel | null;
  onPanelToggle: (hutang: Hutang, mode: HutangPanelMode) => void;
  cicilanHook: UseHutangCicilanReturn;
  onEdit: (hutang: Hutang) => void;
  onDelete: (id: string) => void;
  lunasRekening: Record<string, string>;
  onLunasRekeningChange: (id: string, value: string) => void;
  onLunasSubmit: (hutang: Hutang) => void;
};

export function HutangGroup({
  title,
  items,
  rekening,
  expandedPanel,
  onPanelToggle,
  cicilanHook,
  onEdit,
  onDelete,
  lunasRekening,
  onLunasRekeningChange,
  onLunasSubmit,
}: HutangGroupProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((h) => {
          const activePanel =
            expandedPanel?.id === h.id ? expandedPanel.mode : null;

          return (
            <HutangCard
              key={h.id}
              hutang={h}
              rekening={rekening}
              activePanel={activePanel}
              onPanelToggle={(mode) => onPanelToggle(h, mode)}
              onEdit={onEdit}
              onDelete={onDelete}
            >
              {activePanel === "cicilan" && h.status !== "lunas" && (
                <HutangCicilanForm
                  hutangId={h.id}
                  rekening={rekening}
                  cicilanData={cicilanHook.cicilanData}
                  onCicilanDataChange={cicilanHook.setCicilanData}
                  onSubmit={() => {
                    void cicilanHook.handleCicilan(h);
                  }}
                  isLoading={cicilanHook.loadingCicilan === h.id}
                />
              )}
              {activePanel === "detail" && (
                <HutangCicilanDetail
                  hutang={h}
                  rekening={rekening}
                  cicilanHook={cicilanHook}
                />
              )}
              {activePanel === "lunas" && h.status !== "lunas" && (
                <HutangLunasForm
                  hutang={h}
                  rekening={rekening}
                  rekeningId={
                    lunasRekening[h.id] ?? h.rekening_id ?? "none"
                  }
                  onRekeningChange={(value) =>
                    onLunasRekeningChange(h.id, value)
                  }
                  onSubmit={() => onLunasSubmit(h)}
                  isLoading={cicilanHook.loadingCicilan === h.id}
                />
              )}
            </HutangCard>
          );
        })}
      </div>
    </div>
  );
}
