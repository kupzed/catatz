"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Hutang, HutangCicilan } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import type { CicilanDraft } from "@/hooks/use-hutang-cicilan";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { NominalInput } from "@/components/common/nominal-input";
import { RekeningSelect } from "@/components/common/rekening-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";

export type HutangCicilanItemProps = {
  cicilan: HutangCicilan;
  hutang: Hutang;
  rekening: Rekening[];
  isEditing: boolean;
  editDraft: CicilanDraft;
  onEditDraftChange: Dispatch<SetStateAction<CicilanDraft>>;
  onStartEdit: (cicilan: HutangCicilan) => void;
  onCancelEdit: () => void;
  onSave: (hutang: Hutang, cicilan: HutangCicilan) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
};

function getRekeningLabel(rekening: Rekening[], id?: string | null) {
  if (!id) return "Tanpa rekening";
  const item = rekening.find((r) => r.id === id);
  return item ? `${item.nama} (${item.jenis})` : "Rekening tidak ditemukan";
}

export function HutangCicilanItem({
  cicilan,
  hutang,
  rekening,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isLoading,
}: HutangCicilanItemProps) {
  const { formatRupiah, formatTanggal, formatWaktu } = useSystemPreferences();

  return (
    <div className="space-y-3 rounded-input border border-hairline bg-card p-3">
      {isEditing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nominal</Label>
              <NominalInput
                value={editDraft.nominal}
                onValueChange={(value) =>
                  onEditDraftChange((prev) => ({
                    ...prev,
                    nominal: value.toString(),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rekening</Label>
              <RekeningSelect
                rekening={rekening}
                value={editDraft.rekening_id}
                onValueChange={(value) =>
                  onEditDraftChange((prev) => ({
                    ...prev,
                    rekening_id: value,
                  }))
                }
                placeholder="Tanpa rekening"
                includeNone={true}
                noneLabel="Tanpa rekening"
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-[3fr_1fr] gap-3 sm:col-span-2">
              <div className="space-y-1">
                <Label className="text-xs">Tanggal</Label>
                <Input
                  type="date"
                  value={editDraft.tanggal}
                  onChange={(event) =>
                    onEditDraftChange((prev) => ({
                      ...prev,
                      tanggal: event.target.value,
                    }))
                  }
                  className="w-full appearance-none bg-background border-input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Waktu</Label>
                <Input
                  type="time"
                  value={editDraft.waktu}
                  onChange={(event) =>
                    onEditDraftChange((prev) => ({
                      ...prev,
                      waktu: event.target.value,
                    }))
                  }
                  className="w-full appearance-none bg-background border-input px-2 sm:px-4"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Catatan</Label>
            <Input
              value={editDraft.catatan}
              onChange={(event) =>
                onEditDraftChange((prev) => ({
                  ...prev,
                  catatan: event.target.value,
                }))
              }
              placeholder="Catatan opsional"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={onCancelEdit}
            >
              <X className="h-3.5 w-3.5" />
              Batal
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-primary hover:bg-primary-active text-white rounded-full"
              disabled={isLoading}
              onClick={() => onSave(hutang, cicilan)}
            >
              <Save className="h-3.5 w-3.5" />
              Simpan
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm">
                {formatRupiah(Number(cicilan.nominal))}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTanggal(cicilan.tanggal, "d MMM yyyy")}
                {cicilan.waktu ? `, ${formatWaktu(cicilan.waktu)}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {getRekeningLabel(rekening, cicilan.rekening_id)}
              </p>
              {cicilan.catatan && (
                <p className="text-xs text-muted-foreground mt-1">
                  {cicilan.catatan}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 bg-surface-strong"
                onClick={() => onStartEdit(cicilan)}
                aria-label={`Edit cicilan ${formatRupiah(Number(cicilan.nominal))}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <ConfirmDialog
                title="Hapus Cicilan?"
                description="Cicilan ini akan dihapus dan saldo rekening terkait akan dikembalikan oleh trigger database."
                onConfirm={() => onDelete(cicilan.id)}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 bg-surface-strong text-semantic-down hover:bg-surface-strong/80 hover:text-semantic-down"
                  aria-label={`Hapus cicilan ${formatRupiah(Number(cicilan.nominal))}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </ConfirmDialog>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
