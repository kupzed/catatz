"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Hutang, HutangCicilan } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import type { CicilanDraft } from "@/hooks/use-hutang-cicilan";
import type { Dictionary } from "@/i18n/types";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { NominalInput } from "@/components/common/nominal-input";
import { RekeningSelect } from "@/components/common/rekening-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClearableInput } from "@/components/common/clearable-input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

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

function getRekeningLabel(rekening: Rekening[], id?: string | null, dict?: Dictionary) {
  if (!id) return dict?.debts.installment.noWallet ?? "Tanpa rekening";
  const item = rekening.find((r) => r.id === id);
  return item ? `${item.nama} (${item.jenis})` : (dict?.debts.installment.walletNotFound ?? "Rekening tidak ditemukan");
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
  const { dict } = useTranslation();

  return (
    <div className="space-y-3 rounded-input border border-hairline bg-card p-3">
      {isEditing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{dict.debts.installment.nominal}</Label>
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
              <Label className="text-xs">{dict.debts.installment.wallet}</Label>
              <RekeningSelect
                rekening={rekening}
                value={editDraft.rekening_id}
                onValueChange={(value) =>
                  onEditDraftChange((prev) => ({
                    ...prev,
                    rekening_id: value,
                  }))
                }
                placeholder={dict.debts.installment.noWallet}
                includeNone={true}
                noneLabel={dict.debts.installment.noWallet}
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-[3fr_1fr] gap-3 sm:col-span-2">
              <div className="space-y-1">
                <Label className="text-xs">{dict.debts.installment.date}</Label>
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
                <Label className="text-xs">{dict.common.time}</Label>
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
            <Label className="text-xs">{dict.debts.installment.notes}</Label>
            <ClearableInput
              value={editDraft.catatan}
              onChange={(event) =>
                onEditDraftChange((prev) => ({
                  ...prev,
                  catatan: event.target.value,
                }))
              }
              onClear={() =>
                onEditDraftChange((prev) => ({
                  ...prev,
                  catatan: "",
                }))
              }
              placeholder={dict.debts.installment.notesOptional}
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
              {dict.common.cancel}
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-primary hover:bg-primary-active text-white rounded-full"
              disabled={isLoading}
              onClick={() => onSave(hutang, cicilan)}
            >
              <Save className="h-3.5 w-3.5" />
              {dict.common.save}
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
                {getRekeningLabel(rekening, cicilan.rekening_id, dict)}
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
                aria-label={dict.debts.installment.editAria.replace(
                  "{amount}",
                  formatRupiah(Number(cicilan.nominal)),
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <ConfirmDialog
                title={dict.debts.installment.deleteConfirmTitle}
                description={dict.debts.installment.deleteConfirmDescription}
                onConfirm={() => onDelete(cicilan.id)}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 bg-surface-strong text-semantic-down hover:bg-surface-strong/80 hover:text-semantic-down"
                  aria-label={dict.debts.installment.deleteAria.replace(
                    "{amount}",
                    formatRupiah(Number(cicilan.nominal)),
                  )}
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
