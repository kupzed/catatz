"use client";

import type { Hutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import type { UseHutangCicilanReturn } from "@/hooks/use-hutang-cicilan";
import { HutangCard } from "./hutang-card";
import { HutangCicilanForm } from "./hutang-cicilan-form";

export type HutangGroupProps = {
  title: string;
  items: Hutang[];
  rekening: Rekening[];
  onExpandToggle: (id: string | null) => void;
  expanded: string | null;
  cicilanHook: UseHutangCicilanReturn;
  onEdit: (hutang: Hutang) => void;
  onDelete: (id: string) => void;
  onLunas: (hutang: Hutang) => void;
  onDetail: (id: string) => void;
};

export function HutangGroup({
  title,
  items,
  rekening,
  onExpandToggle,
  expanded,
  cicilanHook,
  onEdit,
  onDelete,
  onLunas,
  onDetail,
}: HutangGroupProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((h) => {
          const isExpanded = expanded === h.id;

          return (
            <HutangCard
              key={h.id}
              hutang={h}
              rekening={rekening}
              isExpanded={isExpanded}
              onExpandToggle={(target) =>
                onExpandToggle(isExpanded ? null : target.id)
              }
              onDetail={onDetail}
              onLunas={onLunas}
              onEdit={onEdit}
              onDelete={onDelete}
            >
              {isExpanded && h.status !== "lunas" && (
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
            </HutangCard>
          );
        })}
      </div>
    </div>
  );
}
