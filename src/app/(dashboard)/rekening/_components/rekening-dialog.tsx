"use client";

import { useState, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  rekeningCreateSchema,
  rekeningEditSchema,
  type RekeningCreateSchema,
  type RekeningEditSchema,
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
import { NominalInput } from "@/components/common/nominal-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Info } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

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

// ─────────────────────────────────────────────
// Sub-form CREATE
// ─────────────────────────────────────────────
function CreateForm({
  onCreated,
  onClose,
}: {
  onCreated: (r: Rekening) => void;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RekeningCreateSchema>({
    resolver: zodResolver(rekeningCreateSchema),
    defaultValues: {
      jenis: "Bank",
      saldo_awal: 0,
      warna: "#6366f1",
      exclude_total: false,
    },
  });

  const warna = useWatch({ control, name: "warna" });
  const jenis = useWatch({ control, name: "jenis" });
  const logo = useWatch({ control, name: "logo" });
  const exclude_total = useWatch({ control, name: "exclude_total" });

  function handleBankSelect(slug: string) {
    setValue("logo", slug);
    const bank = DAFTAR_BANK.find((b) => b.slug === slug);
    if (bank) {
      setValue("warna", bank.warna);
      setValue("jenis", bank.jenis);
      setValue("nama", bank.nama);
    }
  }

  async function onSubmit(values: RekeningCreateSchema) {
    setSubmitting(true);
    try {
      const res = await createRekening(values);
      if (res.success && res.data) {
        toast.success("Rekening ditambahkan");
        onCreated(res.data);
      } else toast.error(res.error ?? "Gagal menambahkan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Bank/E-Wallet Picker */}
      <div className="space-y-2">
        <Label className="text-sm">Pilih Bank / E-Wallet (opsional)</Label>
        <Tabs defaultValue="Bank">
          <TabsList className="w-full grid grid-cols-4 h-8 text-xs">
            {(["Bank", "E-Wallet", "Tunai", "Investasi"] as const).map((j) => (
              <TabsTrigger key={j} value={j} className="text-xs">
                {j}
              </TabsTrigger>
            ))}
          </TabsList>
          {(["Bank", "E-Wallet", "Tunai", "Investasi"] as const).map((j) => (
            <TabsContent key={j} value={j}>
              <div className="grid grid-cols-3 gap-2 pt-2 max-h-48 overflow-y-auto">
                {(BANK_BY_JENIS[j] ?? []).map((bank) => (
                  <button
                    key={bank.slug}
                    type="button"
                    onClick={() => handleBankSelect(bank.slug)}
                    className={cn(
                      "rounded-lg border p-2 text-center text-xs font-medium hover:border-indigo-400 transition-all",
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
          ))}
        </Tabs>
      </div>

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
          onValueChange={(v) =>
            setValue("jenis", v as RekeningCreateSchema["jenis"])
          }
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
        <Label htmlFor="saldo-awal">Saldo Awal (Rp)</Label>
        <Controller
          control={control}
          name="saldo_awal"
          render={({ field }) => (
            <NominalInput
              id="saldo-awal"
              placeholder="0"
              value={field.value || ""}
              onValueChange={field.onChange}
            />
          )}
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

      {/* Exclude */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Switch
          id="exclude-total-c"
          checked={exclude_total}
          onCheckedChange={(v) => setValue("exclude_total", v)}
        />
        <div>
          <Label htmlFor="exclude-total-c" className="cursor-pointer text-sm">
            Kecualikan dari total
          </Label>
          <p className="text-xs text-muted-foreground">
            Saldo rekening ini tidak dihitung dalam total
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Tambah
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─────────────────────────────────────────────
// Sub-form EDIT
// ─────────────────────────────────────────────
function EditForm({
  editData,
  onUpdated,
  onClose,
}: {
  editData: Rekening;
  onUpdated: (r: Rekening) => void;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RekeningEditSchema>({
    resolver: zodResolver(rekeningEditSchema),
    defaultValues: {
      nama: editData.nama,
      jenis: editData.jenis,
      saldo_saat_ini: Number(editData.saldo_saat_ini),
      warna: editData.warna,
      logo: editData.logo ?? "",
      exclude_total: editData.exclude_total,
    },
  });

  const warna = useWatch({ control, name: "warna" });
  const jenis = useWatch({ control, name: "jenis" });
  const exclude_total = useWatch({ control, name: "exclude_total" });
  const currentSaldo = useWatch({ control, name: "saldo_saat_ini" });

  // Sync saat editData berubah
  useEffect(() => {
    setValue("nama", editData.nama);
    setValue("jenis", editData.jenis);
    setValue("saldo_saat_ini", Number(editData.saldo_saat_ini));
    setValue("warna", editData.warna);
    setValue("logo", editData.logo ?? "");
    setValue("exclude_total", editData.exclude_total);
  }, [editData, setValue]);

  async function onSubmit(values: RekeningEditSchema) {
    setSubmitting(true);
    try {
      const res = await updateRekening(editData.id, values);
      if (res.success && res.data) {
        toast.success("Rekening diperbarui");
        onUpdated(res.data);
      } else toast.error(res.error ?? "Gagal memperbarui");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nama */}
      <div className="space-y-1.5">
        <Label htmlFor="rek-nama-e">Nama Rekening</Label>
        <Input
          id="rek-nama-e"
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
          onValueChange={(v) =>
            setValue("jenis", v as RekeningEditSchema["jenis"])
          }
        >
          <SelectTrigger id="rek-jenis-e">
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

      {/* Saldo Awal: readonly info */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          Saldo Awal <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </Label>
        <div className="flex h-10 items-center px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground select-none">
          {formatRupiah(editData.saldo_awal ?? 0)}
        </div>
        <p className="text-xs text-muted-foreground">
          Saldo awal tidak bisa diubah langsung.
        </p>
      </div>

      {/* Saldo Saat Ini: editable */}
      <div className="space-y-1.5">
        <Label htmlFor="saldo-saat-ini">Saldo Saat Ini (Rp)</Label>
        <Controller
          control={control}
          name="saldo_saat_ini"
          render={({ field }) => (
            <NominalInput
              id="saldo-saat-ini"
              placeholder="0"
              value={field.value || ""}
              onValueChange={field.onChange}
            />
          )}
        />
        {Number(currentSaldo) !== Number(editData.saldo_saat_ini) && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> Perubahan saldo akan membuat transaksi
            koreksi saldo otomatis.
          </p>
        )}
        {errors.saldo_saat_ini && (
          <p className="text-xs text-rose-500">
            {errors.saldo_saat_ini.message}
          </p>
        )}
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

      {/* Exclude */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Switch
          id="exclude-total-e"
          checked={exclude_total}
          onCheckedChange={(v) => setValue("exclude_total", v)}
        />
        <div>
          <Label htmlFor="exclude-total-e" className="cursor-pointer text-sm">
            Kecualikan dari total
          </Label>
          <p className="text-xs text-muted-foreground">
            Saldo rekening ini tidak dihitung dalam total
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Perbarui
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─────────────────────────────────────────────
// Main Dialog Wrapper
// ─────────────────────────────────────────────
export default function RekeningDialog({
  open,
  onOpenChange,
  editData,
  onCreated,
  onUpdated,
}: Props) {
  const isEdit = !!editData;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Rekening" : "Tambah Rekening"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi rekening Anda."
              : "Tambahkan rekening baru untuk mulai mencatat transaksi."}
          </DialogDescription>
        </DialogHeader>
        {isEdit && editData ? (
          <EditForm
            editData={editData}
            onUpdated={onUpdated}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <CreateForm
            onCreated={onCreated}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
