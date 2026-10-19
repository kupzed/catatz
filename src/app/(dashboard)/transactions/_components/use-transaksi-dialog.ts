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
  getJudulSuggestions,
  getRecentJudul,
} from "@/actions/transaksi-action";
import type { ParsedTransactionResult } from "@/types/transaction-parser";
import { addToQueue, type QueuedAction } from "@/lib/offline-queue";
import { resolveAutoFillTransaction } from "@/lib/transaction-auto-fill";
import { toast } from "sonner";
import type { Transaksi, Kategori, JudulSuggestion } from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";
import { todayISODate, currentTime } from "@/lib/utils";

export type UseTransaksiDialogParams = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rekening: Rekening[];
  kategori: Kategori[];
  editData?: Transaksi | null;
  onCreated: (t: Transaksi) => void;
  onUpdated: (t: Transaksi) => void;
  onQueued?: (action: QueuedAction) => void;
  copyFrom?: Transaksi | null;
  defaultTanggal?: string;
  defaultRekeningId?: string;
  defaultKategoriId?: string;
};

export function useTransaksiDialog({
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
  defaultRekeningId,
  defaultKategoriId,
}: UseTransaksiDialogParams) {
  const isEdit = !!editData;
  const isCorrection = editData?.tipe === "correction";
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<JudulSuggestion[]>([]);

  const form = useForm<TransaksiSchema>({
    resolver: zodResolver(transaksiSchema),
    defaultValues: {
      tipe: "expense",
      tanggal: todayISODate(),
      waktu: currentTime(),
      tags: [],
    },
  });

  const { control, setValue, reset } = form;
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
      const targetKat = defaultKategoriId ? kategori.find((k) => k.id === defaultKategoriId) : null;
      const initialTipe = targetKat?.tipe === "income" ? "income" : "expense";

      reset({
        tipe: initialTipe,
        tanggal: defaultTanggal ?? todayISODate(),
        waktu: currentTime(),
        rekening_id: defaultRekeningId ?? "",
        kategori_id: defaultKategoriId ?? undefined,
        tags: [],
      });
    }
  }, [editData, copyFrom, defaultTanggal, defaultRekeningId, defaultKategoriId, kategori, reset, open]);

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
    setValue("judul", s.judul, { shouldDirty: true, shouldValidate: true });
    if (s.kategori_id) {
      const kat = kategori.find((k) => k.id === s.kategori_id);
      if (kat && kat.tipe !== "all" && kat.tipe !== tipe) {
        setValue("tipe", kat.tipe as TransaksiSchema["tipe"], {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      // Tambahkan timeout kecil agar Select ter-render dengan items baru sebelum di-set
      setTimeout(() => {
        setValue("kategori_id", s.kategori_id ?? undefined, {
          shouldDirty: true,
          shouldValidate: true,
        });
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
      const isTransferOrCorrection =
        values.tipe === "transfer" || values.tipe === "correction";
      const sanitizedValues: TransaksiSchema = {
        ...values,
        judul: isTransferOrCorrection ? null : (values.judul ?? null),
        kategori_id: isTransferOrCorrection ? undefined : values.kategori_id,
        rekening_tujuan: values.tipe === "transfer" ? values.rekening_tujuan : undefined,
      };

      if (!navigator.onLine) {
        const queuedAction = await addToQueue({
          type: isEdit ? "UPDATE_TRANSAKSI" : "CREATE_TRANSAKSI",
          payload: isEdit ? { id: editData!.id, values: sanitizedValues } : sanitizedValues,
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
        const res = await updateTransaksi(editData!.id, sanitizedValues);
        if (res.success && res.data) {
          toast.success("Transaksi diperbarui");
          onUpdated(res.data);
        } else {
          toast.error(res.error ?? "Gagal memperbarui");
        }
      } else {
        const res = await createTransaksi(sanitizedValues);
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

  /** Copy Transaksi: tutup dialog edit → buka dialog create dengan data pre-filled */
  async function handleCopyTransaksi() {
    if (!editData) return;
    setCopying(true);
    setTimeout(() => {
      setCopying(false);
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

  const correctionRekening = isCorrection
    ? rekening.find((r) => r.id === editData?.rekening_id) ?? null
    : null;

  return {
    form,
    tipe,
    judul,
    isEdit,
    isCorrection,
    submitting,
    copying,
    voiceBusy,
    fileBusy,
    setVoiceBusy,
    setFileBusy,
    suggestions,
    shownKategori,
    correctionRekening,
    handleSelectSuggestion,
    handleParsedResult,
    onSubmit,
    handleCopyTransaksi,
  };
}
