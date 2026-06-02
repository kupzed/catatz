"use client";

import type { Hutang, HutangCicilan } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import {
  emptyEditDraft,
  type UseHutangCicilanReturn,
} from "@/hooks/use-hutang-cicilan";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HutangCicilanItem } from "./hutang-cicilan-item";
import { useSystemPreferences } from "@/providers/system-preference-provider";

export type HutangCicilanDetailProps = {
  hutang: Hutang | null;
  rekening: Rekening[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  open,
  onOpenChange,
  cicilanHook,
}: HutangCicilanDetailProps) {
  const { formatRupiah } = useSystemPreferences();
  const cicilan = sortCicilan(hutang?.cicilan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Cicilan</DialogTitle>
          <DialogDescription>
            {hutang
              ? `${hutang.nama_entitas} - sisa ${formatRupiah(
                  Number(hutang.sisa_tagihan),
                )}`
              : "Daftar cicilan hutang/piutang."}
          </DialogDescription>
        </DialogHeader>

        {hutang &&
          (cicilan.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
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
          ))}
      </DialogContent>
    </Dialog>
  );
}
