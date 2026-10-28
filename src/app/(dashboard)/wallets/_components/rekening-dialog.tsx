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
import { DAFTAR_BANK, BANK_BY_JENIS, getJenisDisplay } from "@/constants/banks";
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
import { cn } from "@/lib/utils";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

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
  onCreated?: (r: Rekening) => void;
  onUpdated?: (r: Rekening) => void;
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
  const { dict } = useTranslation();
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
        toast.success(dict.wallets.toasts.created);
        onCreated(res.data);
        onClose();
      } else toast.error(res.error ?? dict.wallets.toasts.createFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Bank/E-Wallet Picker */}
      <div className="space-y-2">
        <Label className="text-sm">{dict.wallets.form.selectBankOptional}</Label>
        <Tabs defaultValue="Bank">
          <TabsList className="w-full grid grid-cols-4 h-8 text-xs">
            {(["Bank", "E-Wallet", "Tunai", "Investasi"] as const).map((j) => (
              <TabsTrigger key={j} value={j} className="text-xs">
                {getJenisDisplay(j, dict)}
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
                      "flex flex-col items-center justify-center rounded-[8px] border p-2 text-center text-xs font-medium hover:border-primary transition-all min-h-16",
                      logo === bank.slug
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-border",
                    )}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center mb-1 text-xs shrink-0"
                      style={{ background: bank.warna }}
                    >
                      {bank.emoji ? (
                        <span className="text-xs leading-none">{bank.emoji}</span>
                      ) : null}
                    </div>
                    <p className="truncate w-full">{bank.nama}</p>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Nama */}
      <div className="space-y-1.5">
        <Label htmlFor="rek-nama">{dict.wallets.form.name}</Label>
        <ClearableInput
          id="rek-nama"
          placeholder={dict.wallets.form.namePlaceholder}
          {...register("nama")}
          onClear={() => setValue("nama", "")}
          className={errors.nama ? "border-rose-500" : ""}
        />
        {errors.nama && (
          <p className="text-xs text-rose-500">{errors.nama.message}</p>
        )}
      </div>

      {/* Jenis */}
      <div className="space-y-1.5">
        <Label>{dict.wallets.form.type}</Label>
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
            <SelectItem value="Tunai">💵 {dict.wallets.types.cash}</SelectItem>
            <SelectItem value="Bank">🏦 {dict.wallets.types.bank}</SelectItem>
            <SelectItem value="E-Wallet">📱 {dict.wallets.types.ewallet}</SelectItem>
            <SelectItem value="Investasi">📈 {dict.wallets.types.investment}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Saldo Awal */}
      <div className="space-y-1.5">
        <Label htmlFor="saldo-awal">{dict.wallets.form.initialBalance} (Rp)</Label>
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
        <Label>{dict.wallets.form.color}</Label>
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
            title={dict.wallets.form.customColor}
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
            {dict.wallets.form.excludeTotal}
          </Label>
          <p className="text-xs text-muted-foreground">
            {dict.wallets.form.excludeTotalDescription}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {dict.common.cancel}
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-primary hover:bg-primary-active text-white rounded-full h-11 px-5"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {dict.wallets.form.submitCreate}
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
  const { dict } = useTranslation();
  const { formatRupiah } = useSystemPreferences();
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
        toast.success(dict.wallets.toasts.updated);
        onUpdated(res.data);
        onClose();
      } else toast.error(res.error ?? dict.wallets.toasts.updateFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nama */}
      <div className="space-y-1.5">
        <Label htmlFor="rek-nama-e">{dict.wallets.form.name}</Label>
        <ClearableInput
          id="rek-nama-e"
          placeholder={dict.wallets.form.namePlaceholder}
          {...register("nama")}
          onClear={() => setValue("nama", "")}
          className={errors.nama ? "border-rose-500" : ""}
        />
        {errors.nama && (
          <p className="text-xs text-rose-500">{errors.nama.message}</p>
        )}
      </div>

      {/* Jenis */}
      <div className="space-y-1.5">
        <Label>{dict.wallets.form.type}</Label>
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
            <SelectItem value="Tunai">💵 {dict.wallets.types.cash}</SelectItem>
            <SelectItem value="Bank">🏦 {dict.wallets.types.bank}</SelectItem>
            <SelectItem value="E-Wallet">📱 {dict.wallets.types.ewallet}</SelectItem>
            <SelectItem value="Investasi">📈 {dict.wallets.types.investment}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Saldo Awal: readonly info */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          {dict.wallets.form.initialBalance} <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </Label>
        <div className="flex h-10 items-center px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground select-none">
          {formatRupiah(editData.saldo_awal ?? 0)}
        </div>
        <p className="text-xs text-muted-foreground">
          {dict.wallets.form.initialBalanceReadOnlyInfo}
        </p>
      </div>

      {/* Saldo Saat Ini: editable */}
      <div className="space-y-1.5">
        <Label htmlFor="saldo-saat-ini">{dict.wallets.form.currentBalance} (Rp)</Label>
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
            <Info className="h-3 w-3" /> {dict.wallets.form.balanceChangeAutoCorrectionNotice}
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
        <Label>{dict.wallets.form.color}</Label>
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
            title={dict.wallets.form.customColor}
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
            {dict.wallets.form.excludeTotal}
          </Label>
          <p className="text-xs text-muted-foreground">
            {dict.wallets.form.excludeTotalDescription}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {dict.common.cancel}
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-primary hover:bg-primary-active text-white rounded-full h-11 px-5"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {dict.wallets.form.submitUpdate}
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
  const { dict } = useTranslation();
  const isEdit = !!editData;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? dict.wallets.form.editTitle : dict.wallets.form.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? dict.wallets.form.editDescription
              : dict.wallets.form.createDescription}
          </DialogDescription>
        </DialogHeader>
        {isEdit && editData ? (
          <EditForm
            editData={editData}
            onUpdated={(r) => onUpdated?.(r)}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <CreateForm
            onCreated={(r) => onCreated?.(r)}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
