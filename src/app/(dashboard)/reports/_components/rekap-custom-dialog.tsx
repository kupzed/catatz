"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCustomPeriod,
  deleteCustomPeriod,
  updateCustomPeriod,
} from "@/actions/rekap-period-action";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ClearableInput } from "@/components/common/clearable-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTodayInJakarta } from "@/lib/rekap-period";
import type { CustomPeriod } from "@/types/rekap";
import {
  customPeriodSchema,
  type CustomPeriodSchema,
} from "@/validations/rekap-validation";
import { useTranslation } from "@/i18n/use-translation";

export type RekapCustomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: CustomPeriod | null;
  onSuccess?: () => void;
};

export function RekapCustomDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: RekapCustomDialogProps) {
  const { dict } = useTranslation();
  const isEdit = !!editData;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const today = getTodayInJakarta();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomPeriodSchema>({
    resolver: zodResolver(customPeriodSchema),
    defaultValues: {
      nama: "",
      tanggal_mulai: today,
      tanggal_selesai: today,
    },
  });

  // Sinkronkan form saat editData berubah atau dialog dibuka
  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          nama: editData.nama,
          tanggal_mulai: editData.tanggal_mulai,
          tanggal_selesai: editData.tanggal_selesai,
        });
      } else {
        reset({
          nama: "",
          tanggal_mulai: today,
          tanggal_selesai: today,
        });
      }
    }
  }, [editData, open, reset, today]);

  // Submit Handler untuk Create & Update
  async function onSubmit(values: CustomPeriodSchema) {
    setIsSubmitting(true);
    try {
      if (isEdit && editData) {
        const res = await updateCustomPeriod(editData.id, values);
        if (res.success) {
          toast.success(dict.reports.toasts.customUpdated);
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error ?? dict.reports.toasts.customUpdateFailed);
        }
      } else {
        const res = await createCustomPeriod(values);
        if (res.success) {
          toast.success(dict.reports.toasts.customCreated);
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error ?? dict.reports.toasts.customCreateFailed);
        }
      }
    } catch (err) {
      console.error("Error submitting custom period:", err);
      toast.error(dict.reports.toasts.customSaveError);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete Handler dengan konfirmasi
  async function handleDelete() {
    if (!editData) return;
    setIsDeleting(true);
    try {
      const res = await deleteCustomPeriod(editData.id);
      if (res.success) {
        toast.success(dict.reports.toasts.customDeleted);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.error ?? dict.reports.toasts.customDeleteFailed);
      }
    } catch (err) {
      console.error("Error deleting custom period:", err);
      toast.error(dict.reports.toasts.customDeleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-card border-hairline p-6">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            {isEdit
              ? dict.reports.customDialog.editTitle
              : dict.reports.customDialog.createTitle}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {isEdit
              ? dict.reports.customDialog.editDesc
              : dict.reports.customDialog.createDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Input Nama Periode */}
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="nama" className="text-xs sm:text-sm font-medium">
              {dict.reports.customDialog.nameLabel}
            </Label>
            <ClearableInput
              id="nama"
              placeholder={dict.reports.customDialog.namePlaceholder}
              className="h-12 rounded-input border-hairline bg-background text-sm"
              {...register("nama")}
              onClear={() => setValue("nama", "")}
              disabled={isSubmitting || isDeleting}
            />
            {errors.nama && (
              <p className="text-xs text-rose-500">{errors.nama.message}</p>
            )}
          </div>

          {/* Grid Tanggal Mulai dan Tanggal Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 min-w-0">
              <Label
                htmlFor="tanggal_mulai"
                className="text-xs sm:text-sm font-medium"
              >
                {dict.reports.customDialog.startDateLabel}
              </Label>
              <Input
                id="tanggal_mulai"
                type="date"
                className="h-12 rounded-input border-hairline bg-background text-sm appearance-none"
                {...register("tanggal_mulai")}
                disabled={isSubmitting || isDeleting}
              />
              {errors.tanggal_mulai && (
                <p className="text-xs text-rose-500">
                  {errors.tanggal_mulai.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label
                htmlFor="tanggal_selesai"
                className="text-xs sm:text-sm font-medium"
              >
                {dict.reports.customDialog.endDateLabel}
              </Label>
              <Input
                id="tanggal_selesai"
                type="date"
                className="h-12 rounded-input border-hairline bg-background text-sm appearance-none"
                {...register("tanggal_selesai")}
                disabled={isSubmitting || isDeleting}
              />
              {errors.tanggal_selesai && (
                <p className="text-xs text-rose-500">
                  {errors.tanggal_selesai.message}
                </p>
              )}
            </div>
          </div>

          {/* Tombol Aksi Footer */}
          <DialogFooter className="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              {isEdit && (
                <ConfirmDialog
                  title={dict.reports.customDialog.deleteConfirmTitle}
                  description={dict.reports.customDialog.deleteConfirmDesc}
                  confirmText={dict.reports.customDialog.deleteButton}
                  cancelText={dict.reports.customDialog.cancelButton}
                  variant="destructive"
                  onConfirm={handleDelete}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus periode kustom"
                    disabled={isSubmitting || isDeleting}
                    className="h-11 min-h-11 rounded-full px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20 gap-2 w-full sm:w-auto"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    <span>{dict.reports.customDialog.deleteButton}</span>
                  </Button>
                </ConfirmDialog>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isDeleting}
                className="h-11 min-h-11 rounded-full border-hairline px-5 text-sm font-medium hover:bg-surface-strong transition-colors"
              >
                {dict.reports.customDialog.cancelButton}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isDeleting}
                className="h-11 min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors gap-2"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                <span>
                  {isSubmitting
                    ? dict.reports.customDialog.savingSubmit
                    : isEdit
                      ? dict.reports.customDialog.editSubmit
                      : dict.reports.customDialog.createSubmit}
                </span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
