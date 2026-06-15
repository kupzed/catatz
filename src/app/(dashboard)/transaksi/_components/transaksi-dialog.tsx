"use client";

import { useState, useEffect } from "react";
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
import dynamic from "next/dynamic";
import type { ParsedTransactionResult } from "@/types/transaction-parser";
import { addToQueue, type QueuedAction } from "@/lib/offline-queue";
import { resolveAutoFillTransaction } from "@/lib/transaction-auto-fill";

const VoiceInputButton = dynamic(() => import("./voice-input-button"), {
  ssr: false,
  loading: () => null,
});
const TransactionFileAutoFillButton = dynamic(
  () => import("./transaction-file-auto-fill-button"),
  {
    ssr: false,
    loading: () => null,
  },
);
import { toast } from "sonner";
import type { Transaksi, Kategori, JudulSuggestion } from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";
import { todayISODate, currentTime } from "@/lib/utils";
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
import { RekeningSelect } from "@/components/common/rekening-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIPE_TABS } from "@/constants/transaksi";
import { Loader2, Sparkles, Copy, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemPreferences } from "@/providers/system-preference-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rekening: Rekening[];
  kategori: Kategori[];
  editData?: Transaksi | null;
  onCreated: (t: Transaksi) => void;
  onUpdated: (t: Transaksi) => void;
  onQueued?: (action: QueuedAction) => void;
  /** Data yang di-prefill dari Copy Transaksi (mode create dengan data awal) */
  copyFrom?: Transaksi | null;
  /** Tanggal default untuk mode create normal, mengikuti periode yang dipilih. */
  defaultTanggal?: string;
};

export default function TransaksiDialog({
  open,
  onOpenChange,
  rekening,
  kategori,
  editData,
  onCreated,
  onUpdated,
  onQueued,
  copyFrom,
  defaultTanggal,
}: Props) {
  const isEdit = !!editData;
  const isCorrection = editData?.tipe === "correction";
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<JudulSuggestion[]>([]);
  const { formatRupiah } = useSystemPreferences();

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
        tanggal: defaultTanggal ?? todayISODate(),
        waktu: currentTime(),
        tags: [],
      });
    }
  }, [editData, copyFrom, defaultTanggal, reset, open]);

  // Load recent judul saat dialog pertama dibuka (mode create)
  useEffect(() => {
    if (open && !isEdit) {
      getRecentJudul()
        .then(setSuggestions)
        .catch(() => {});
    }
  }, [open, isEdit]);

  // Debounced suggestion fetch saat judul berubah
  useEffect(() => {
    if (!judul || judul.length < 1) {
      if (!isEdit) {
        getRecentJudul()
          .then(setSuggestions)
          .catch(() => {});
      }
      return;
    }

    const timeout = setTimeout(async () => {
      const sugg = await getJudulSuggestions(judul);
      setSuggestions(sugg);
    }, 400);

    return () => clearTimeout(timeout);
  }, [judul, isEdit]);

  // Bersihkan field yang tidak relevan agar payload tetap sesuai tipe transaksi.
  useEffect(() => {
    if (tipe === "transfer" || tipe === "correction") {
      setValue("judul", null);
      setValue("kategori_id", undefined);
    }

    if (tipe !== "transfer") {
      setValue("rekening_tujuan", undefined);
    }
  }, [tipe, setValue]);

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

  function handleParsedResult(
    result: ParsedTransactionResult,
    source: "suara" | "file",
  ) {
    const transactions = result.transactions;
    if (transactions.length === 0) {
      toast.info(result.parse_summary || "Tidak ada transaksi terdeteksi");
      return;
    }

    const first = transactions[0];
    const resolved = resolveAutoFillTransaction(first, kategori, rekening);
    const nextTipe =
      resolved.tipe ??
      (tipe === "income" || tipe === "expense" || tipe === "transfer"
        ? tipe
        : "expense");
    const dirtyOptions = { shouldDirty: true };

    if (resolved.tipe) {
      setValue("tipe", resolved.tipe, dirtyOptions);
    } else if (
      first.tipe === "hutang_baru" ||
      first.tipe === "piutang_baru" ||
      first.tipe === "bayar_hutang"
    ) {
      toast.info(`Terdeteksi: ${first.tipe}. Silakan sesuaikan manual.`);
    }

    if (
      first.nominal > 0 &&
      !first.flags.includes("nominal_ambigu") &&
      !first.flags.includes("total_ambigu")
    ) {
      setValue("nominal", first.nominal, dirtyOptions);
    }
    if (first.tanggal && !first.flags.includes("tanggal_ambigu")) {
      setValue("tanggal", first.tanggal, dirtyOptions);
    }
    if (first.waktu) setValue("waktu", first.waktu, dirtyOptions);

    if (nextTipe === "transfer") {
      setValue("judul", null, dirtyOptions);
      setValue("kategori_id", undefined, dirtyOptions);
    } else if (resolved.judul) {
      setValue("judul", resolved.judul, dirtyOptions);
    }

    if (resolved.catatan) {
      setValue("catatan", resolved.catatan, dirtyOptions);
    }
    if (resolved.rekeningId) {
      setValue("rekening_id", resolved.rekeningId, dirtyOptions);
    }

    window.setTimeout(() => {
      if (nextTipe !== "transfer" && resolved.kategoriId) {
        setValue("kategori_id", resolved.kategoriId, dirtyOptions);
      }
      if (nextTipe === "transfer" && resolved.rekeningTujuanId) {
        setValue("rekening_tujuan", resolved.rekeningTujuanId, dirtyOptions);
      }
    }, 0);

    // Handle multiple transactions: toast info
    if (transactions.length > 1) {
      toast.info(
        `${transactions.length} transaksi terdeteksi. Sisa ${
          transactions.length - 1
        } bisa diinput manual.`,
        { duration: 5000 },
      );
    }

    const clarificationLabels: Record<string, string> = {
      nominal: "nominal",
      tanggal: "tanggal",
      waktu: "waktu",
      tipe: "jenis transaksi",
      rekening: "rekening",
      rekening_hint: "rekening",
      rekening_tujuan: "rekening tujuan",
      kategori: "kategori",
    };
    const clarificationWarnings = first.clarification_fields.map(
      (field) => clarificationLabels[field] ?? field.replaceAll("_", " "),
    );
    const warnings = Array.from(
      new Set([...resolved.warnings, ...clarificationWarnings]),
    );

    if (warnings.length > 0) {
      toast.warning(`Mohon periksa: ${warnings.join(", ")}`, {
        duration: 6000,
      });
    }

    toast.success(
      `Terisi dari ${source}: ${
        first.judul ||
        first.entitas ||
        result.parse_summary ||
        "periksa kembali form transaksi"
      }`,
    );
  }

  async function onSubmit(values: TransaksiSchema) {
    setSubmitting(true);
    try {
      if (!navigator.onLine) {
        const queuedAction = await addToQueue({
          type: isEdit ? "UPDATE_TRANSAKSI" : "CREATE_TRANSAKSI",
          payload: isEdit ? { id: editData!.id, values } : values,
        });

        if (queuedAction) {
          toast.success(
            "Transaksi tersimpan sementara. Akan disinkronkan saat online.",
          );
          onQueued?.(queuedAction);
          onOpenChange(false);
        } else {
          toast.error("Perangkat tidak mendukung penyimpanan offline.");
        }

        return;
      }

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
          toast.success(
            copyFrom ? "Transaksi berhasil di-copy!" : "Transaksi disimpan",
          );
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
      onUpdated({ ...editData, _isCopySignal: true } as Transaksi & {
        _isCopySignal: boolean;
      });
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
      <DialogContent className="max-w-sm sm:max-w-lg">
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

        {/* AI input hanya tampil saat create (bukan edit & bukan correction). */}
        {!isEdit && !copyFrom && (
          <div className="space-y-3 rounded-card border border-primary/20 bg-primary/5 p-4">
            <Label className="text-xs text-primary flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Input Otomatis (AI)
            </Label>
            <div className="grid grid-cols-2 items-start gap-2">
              <VoiceInputButton
                onParsed={(result) => handleParsedResult(result, "suara")}
                onError={(msg) => toast.error(msg)}
                onBusyChange={setVoiceBusy}
                disabled={fileBusy}
              />
              <TransactionFileAutoFillButton
                onParsed={(result) => handleParsedResult(result, "file")}
                onError={(msg) => toast.error(msg)}
                onBusyChange={setFileBusy}
                disabled={voiceBusy}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Unggah screenshot atau PDF maksimal 4 MB. File diproses sementara
              oleh AI dan tidak disimpan.
            </p>
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

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-[3fr_1fr] gap-4">
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                {...register("tanggal")}
                className="w-full appearance-none bg-background border-input"
              />
              {errors.tanggal && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.tanggal.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waktu">Waktu</Label>
              <Controller
                control={control}
                name="waktu"
                render={({ field }) => (
                  <Input
                    id="waktu"
                    type="time"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="w-full appearance-none bg-background border-input px-2 sm:px-4"
                  />
                )}
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
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {formatRupiah(correctionRekening?.saldo_saat_ini ?? 0)}
                </span>
              </div>
            ) : (
              <Controller
                control={control}
                name="rekening_id"
                render={({ field }) => (
                  <RekeningSelect
                    rekening={rekening}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Pilih rekening"
                    id="rekening-select"
                    className={errors.rekening_id ? "border-rose-500" : ""}
                  />
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
                  <RekeningSelect
                    rekening={rekening}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Pilih rekening tujuan"
                    id="rekening-tujuan-select"
                    className={errors.rekening_tujuan ? "border-rose-500" : ""}
                  />
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
                    "font-mono text-lg font-semibold",
                    errors.nominal && "border-rose-500",
                  )}
                />
              )}
            />
            {errors.nominal && (
              <p className="text-xs text-rose-500">{errors.nominal.message}</p>
            )}
          </div>

          {/* Judul — tampil untuk semua tipe KECUALI correction dan transfer */}
          {!isCorrection && tipe !== "transfer" && (
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
                        "border border-border bg-muted/50 hover:bg-muted hover:border-primary",
                        "transition-all duration-150 cursor-pointer",
                        judul === s.judul &&
                          "border-primary bg-primary/5 dark:bg-primary/10 text-primary",
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
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="kategori-select"
                      className={errors.kategori_id ? "border-rose-500" : ""}
                    >
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
              {errors.kategori_id && (
                <p className="text-xs text-rose-500">
                  {errors.kategori_id.message}
                </p>
              )}
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

          <DialogFooter
            className={cn(
              "grid gap-2 sm:flex sm:items-center",
              isEdit && !isCorrection ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            {/* Tombol Copy Transaksi — hanya saat edit NON-correction */}
            {isEdit && !isCorrection && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyTransaksi}
                disabled={copying}
                className="w-full gap-1.5 rounded-full border-primary/20 text-primary hover:bg-primary/5 sm:mr-auto sm:w-auto"
              >
                {copying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || voiceBusy || fileBusy}
              className="h-11 w-full rounded-full bg-primary px-3 text-white hover:bg-primary-active sm:w-auto sm:px-5"
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
