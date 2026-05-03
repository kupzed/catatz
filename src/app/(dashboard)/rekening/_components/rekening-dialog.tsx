"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  rekeningSchema,
  type RekeningSchema,
} from "@/validations/rekening-validation";
import { createRekening, updateRekening } from "@/actions/rekening-action";
import { toast } from "sonner";
import type { Rekening } from "@/types/rekening";
import { DAFTAR_BANK, BANK_BY_JENIS } from "@/constants/banks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WARNA_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Rekening | null;
  onCreated: (r: Rekening) => void;
  onUpdated: (r: Rekening) => void;
};

export default function RekeningDialog({
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
  } = useForm<RekeningSchema>({
    resolver: zodResolver(rekeningSchema),
    defaultValues: {
      jenis: "Bank",
      saldo_awal: 0,
      warna: "#6366f1",
      exclude_total: false,
    } as RekeningSchema,
  });

  const warna = useWatch({ control, name: "warna" });
  const jenis = useWatch({ control, name: "jenis" });
  const logo = useWatch({ control, name: "logo" });
  const exclude_total = useWatch({ control, name: "exclude_total" });

  useEffect(() => {
    if (editData) {
      reset({
        nama: editData.nama,
        jenis: editData.jenis,
        saldo_awal: Number(editData.saldo_awal),
        warna: editData.warna,
        logo: editData.logo ?? "",
        exclude_total: editData.exclude_total,
      });
    } else {
      reset({
        jenis: "Bank",
        saldo_awal: 0,
        warna: "#6366f1",
        exclude_total: false,
      });
    }
  }, [editData, reset, open]);

  function handleBankSelect(slug: string) {
    setValue("logo", slug);
    const bank = DAFTAR_BANK.find((b) => b.slug === slug);
    if (bank) {
      setValue("warna", bank.warna);
      setValue("jenis", bank.jenis);
      if (!editData) setValue("nama", bank.nama);
    }
  }

  async function onSubmit(values: RekeningSchema) {
    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateRekening(editData!.id, values);
        if (res.success && res.data) {
          toast.success("Rekening diperbarui");
          onUpdated(res.data);
        } else {
          toast.error(res.error ?? "Gagal memperbarui");
        }
      } else {
        const res = await createRekening(values);
        if (res.success && res.data) {
          toast.success("Rekening ditambahkan");
          onCreated(res.data);
        } else {
          toast.error(res.error ?? "Gagal menambahkan");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Rekening" : "Tambah Rekening"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui informasi rekening Anda." : "Tambahkan rekening baru untuk mulai mencatat transaksi."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bank/E-Wallet Picker */}
          {!isEdit && (
            <div className="space-y-2">
              <Label className="text-sm">
                Pilih Bank / E-Wallet (opsional)
              </Label>
              <Tabs defaultValue="Bank">
                <TabsList className="w-full grid grid-cols-4 h-8 text-xs">
                  <TabsTrigger value="Bank" className="text-xs">
                    Bank
                  </TabsTrigger>
                  <TabsTrigger value="E-Wallet" className="text-xs">
                    E-Wallet
                  </TabsTrigger>
                  <TabsTrigger value="Tunai" className="text-xs">
                    Tunai
                  </TabsTrigger>
                  <TabsTrigger value="Investasi" className="text-xs">
                    Investasi
                  </TabsTrigger>
                </TabsList>
                {(["Bank", "E-Wallet", "Tunai", "Investasi"] as const).map(
                  (j) => (
                    <TabsContent key={j} value={j}>
                      <div className="grid grid-cols-3 gap-2 pt-2 max-h-48 overflow-y-auto">
                        {(BANK_BY_JENIS[j] ?? []).map((bank) => (
                          <button
                            key={bank.slug}
                            type="button"
                            onClick={() => handleBankSelect(bank.slug)}
                            className={cn(
                              "rounded-lg border p-2 text-center transition-all text-xs font-medium hover:border-indigo-400",
                              logo === bank.slug
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                                : "border-border",
                            )}
                          >
                            <div
                              className="w-6 h-6 rounded-full mx-auto mb-1"
                              style={{ background: bank.warna }}
                            />
                            {bank.emoji && (
                              <span className="text-base">{bank.emoji}</span>
                            )}
                            <p className="truncate">{bank.nama}</p>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ),
                )}
              </Tabs>
            </div>
          )}

          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="rek-nama">Nama Rekening</Label>
            <Input
              id="rek-nama"
              placeholder="Contoh: BCA Utama"
              {...register("nama")}
              className={errors.nama ? "border-rose-500" : ""}
            />
            {errors.nama && (
              <p className="text-xs text-rose-500">{errors.nama.message}</p>
            )}
          </div>

          {/* Jenis */}
          <div className="space-y-1.5">
            <Label>Jenis Rekening</Label>
            <Select
              value={jenis}
              onValueChange={(v) => setValue("jenis", v as RekeningSchema["jenis"])}
            >
              <SelectTrigger id="rek-jenis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tunai">💵 Tunai</SelectItem>
                <SelectItem value="Bank">🏦 Bank</SelectItem>
                <SelectItem value="E-Wallet">📱 E-Wallet</SelectItem>
                <SelectItem value="Investasi">📈 Investasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Saldo Awal */}
          <div className="space-y-1.5">
            <Label htmlFor="saldo-awal">
              {isEdit ? "Saldo Awal" : "Saldo Awal (Rp)"}
            </Label>
            <Input
              id="saldo-awal"
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              {...register("saldo_awal", { valueAsNumber: true })}
            />
          </div>

          {/* Warna */}
          <div className="space-y-1.5">
            <Label>Warna</Label>
            <div className="flex flex-wrap gap-2 items-center">
              {WARNA_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("warna", c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                    warna === c
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={warna}
                onChange={(e) => setValue("warna", e.target.value)}
                className="w-7 h-7 rounded-full border border-border cursor-pointer"
                title="Pilih warna kustom"
              />
            </div>
          </div>

          {/* Exclude Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Switch
              id="exclude-total"
              checked={exclude_total}
              onCheckedChange={(v) => setValue("exclude_total", v)}
            />
            <div>
              <Label htmlFor="exclude-total" className="cursor-pointer text-sm">
                Kecualikan dari total
              </Label>
              <p className="text-xs text-muted-foreground">
                Saldo rekening ini tidak dihitung dalam total
              </p>
            </div>
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
              {isEdit ? "Perbarui" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
