"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hutangContactSchema,
  type HutangContactSchema,
} from "@/validations/hutang-validation";
import { updateHutangContact } from "@/actions/hutang-action";
import { toast } from "sonner";
import type { Hutang } from "@/types/hutang";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClearableInput } from "@/components/common/clearable-input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hutang: Hutang;
  onSuccess: (refreshed: Hutang) => void;
};

export function HutangContactEditDialog({
  open,
  onOpenChange,
  hutang,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HutangContactSchema>({
    resolver: zodResolver(hutangContactSchema),
    defaultValues: {
      nama_entitas: hutang.nama_entitas,
      catatan: hutang.catatan ?? "",
    },
  });

  useEffect(() => {
    reset({
      nama_entitas: hutang.nama_entitas,
      catatan: hutang.catatan ?? "",
    });
  }, [hutang, reset, open]);

  async function onSubmit(values: HutangContactSchema) {
    setSubmitting(true);
    try {
      const res = await updateHutangContact(hutang.id, values);
      if (res.success && res.data) {
        toast.success("Informasi kontak diperbarui");
        onSuccess(res.data);
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Gagal memperbarui kontak");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Informasi Pihak</DialogTitle>
          <DialogDescription>
            Perbarui nama atau catatan kontak hutang/piutang ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-nama">Nama Pihak / Entitas</Label>
            <ClearableInput
              id="contact-nama"
              placeholder="Nama orang atau instansi"
              {...register("nama_entitas")}
              onClear={() => setValue("nama_entitas", "")}
              className={errors.nama_entitas ? "border-rose-500" : ""}
            />
            {errors.nama_entitas && (
              <p className="text-xs text-rose-500">{errors.nama_entitas.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-catatan">Catatan</Label>
            <ClearableInput
              id="contact-catatan"
              placeholder="Keterangan opsional"
              {...register("catatan")}
              onClear={() => setValue("catatan", "")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-active text-white rounded-full h-11 px-5"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Perbarui
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
