"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hutangSchema,
  type HutangSchema,
} from "@/validations/hutang-validation";
import { createHutang, updateHutang } from "@/actions/hutang-action";
import { toast } from "sonner";
import type { Hutang } from "@/types/hutang";
import { todayISODate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HutangSchema>({
    resolver: zodResolver(hutangSchema),
    defaultValues: { tipe: "menerima", tanggal_mulai: todayISODate() },
  });

  const tipe = useWatch({ control, name: "tipe" });

  useEffect(() => {
    if (editData) {
      reset({
        tipe: editData.tipe,
        nama_entitas: editData.nama_entitas,
        total_pinjaman: Number(editData.total_pinjaman),
        tanggal_mulai: editData.tanggal_mulai,
        tanggal_jatuh_tempo: editData.tanggal_jatuh_tempo ?? undefined,
        catatan: editData.catatan ?? "",
      });
    } else {
      reset({ tipe: "menerima", tanggal_mulai: todayISODate() });
    }
  }, [editData, reset, open]);

  async function onSubmit(values: HutangSchema) {
    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateHutang(editData!.id, values);
        if (res.success && res.data) {
          toast.success("Hutang diperbarui");
          onUpdated(res.data);
        } else {
          toast.error(res.error ?? "Gagal");
        }
      } else {
        const res = await createHutang(values);
        if (res.success && res.data) {
          toast.success("Hutang dicatat");
          onCreated(res.data);
        } else {
          toast.error(res.error ?? "Gagal");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Hutang" : "Catat Hutang/Piutang"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui detail hutang atau piutang Anda." : "Masukkan detail hutang atau piutang baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipe */}
          <Tabs value={tipe} onValueChange={(v) => setValue("tipe", v as HutangSchema["tipe"])}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="menerima">📥 Saya Berhutang</TabsTrigger>
              <TabsTrigger value="memberi">📤 Saya Meminjamkan</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Nama Entitas */}
          <div className="space-y-1.5">
            <Label htmlFor="nama-entitas">
              {tipe === "menerima" ? "Nama Pemberi Pinjaman" : "Nama Peminjam"}
            </Label>
            <Input
              id="nama-entitas"
              placeholder="Nama orang/lembaga"
              {...register("nama_entitas")}
              className={errors.nama_entitas ? "border-rose-500" : ""}
            />
            {errors.nama_entitas && (
              <p className="text-xs text-rose-500">
                {errors.nama_entitas.message}
              </p>
            )}
          </div>

          {/* Total */}
          <div className="space-y-1.5">
            <Label htmlFor="total-pinjaman">Total Pinjaman (Rp)</Label>
            <Input
              id="total-pinjaman"
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              {...register("total_pinjaman", { valueAsNumber: true })}
              className={errors.total_pinjaman ? "border-rose-500" : ""}
            />
            {errors.total_pinjaman && (
              <p className="text-xs text-rose-500">
                {errors.total_pinjaman.message}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tgl-mulai">Tanggal Mulai</Label>
              <Input
                id="tgl-mulai"
                type="date"
                {...register("tanggal_mulai")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tgl-jatuh">Jatuh Tempo</Label>
              <Input
                id="tgl-jatuh"
                type="date"
                {...register("tanggal_jatuh_tempo")}
              />
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="catatan-hutang">Catatan</Label>
            <Input
              id="catatan-hutang"
              placeholder="Keterangan opsional"
              {...register("catatan")}
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
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
