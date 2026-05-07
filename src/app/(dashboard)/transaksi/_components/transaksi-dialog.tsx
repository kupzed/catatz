"use client";

import { useState, useEffect, useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transaksiSchema,
  type TransaksiSchema,
} from "@/validations/transaksi-validation";
import {
  createTransaksi,
  updateTransaksi,
  getJudulSuggestions,
  getRecentJudul,
} from "@/actions/transaksi-action";
import { parseTransaksiFromText } from "@/lib/ai-parser";
import { toast } from "sonner";
import type { Transaksi, Kategori, JudulSuggestion } from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";
import { todayISODate, currentTime, formatRupiah } from "@/lib/utils";
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
import { NominalInput } from "@/components/common/nominal-input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Wand2, Copy, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rekening: Rekening[];
  kategori: Kategori[];
  editData?: Transaksi | null;
  onCreated: (t: Transaksi) => void;
  onUpdated: (t: Transaksi) => void;
  /** Data yang di-prefill dari Copy Transaksi (mode create dengan data awal) */
  copyFrom?: Transaksi | null;
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
  copyFrom,
}: Props) {
  const isEdit = !!editData;
  const isCorrection = editData?.tipe === "correction";
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<JudulSuggestion[]>([]);

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
      waktu: currentTime(),
      tags: [],
    },
  });

  const tipe = useWatch({ control, name: "tipe" });
  const judul = useWatch({ control, name: "judul" });

  // Reset form saat dialog dibuka/ditutup atau editData berubah
  useEffect(() => {
    if (editData) {
      reset({
        tipe: editData.tipe,
        judul: editData.judul ?? undefined,
        nominal: Number(editData.nominal),
        tanggal: editData.tanggal,
        waktu: editData.waktu?.substring(0, 5) ?? currentTime(),
        kategori_id: editData.kategori_id ?? undefined,
        rekening_id: editData.rekening_id ?? "",
        rekening_tujuan: editData.rekening_tujuan ?? undefined,
        catatan: editData.catatan ?? "",
        tags: editData.tags ?? [],
      });
    } else if (copyFrom) {
      // Mode copy: pre-fill dengan data transaksi asal, tanggal reset ke hari ini
      reset({
        tipe: copyFrom.tipe as TransaksiSchema["tipe"],
        judul: copyFrom.judul ?? undefined,
        nominal: Number(copyFrom.nominal),
        tanggal: todayISODate(),
        waktu: currentTime(),
        kategori_id: copyFrom.kategori_id ?? undefined,
        rekening_id: copyFrom.rekening_id ?? "",
        rekening_tujuan: copyFrom.rekening_tujuan ?? undefined,
        catatan: copyFrom.catatan ?? "",
        tags: copyFrom.tags ?? [],
      });
    } else {
      reset({
        tipe: "expense",
        tanggal: todayISODate(),
        waktu: currentTime(),
        tags: [],
      });
    }
  }, [editData, copyFrom, reset, open]);

  // Load recent judul saat dialog pertama dibuka (mode create)
  useEffect(() => {
    if (open && !isEdit) {
      getRecentJudul().then(setSuggestions).catch(() => {});
    }
  }, [open, isEdit]);

  // Debounced suggestion fetch saat judul berubah
  useEffect(() => {
    if (!judul || judul.length < 1) {
      if (!isEdit) {
        getRecentJudul().then(setSuggestions).catch(() => {});
      }
      return;
    }

    const timeout = setTimeout(async () => {
      const sugg = await getJudulSuggestions(judul);
      setSuggestions(sugg);
    }, 400);

    return () => clearTimeout(timeout);
  }, [judul, isEdit]);

  function handleSelectSuggestion(s: JudulSuggestion) {
    setValue("judul", s.judul);
    if (s.kategori_id) {
      const kat = kategori.find((k) => k.id === s.kategori_id);
      if (kat && kat.tipe !== "all" && kat.tipe !== tipe) {
        setValue("tipe", kat.tipe as TransaksiSchema["tipe"]);
      }
      // Tambahkan timeout kecil agar Select ter-render dengan items baru sebelum di-set
      setTimeout(() => {
        setValue("kategori_id", s.kategori_id ?? undefined);
      }, 0);
    }
  }

  const handleAiParse = useCallback(async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const parsed = await parseTransaksiFromText(aiText);
      setValue("tipe", parsed.tipe);
      setValue("nominal", parsed.nominal);
      setValue("catatan", parsed.catatan);
      const matchedKat = kategori.find((k) =>
        k.nama.toLowerCase().includes(parsed.kategori_hint.toLowerCase()),
      );
      if (matchedKat) setValue("kategori_id", matchedKat.id);
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
  }, [aiText, kategori, rekening, setValue]);

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
          toast.success(copyFrom ? "Transaksi berhasil di-copy!" : "Transaksi disimpan");
          onCreated(res.data);
        } else {
          toast.error(res.error ?? "Gagal menyimpan");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  /** Copy Transaksi (Opsi B): tutup dialog edit → buka dialog create dengan data pre-filled */
  async function handleCopyTransaksi() {
    if (!editData) return;
    setCopying(true);
    // Beri animasi sejenak, lalu minta parent untuk tutup dialog ini dan buka create dengan copyFrom
    setTimeout(() => {
      setCopying(false);
      // Kirim signal ke parent via callback khusus
      onUpdated({ ...editData, _isCopySignal: true } as Transaksi & { _isCopySignal: boolean });
    }, 200);
  }

  const expenseKategori = kategori.filter(
    (k) => k.tipe === "expense" || k.tipe === "all",
  );
  const incomeKategori = kategori.filter(
    (k) => k.tipe === "income" || k.tipe === "all",
  );
  const shownKategori = tipe === "income" ? incomeKategori : expenseKategori;

  // Cari nama rekening untuk mode correction (readonly)
  const correctionRekening = isCorrection
    ? rekening.find((r) => r.id === editData?.rekening_id)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCorrection
              ? "Edit Koreksi Saldo"
              : isEdit
                ? "Edit Transaksi"
                : copyFrom
                  ? "Copy Transaksi"
                  : "Tambah Transaksi"}
          </DialogTitle>
          <DialogDescription>
            {isCorrection
              ? "Perbarui catatan koreksi saldo rekening."
              : isEdit
                ? "Perbarui rincian transaksi Anda."
                : copyFrom
                  ? "Membuat transaksi baru dengan data yang sama."
                  : "Catat pengeluaran, pemasukan, atau transfer baru."}
          </DialogDescription>
        </DialogHeader>

        {/* AI Input — hanya tampil saat create (bukan edit & bukan correction) */}
        {!isEdit && !copyFrom && (
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
          {isCorrection ? (
            /* Mode correction: tampilkan label khusus, tidak bisa ganti tipe */
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <SlidersHorizontal className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Koreksi Saldo
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-500 ml-auto">
                Tipe tidak dapat diubah
              </span>
            </div>
          ) : (
            <Tabs
              value={tipe}
              onValueChange={(v) =>
                setValue("tipe", v as TransaksiSchema["tipe"])
              }
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
          )}

          {/* Tanggal & Waktu — native inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                {...register("tanggal")}
              />
              {errors.tanggal && (
                <p className="text-xs text-rose-500">{errors.tanggal.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waktu">Waktu</Label>
              <Input
                id="waktu"
                type="time"
                {...register("waktu")}
              />
            </div>
          </div>

          {/* Rekening */}
          <div className="space-y-1.5">
            <Label>Rekening {tipe === "transfer" ? "Asal" : ""}</Label>
            {isCorrection ? (
              /* Mode correction: rekening readonly */
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50 text-sm">
                {correctionRekening && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: correctionRekening.warna }}
                  />
                )}
                <span className="font-medium">
                  {correctionRekening?.nama ?? "—"}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({correctionRekening?.jenis})
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatRupiah(correctionRekening?.saldo_saat_ini ?? 0)}
                </span>
              </div>
            ) : (
              <Controller
                control={control}
                name="rekening_id"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
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
                )}
              />
            )}
            {errors.rekening_id && (
              <p className="text-xs text-rose-500">
                {errors.rekening_id.message}
              </p>
            )}
          </div>

          {/* Rekening Tujuan (Transfer only) */}
          {tipe === "transfer" && (
            <div className="space-y-1.5">
              <Label>Rekening Tujuan</Label>
              <Controller
                control={control}
                name="rekening_tujuan"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
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
                )}
              />
              {errors.rekening_tujuan && (
                <p className="text-xs text-rose-500">
                  {errors.rekening_tujuan.message}
                </p>
              )}
            </div>
          )}

          {/* Nominal */}
          <div className="space-y-1.5">
            <Label htmlFor="nominal">Nominal (Rp)</Label>
            <Controller
              control={control}
              name="nominal"
              render={({ field }) => (
                <NominalInput
                  id="nominal"
                  placeholder="0"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  className={cn(
                    "text-lg font-semibold",
                    errors.nominal && "border-rose-500",
                  )}
                />
              )}
            />
            {errors.nominal && (
              <p className="text-xs text-rose-500">{errors.nominal.message}</p>
            )}
          </div>

          {/* Judul — tampil untuk semua tipe KECUALI correction */}
          {!isCorrection && (
            <div className="space-y-1.5">
              <Label htmlFor="judul">Judul</Label>
              <Input
                id="judul"
                placeholder="Nama transaksi, misal: Gaji Bulanan, Kopi Starb..."
                autoComplete="off"
                {...register("judul")}
              />
              {errors.judul && (
                <p className="text-xs text-rose-500">{errors.judul.message}</p>
              )}
              {/* Suggestion pills */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                        "border border-border bg-muted/50 hover:bg-muted hover:border-indigo-400",
                        "transition-all duration-150 cursor-pointer",
                        judul === s.judul &&
                          "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
                      )}
                    >
                      {s.kategori_id && (
                        <span className="text-[10px]">
                          {kategori.find((k) => k.id === s.kategori_id)?.ikon}
                        </span>
                      )}
                      {s.judul}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kategori — tampil untuk income/expense, tersembunyi untuk transfer dan correction */}
          {tipe !== "transfer" && !isCorrection && (
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Controller
                control={control}
                name="kategori_id"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
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
                )}
              />
            </div>
          )}

          {/* Catatan — selalu tampil (termasuk di correction) */}
          <div className="space-y-1.5">
            <Label htmlFor="catatan">Catatan</Label>
            <Input
              id="catatan"
              placeholder={
                isCorrection
                  ? "Alasan koreksi saldo (opsional)..."
                  : "Keterangan tambahan..."
              }
              autoComplete="off"
              {...register("catatan")}
            />
          </div>

          <DialogFooter className="pt-2 flex-wrap gap-2">
            {/* Tombol Copy Transaksi — hanya saat edit NON-correction */}
            {isEdit && !isCorrection && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyTransaksi}
                disabled={copying}
                className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              >
                {copying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
