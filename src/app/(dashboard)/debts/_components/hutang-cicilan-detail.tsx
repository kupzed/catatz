"use client";

import type { Hutang, HutangCicilan } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import {
  emptyEditDraft,
  type UseHutangCicilanReturn,
} from "@/hooks/use-hutang-cicilan";
import { HutangCicilanItem } from "./hutang-cicilan-item";
import { useSystemPreferences } from "@/providers/system-preference-provider";

export type HutangCicilanDetailProps = {
  hutang: Hutang;
  rekening: Rekening[];
  cicilanHook: UseHutangCicilanReturn;
};

function sortCicilan(cicilan?: HutangCicilan[]) {
  return [...(cicilan ?? [])].sort((a, b) => {
    const timeA = new Date(`${a.tanggal}T${a.waktu ?? "00:00"}`).getTime();
    const timeB = new Date(`${b.tanggal}T${b.waktu ?? "00:00"}`).getTime();
    return timeB - timeA;
  });
}

export function HutangCicilanDetail({
  hutang,
  rekening,
  cicilanHook,
}: HutangCicilanDetailProps) {
  const { formatRupiah } = useSystemPreferences();
  const cicilan = sortCicilan(hutang.cicilan);

  return (
    <div
      data-testid={`hutang-detail-panel-${hutang.id}`}
      className="space-y-3 border-t border-hairline bg-surface-soft/60 p-4"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Detail Cicilan</p>
        <p className="text-xs text-muted-foreground">
          {hutang.nama_entitas} · sisa{" "}
          <span className="font-mono">
            {formatRupiah(Number(hutang.sisa_tagihan))}
          </span>
        </p>
      </div>

      {cicilan.length === 0 ? (
        <div className="rounded-input border border-dashed border-hairline bg-card p-4 text-center text-sm text-muted-foreground">
          Belum ada cicilan.
        </div>
      ) : (
        <div className="space-y-3">
          {cicilan.map((item) => (
            <HutangCicilanItem
              key={item.id}
              cicilan={item}
              hutang={hutang}
              rekening={rekening}
              isEditing={cicilanHook.editingCicilanId === item.id}
              editDraft={cicilanHook.editCicilanDraft}
              onEditDraftChange={cicilanHook.setEditCicilanDraft}
              onStartEdit={cicilanHook.startEditCicilan}
              onCancelEdit={() => {
                cicilanHook.setEditingCicilanId(null);
                cicilanHook.setEditCicilanDraft(emptyEditDraft());
              }}
              onSave={(targetHutang, targetCicilan) => {
                void cicilanHook.handleUpdateCicilan(
                  targetHutang,
                  targetCicilan,
                );
              }}
              onDelete={(id) => {
                void cicilanHook.handleDeleteCicilan(id);
              }}
              isLoading={cicilanHook.loadingCicilan === hutang.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
