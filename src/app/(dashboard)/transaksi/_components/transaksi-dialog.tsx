"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transaksiSchema,
  type TransaksiSchema,
} from "@/validations/transaksi-validation";
import {
  createTransaksi,
  updateTransaksi,
  suggestKategori,
} from "@/actions/transaksi-action";
import { parseTransaksiFromText } from "@/lib/ai-parser";
import { toast } from "sonner";
import type { Transaksi, Kategori } from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rekening: Rekening[];
  kategori: Kategori[];
  editData?: Transaksi | null;
  onCreated: (t: Transaksi) => void;
  onUpdated: (t: Transaksi) => void;
};

const TIPE_TABS = [
  {
    value: "expense",
    label: "🔴 Keluar",
    color:
      "data-[state=active]:text-rose-500 data-[state=active]:border-rose-500",
  },
  {
    value: "income",
    label: "🟢 Masuk",
    color:
      "data-[state=active]:text-emerald-500 data-[state=active]:border-emerald-500",
  },
  {
    value: "transfer",
    label: "🔵 Transfer",
    color:
      "data-[state=active]:text-blue-500 data-[state=active]:border-blue-500",
  },
];

export default function TransaksiDialog({
  open,
  onOpenChange,
  rekening,
  kategori,
  editData,
  onCreated,
  onUpdated,
}: Props) {
  const isEdit = !!editData;
  const [submitting, setSubmitting] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransaksiSchema>({
    resolver: zodResolver(transaksiSchema),
    defaultValues: {
      tipe: "expense",
      tanggal: todayISODate(),
      tags: [],
    },
  });

  const tipe = useWatch({ control, name: "tipe" });
  const catatan = useWatch({ control, name: "catatan" });

  useEffect(() => {
    if (editData) {
      reset({
        tipe: editData.tipe,
        nominal: Number(editData.nominal),
        tanggal: editData.tanggal,
        kategori_id: editData.kategori_id ?? undefined,
        rekening_id: editData.rekening_id ?? "",
        rekening_tujuan: editData.rekening_tujuan ?? undefined,
        catatan: editData.catatan ?? "",
        tags: editData.tags ?? [],
      });
    } else {
      reset({ tipe: "expense", tanggal: todayISODate(), tags: [] });
    }
  }, [editData, reset, open]);

  // Auto-suggest category when catatan changes
  useEffect(() => {
    if (!catatan || catatan.length < 3 || isEdit) return;
    const timeout = setTimeout(async () => {
      const suggested = await suggestKategori(catatan);
      if (suggested) setValue("kategori_id", suggested);
    }, 800);
    return () => clearTimeout(timeout);
  }, [catatan, isEdit, setValue]);

  async function handleAiParse() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const parsed = await parseTransaksiFromText(aiText);
      setValue("tipe", parsed.tipe);
      setValue("nominal", parsed.nominal);
      setValue("catatan", parsed.catatan);
      // Try to match kategori_hint to existing category names
      const matchedKat = kategori.find((k) =>
        k.nama.toLowerCase().includes(parsed.kategori_hint.toLowerCase()),
      );
      if (matchedKat) setValue("kategori_id", matchedKat.id);
      // Try to match rekening_hint
      const matchedRek = rekening.find(
        (r) =>
          r.nama.toLowerCase().includes(parsed.rekening_hint.toLowerCase()) ||
          r.logo?.toLowerCase().includes(parsed.rekening_hint.toLowerCase()),
      );
      if (matchedRek) setValue("rekening_id", matchedRek.id);
      toast.success("AI berhasil mem-parse transaksi!");
    } catch {
      toast.error("Gagal mem-parse dengan AI");
    } finally {
      setAiLoading(false);
    }
  }

  async function onSubmit(values: TransaksiSchema) {
    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateTransaksi(editData!.id, values);
        if (res.success && res.data) {
          toast.success("Transaksi diperbarui");
          onUpdated(res.data);
        } else {
          toast.error(res.error ?? "Gagal memperbarui");
        }
      } else {
        const res = await createTransaksi(values);
        if (res.success && res.data) {
          toast.success("Transaksi disimpan");
          onCreated(res.data);
        } else {
          toast.error(res.error ?? "Gagal menyimpan");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const expenseKategori = kategori.filter(
    (k) => k.tipe === "expense" || k.tipe === "all",
  );
  const incomeKategori = kategori.filter(
    (k) => k.tipe === "income" || k.tipe === "all",
  );
  const shownKategori = tipe === "income" ? incomeKategori : expenseKategori;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui rincian transaksi Anda." : "Catat pengeluaran, pemasukan, atau transfer baru."}
          </DialogDescription>
        </DialogHeader>

        {/* AI Input */}
        {!isEdit && (
          <div className="space-y-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <Label className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Input Natural (AI)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder='Contoh: "Beli nasi padang 25rb pakai GoPay"'
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiParse()}
                className="text-sm h-8"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAiParse}
                disabled={aiLoading || !aiText.trim()}
                className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipe Tabs */}
          <Tabs
            value={tipe}
            onValueChange={(v) => setValue("tipe", v as TransaksiSchema["tipe"])}
          >
            <TabsList className="w-full grid grid-cols-3">
              {TIPE_TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className={cn("text-xs", t.color)}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Nominal */}
          <div className="space-y-1.5">
            <Label htmlFor="nominal">Nominal (Rp)</Label>
            <Input
              id="nominal"
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              {...register("nominal", { valueAsNumber: true })}
              className={cn(
                "text-lg font-semibold",
                errors.nominal && "border-rose-500",
              )}
            />
            {errors.nominal && (
              <p className="text-xs text-rose-500">{errors.nominal.message}</p>
            )}
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input id="tanggal" type="date" {...register("tanggal")} />
          </div>

          {/* Rekening */}
          <div className="space-y-1.5">
            <Label>Rekening {tipe === "transfer" ? "Asal" : ""}</Label>
            <Select
              onValueChange={(v) => setValue("rekening_id", v)}
              defaultValue={editData?.rekening_id ?? undefined}
            >
              <SelectTrigger
                id="rekening-select"
                className={errors.rekening_id ? "border-rose-500" : ""}
              >
                <SelectValue placeholder="Pilih rekening" />
              </SelectTrigger>
              <SelectContent>
                {rekening.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: r.warna }}
                      />
                      {r.nama}{" "}
                      <span className="text-muted-foreground text-xs ml-1">
                        ({r.jenis})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.rekening_id && (
              <p className="text-xs text-rose-500">
                {errors.rekening_id.message}
              </p>
            )}
          </div>

          {/* Rekening Tujuan (Transfer) */}
          {tipe === "transfer" && (
            <div className="space-y-1.5">
              <Label>Rekening Tujuan</Label>
              <Select
                onValueChange={(v) => setValue("rekening_tujuan", v)}
                defaultValue={editData?.rekening_tujuan ?? undefined}
              >
                <SelectTrigger
                  id="rekening-tujuan-select"
                  className={errors.rekening_tujuan ? "border-rose-500" : ""}
                >
                  <SelectValue placeholder="Pilih rekening tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {rekening.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: r.warna }}
                        />
                        {r.nama}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rekening_tujuan && (
                <p className="text-xs text-rose-500">
                  {errors.rekening_tujuan.message}
                </p>
              )}
            </div>
          )}

          {/* Kategori */}
          {tipe !== "transfer" && (
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                onValueChange={(v) => setValue("kategori_id", v)}
                defaultValue={editData?.kategori_id ?? undefined}
              >
                <SelectTrigger id="kategori-select">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {shownKategori.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.ikon} {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="catatan">Catatan</Label>
            <Input
              id="catatan"
              placeholder="Deskripsi singkat transaksi..."
              {...register("catatan")}
            />
          </div>

          <DialogFooter className="pt-2">
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
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isEdit ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
