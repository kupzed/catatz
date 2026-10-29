"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  kategoriSchema,
  type KategoriSchema,
} from "@/validations/kategori-validation";
import { createKategori, updateKategori } from "@/actions/kategori-action";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { Kategori } from "@/types/transaksi";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const EMOJI_PRESETS = [
  "💰",
  "🍔",
  "🚗",
  "🛍️",
  "📄",
  "🏥",
  "🎮",
  "📚",
  "🏠",
  "👕",
  "🏋️",
  "👥",
  "✈️",
  "🎵",
  "💊",
  "🐾",
  "🎁",
  "💼",
  "📱",
  "☕",
  "🍺",
  "🎂",
  "🛒",
  "⚡",
  "🔧",
  "📷",
  "🎯",
  "💡",
  "🌿",
  "🏖️",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Kategori | null;
  onCreated?: (k: Kategori) => void;
  onUpdated?: (k: Kategori) => void;
};

export default function KategoriDialog({
  open,
  onOpenChange,
  editData,
  onCreated,
  onUpdated,
}: Props) {
  const { dict } = useTranslation();
  const isEdit = !!editData;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<KategoriSchema>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: {
      nama: "",
      ikon: "💰",
      warna: "#6366f1",
      tipe: "expense",
    },
  });

  const ikon = useWatch({ control, name: "ikon" });
  const warna = useWatch({ control, name: "warna" });
  const tipe = useWatch({ control, name: "tipe" });

  useEffect(() => {
    if (open) {
      if (editData) {
        setValue("nama", editData.nama);
        setValue("ikon", editData.ikon);
        setValue("warna", editData.warna);
        setValue("tipe", editData.tipe);
      } else {
        reset({
          nama: "",
          ikon: "💰",
          warna: "#6366f1",
          tipe: "expense",
        });
      }
    }
  }, [open, editData, setValue, reset]);

  async function onSubmit(values: KategoriSchema) {
    setSubmitting(true);
    try {
      if (isEdit && editData) {
        const res = await updateKategori(editData.id, values);
        if (res.success && res.data) {
          toast.success(dict.categories.toasts.updated);
          onUpdated?.(res.data);
          onOpenChange(false);
        } else {
          toast.error(res.error ?? dict.categories.toasts.updateFailed);
        }
      } else {
        const res = await createKategori(values);
        if (res.success && res.data) {
          toast.success(dict.categories.toasts.created);
          onCreated?.(res.data);
          onOpenChange(false);
        } else {
          toast.error(res.error ?? dict.categories.toasts.createFailed);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? dict.categories.form.editTitle
              : dict.categories.form.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? dict.categories.form.editDescription
              : dict.categories.form.createDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Preview Kategori */}
          <div className="flex justify-center mb-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-sm border"
                style={{
                  backgroundColor: `${warna}20`,
                  borderColor: `${warna}40`,
                }}
              >
                {ikon || "📁"}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {dict.categories.form.preview}
              </span>
            </div>
          </div>

          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="kat-nama">{dict.categories.form.name}</Label>
            <ClearableInput
              id="kat-nama"
              placeholder={dict.categories.form.namePlaceholder}
              {...register("nama")}
              onClear={() => setValue("nama", "")}
              className={errors.nama ? "border-rose-500" : ""}
            />
            {errors.nama && (
              <p className="text-xs text-rose-500">{errors.nama.message}</p>
            )}
          </div>

          {/* Tipe */}
          <div className="space-y-1.5">
            <Label>{dict.categories.form.type}</Label>
            <Tabs
              value={tipe}
              onValueChange={(v) =>
                setValue("tipe", v as KategoriSchema["tipe"])
              }
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="expense">
                  {dict.categories.types.expense}
                </TabsTrigger>
                <TabsTrigger value="income">
                  {dict.categories.types.income}
                </TabsTrigger>
                <TabsTrigger value="all">
                  {dict.categories.types.all}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {errors.tipe && (
              <p className="text-xs text-rose-500">{errors.tipe.message}</p>
            )}
          </div>

          {/* Ikon */}
          <div className="space-y-2">
            <Label htmlFor="kat-ikon">{dict.categories.form.icon}</Label>
            <div className="flex gap-3 items-center">
              <Input
                id="kat-ikon"
                {...register("ikon")}
                value={ikon ?? ""}
                onChange={(e) =>
                  setValue("ikon", e.target.value, { shouldValidate: true })
                }
                className={cn(
                  "w-14 h-12 text-center text-2xl p-0 shrink-0 rounded-input",
                  errors.ikon ? "border-rose-500" : "",
                )}
                placeholder="💰"
                maxLength={5}
                aria-label={dict.categories.form.iconAria}
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {dict.categories.form.iconHint}
              </span>
            </div>
            {errors.ikon && (
              <p className="text-xs text-rose-500">{errors.ikon.message}</p>
            )}

            <div className="grid grid-cols-8 gap-1 p-2 bg-muted/30 rounded-lg border border-hairline">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setValue("ikon", e, { shouldValidate: true })}
                  className={cn(
                    "text-xl p-1.5 rounded hover:bg-accent transition-colors flex items-center justify-center",
                    ikon === e && "bg-accent border border-border",
                  )}
                  aria-label={dict.categories.form.selectEmojiAria.replace(
                    "{emoji}",
                    e,
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Warna */}
          <div className="space-y-1.5">
            <Label>{dict.categories.form.color}</Label>
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
                title={dict.categories.form.customColorTitle}
              />
            </div>
            {errors.warna && (
              <p className="text-xs text-rose-500">{errors.warna.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              {dict.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-active text-white rounded-full h-11 px-5"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit
                ? dict.categories.form.submitUpdate
                : dict.categories.form.submitCreate}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
