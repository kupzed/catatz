"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hutangContactSchema,
  type HutangContactSchema,
} from "@/validations/hutang-validation";
import { createHutangContact, updateHutangContact } from "@/actions/hutang-action";
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
  editData?: Hutang | null;
  onCreated: (h: Hutang) => void;
  onUpdated: (h: Hutang) => void;
};

export default function HutangDialog({
  open,
  onOpenChange,
  editData,
  onCreated,
  onUpdated,
}: Props) {
  const isEdit = !!editData;
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
      nama_entitas: "",
      catatan: "",
    },
  });

  useEffect(() => {
    if (editData) {
      reset({
        nama_entitas: editData.nama_entitas,
        catatan: editData.catatan ?? "",
      });
    } else {
      reset({
        nama_entitas: "",
        catatan: "",
      });
    }
  }, [editData, reset, open]);

  async function onSubmit(values: HutangContactSchema) {
    setSubmitting(true);
    try {
      if (isEdit && editData) {
        const res = await updateHutangContact(editData.id, values);
        if (res.success && res.data) {
          toast.success("Informasi pihak diperbarui");
          onUpdated(res.data);
          onOpenChange(false);
        } else {
          toast.error(res.error ?? "Gagal memperbarui informasi pihak");
        }
      } else {
        const res = await createHutangContact(values);
        if (res.success && res.data) {
          toast.success("Pihak baru berhasil ditambahkan");
          onCreated(res.data);
          onOpenChange(false);
        } else {
          toast.error(res.error ?? "Gagal menambahkan pihak");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Informasi Pihak" : "Tambah Pihak Hutang & Piutang"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui nama atau catatan pihak ini."
              : "Masukkan nama pihak dan catatan. Rincian transaksi dapat Anda kelola di halaman detail."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nama-entitas">Nama Pihak / Kontak</Label>
            <ClearableInput
              id="nama-entitas"
              placeholder="Contoh: Budi, Toko Makmur, Bank BCA"
              {...register("nama_entitas")}
              onClear={() => setValue("nama_entitas", "")}
              className={errors.nama_entitas ? "border-rose-500" : ""}
            />
            {errors.nama_entitas && (
              <p className="text-xs text-rose-500">{errors.nama_entitas.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="catatan-entitas">Catatan</Label>
            <ClearableInput
              id="catatan-entitas"
              placeholder="Keterangan opsional (misal: Teman kantor, Usaha)"
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
              {isEdit ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
