import { useState, useEffect, useMemo, useRef } from "react";
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
  lockKategori?: boolean;
  lockRekening?: boolean;
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
  lockKategori,
  lockRekening,
}: UseTransaksiDialogParams) {
  const isEdit = !!editData;
  const isCorrection = editData?.tipe === "correction";
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<JudulSuggestion[]>([]);

  const lockedKategori =
    lockKategori && defaultKategoriId
      ? kategori.find((k) => k.id === defaultKategoriId) ?? null
      : null;

  const allowedTipe: TransaksiSchema["tipe"][] | undefined = useMemo(() => {
    if (!lockKategori) return undefined;
    if (lockedKategori?.tipe === "income") return ["income"];
    if (lockedKategori?.tipe === "expense") return ["expense"];
    return ["expense", "income"];
  }, [lockKategori, lockedKategori]);

  const isInitialTransferIn = useMemo(() => {
    if (!lockRekening || !defaultRekeningId) return false;
    const sourceTx = editData ?? copyFrom;
    return (
      sourceTx?.tipe === "transfer" &&
      sourceTx.rekening_tujuan === defaultRekeningId &&
      sourceTx.rekening_id !== defaultRekeningId
    );
  }, [lockRekening, defaultRekeningId, editData, copyFrom]);

  const initialFormTipe: TransaksiSchema["tipe"] =
    (editData?.tipe as TransaksiSchema["tipe"]) ??
    (copyFrom?.tipe as TransaksiSchema["tipe"]) ??
    (lockedKategori?.tipe === "income"
      ? "income"
      : lockedKategori?.tipe === "expense"
        ? "expense"
        : "expense");

  const initialRekeningId =
    lockRekening && defaultRekeningId
      ? isInitialTransferIn
        ? (editData?.rekening_id ?? copyFrom?.rekening_id ?? "")
        : defaultRekeningId
      : (editData?.rekening_id ?? defaultRekeningId ?? "");

  const initialRekeningTujuan =
    lockRekening && defaultRekeningId
      ? isInitialTransferIn
        ? defaultRekeningId
        : (editData?.rekening_tujuan ?? copyFrom?.rekening_tujuan ?? undefined)
      : (editData?.rekening_tujuan ?? copyFrom?.rekening_tujuan ?? undefined);

  const form = useForm<TransaksiSchema>({
    resolver: zodResolver(transaksiSchema),
    defaultValues: {
      tipe: initialFormTipe,
      tanggal: editData?.tanggal ?? todayISODate(),
      waktu: editData?.waktu?.substring(0, 5) ?? currentTime(),
      rekening_id: initialRekeningId,
      rekening_tujuan: initialRekeningTujuan,
      tags: editData?.tags ?? [],
    },
  });

  const { control, setValue, reset, getValues } = form;
  const tipe = useWatch({ control, name: "tipe" });
  const judul = useWatch({ control, name: "judul" });
  const rekeningId = useWatch({ control, name: "rekening_id" });
  const rekeningTujuan = useWatch({ control, name: "rekening_tujuan" });

  const prevTipeRef = useRef<TransaksiSchema["tipe"]>(initialFormTipe);

  // Reset form saat dialog dibuka/ditutup atau editData berubah
  useEffect(() => {
    if (editData) {
      let nextTipe = editData.tipe as TransaksiSchema["tipe"];
      if (allowedTipe && !allowedTipe.includes(nextTipe)) {
        nextTipe = allowedTipe[0];
      }

      const nextRekeningId =
        lockRekening && defaultRekeningId
          ? isInitialTransferIn
            ? (editData.rekening_id ?? "")
            : defaultRekeningId
          : (editData.rekening_id ?? "");

      const nextRekeningTujuan =
        lockRekening && defaultRekeningId
          ? isInitialTransferIn
            ? defaultRekeningId
            : (editData.rekening_tujuan ?? undefined)
          : (editData.rekening_tujuan ?? undefined);

      prevTipeRef.current = nextTipe;
      reset({
        tipe: nextTipe,
        judul: editData.judul ?? undefined,
        nominal: Number(editData.nominal),
        tanggal: editData.tanggal,
        waktu: editData.waktu?.substring(0, 5) ?? currentTime(),
        kategori_id:
          lockKategori && defaultKategoriId
            ? defaultKategoriId
            : (editData.kategori_id ?? undefined),
        rekening_id: nextRekeningId,
        rekening_tujuan: nextRekeningTujuan,
        catatan: editData.catatan ?? "",
        tags: editData.tags ?? [],
      });
    } else if (copyFrom) {
      // Mode copy: pre-fill dengan data transaksi asal, tanggal reset ke hari ini
      let nextTipe = copyFrom.tipe as TransaksiSchema["tipe"];
      if (allowedTipe && !allowedTipe.includes(nextTipe)) {
        nextTipe = allowedTipe[0];
      }

      const nextRekeningId =
        lockRekening && defaultRekeningId
          ? isInitialTransferIn
            ? (copyFrom.rekening_id ?? "")
            : defaultRekeningId
          : (copyFrom.rekening_id ?? "");

      const nextRekeningTujuan =
        lockRekening && defaultRekeningId
          ? isInitialTransferIn
            ? defaultRekeningId
            : (copyFrom.rekening_tujuan ?? undefined)
          : (copyFrom.rekening_tujuan ?? undefined);

      prevTipeRef.current = nextTipe;
      reset({
        tipe: nextTipe,
        judul: copyFrom.judul ?? undefined,
        nominal: Number(copyFrom.nominal),
        tanggal: todayISODate(),
        waktu: currentTime(),
        kategori_id:
          lockKategori && defaultKategoriId
            ? defaultKategoriId
            : (copyFrom.kategori_id ?? undefined),
        rekening_id: nextRekeningId,
        rekening_tujuan: nextRekeningTujuan,
        catatan: copyFrom.catatan ?? "",
        tags: copyFrom.tags ?? [],
      });
    } else {
      let initialTipe: TransaksiSchema["tipe"] = "expense";
      if (lockedKategori?.tipe === "income") {
        initialTipe = "income";
      } else if (lockedKategori?.tipe === "expense") {
        initialTipe = "expense";
      } else if (defaultKategoriId) {
        const targetKat = kategori.find((k) => k.id === defaultKategoriId);
        initialTipe = targetKat?.tipe === "income" ? "income" : "expense";
      }

      if (allowedTipe && !allowedTipe.includes(initialTipe)) {
        initialTipe = allowedTipe[0];
      }

      prevTipeRef.current = initialTipe;
      reset({
        tipe: initialTipe,
        tanggal: defaultTanggal ?? todayISODate(),
        waktu: currentTime(),
        rekening_id: defaultRekeningId ?? "",
        kategori_id: defaultKategoriId ?? undefined,
        tags: [],
      });
    }
  }, [
    editData,
    copyFrom,
    defaultTanggal,
    defaultRekeningId,
    defaultKategoriId,
    lockKategori,
    lockedKategori,
    lockRekening,
    isInitialTransferIn,
    allowedTipe,
    kategori,
    reset,
    open,
  ]);

  const disabledRekeningId = useMemo(() => {
    if (!lockRekening || !defaultRekeningId) return false;
    if (tipe === "transfer") {
      // Pada transfer di detail rekening: jika rekening tujuan adalah defaultRekeningId,
      // maka rekening asal bebas dipilih.
      return rekeningTujuan !== defaultRekeningId;
    }
    return true;
  }, [lockRekening, defaultRekeningId, tipe, rekeningTujuan]);

  const disabledRekeningTujuan = useMemo(() => {
    if (!lockRekening || !defaultRekeningId) return false;
    if (tipe === "transfer") {
      // Pada transfer di detail rekening: terkunci jika rekening tujuan adalah defaultRekeningId.
      return rekeningTujuan === defaultRekeningId;
    }
    return false;
  }, [lockRekening, defaultRekeningId, tipe, rekeningTujuan]);

  // Load suggestions (recent judul jika judul kosong, atau search query jika judul diisi)
  useEffect(() => {
    if (!open) return;

    const filterCatId = lockKategori ? defaultKategoriId : undefined;
    const filterRekeningId = lockRekening ? defaultRekeningId : undefined;
    if (!judul || judul.length < 1) {
      if (!isEdit || lockKategori || lockRekening) {
        const fetchRecent = filterRekeningId
          ? getRecentJudul(filterCatId, filterRekeningId)
          : getRecentJudul(filterCatId);
        fetchRecent.then(setSuggestions).catch(() => {});
      } else {
        setTimeout(() => setSuggestions([]), 0);
      }
      return;
    }

    const timeout = setTimeout(async () => {
      const sugg = filterRekeningId
        ? await getJudulSuggestions(judul, filterCatId, filterRekeningId)
        : await getJudulSuggestions(judul, filterCatId);
      setSuggestions(sugg);
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    open,
    judul,
    isEdit,
    lockKategori,
    defaultKategoriId,
    lockRekening,
    defaultRekeningId,
  ]);

  const canSwap = useMemo(() => {
    if (tipe !== "transfer") return false;
    if (lockRekening && defaultRekeningId) {
      // Di detail rekening: bisa swap jika salah satu memegang defaultRekeningId
      const hasDefault =
        rekeningId === defaultRekeningId || rekeningTujuan === defaultRekeningId;
      if (!hasDefault) return false;
      if (rekeningId && rekeningTujuan) {
        return rekeningId !== rekeningTujuan;
      }
      return true;
    }
    if (disabledRekeningId || disabledRekeningTujuan) return false;
    return !!(rekeningId && rekeningTujuan && rekeningId !== rekeningTujuan);
  }, [
    tipe,
    lockRekening,
    defaultRekeningId,
    disabledRekeningId,
    disabledRekeningTujuan,
    rekeningId,
    rekeningTujuan,
  ]);

  function handleRekeningAsalChange(val: string) {
    if (disabledRekeningId) return;

    if (tipe === "transfer") {
      const currentTujuan = getValues("rekening_tujuan");
      const currentAsal = getValues("rekening_id");

      // Jika user memilih rekening yang saat ini merupakan rekening tujuan, otomatis swap
      if (currentTujuan && val === currentTujuan) {
        setValue("rekening_id", val, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("rekening_tujuan", currentAsal, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      if (currentTujuan === val) {
        setValue("rekening_tujuan", undefined, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }

    setValue("rekening_id", val, { shouldDirty: true, shouldValidate: true });
  }

  function handleRekeningTujuanChange(val: string) {
    if (disabledRekeningTujuan) return;

    const currentAsal = getValues("rekening_id");
    const currentTujuan = getValues("rekening_tujuan");

    // Jika user memilih rekening yang saat ini merupakan rekening asal:
    if (currentAsal && val === currentAsal) {
      if (
        !disabledRekeningId &&
        currentTujuan &&
        currentTujuan !== currentAsal
      ) {
        // Otomatis swap posisi rekening tujuan dan rekening asal
        setValue("rekening_tujuan", val, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("rekening_id", currentTujuan, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      // Proteksi: jangan izinkan rekening tujuan sama dengan rekening asal jika tidak swap
      return;
    }

    setValue("rekening_tujuan", val, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleSwapRekening() {
    if (tipe !== "transfer") return;
    const currentAsal = getValues("rekening_id") || "";
    const currentTujuan = getValues("rekening_tujuan") || "";

    if (lockRekening && defaultRekeningId) {
      if (
        currentAsal !== defaultRekeningId &&
        currentTujuan !== defaultRekeningId
      ) {
        return;
      }
      if (currentAsal && currentTujuan && currentAsal === currentTujuan) {
        return;
      }
      setValue("rekening_id", currentTujuan || "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("rekening_tujuan", currentAsal || undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (disabledRekeningId || disabledRekeningTujuan) return;
    if (!currentAsal || !currentTujuan || currentAsal === currentTujuan) return;

    setValue("rekening_id", currentTujuan, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("rekening_tujuan", currentAsal, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  // Bersihkan field yang tidak relevan agar payload tetap sesuai tipe transaksi saat tipe berubah.
  useEffect(() => {
    if (prevTipeRef.current === tipe) {
      return;
    }
    prevTipeRef.current = tipe;

    if (tipe === "transfer" || tipe === "correction") {
      setValue("judul", null);
      setValue("kategori_id", undefined);
    }

    if (tipe !== "transfer") {
      setValue("rekening_tujuan", undefined);
      if (lockRekening && defaultRekeningId) {
        setValue("rekening_id", defaultRekeningId);
      }
    } else {
      const asal = getValues("rekening_id");
      const tujuan = getValues("rekening_tujuan");
      if (tujuan && asal && tujuan === asal) {
        setValue("rekening_tujuan", undefined);
      }
    }
  }, [tipe, setValue, getValues, lockRekening, defaultRekeningId]);

  function handleSelectSuggestion(s: JudulSuggestion) {
    setValue("judul", s.judul, { shouldDirty: true, shouldValidate: true });
    if (lockKategori) {
      return;
    }
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
      if (!allowedTipe || allowedTipe.includes(resolved.tipe)) {
        setValue("tipe", resolved.tipe, dirtyOptions);
      }
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
    if (resolved.rekeningId && !disabledRekeningId) {
      setValue("rekening_id", resolved.rekeningId, dirtyOptions);
    }

    window.setTimeout(() => {
      if (!lockKategori && nextTipe !== "transfer" && resolved.kategoriId) {
        setValue("kategori_id", resolved.kategoriId, dirtyOptions);
      }
      if (
        nextTipe === "transfer" &&
        resolved.rekeningTujuanId &&
        !disabledRekeningTujuan
      ) {
        const finalAsal =
          !disabledRekeningId && resolved.rekeningId
            ? resolved.rekeningId
            : getValues("rekening_id");
        if (resolved.rekeningTujuanId !== finalAsal) {
          setValue("rekening_tujuan", resolved.rekeningTujuanId, dirtyOptions);
        }
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
      const finalKategoriId =
        lockKategori && defaultKategoriId
          ? defaultKategoriId
          : isTransferOrCorrection
          ? undefined
          : values.kategori_id;

      let finalRekeningId = values.rekening_id;
      let finalRekeningTujuan =
        values.tipe === "transfer" ? values.rekening_tujuan : undefined;

      if (lockRekening && defaultRekeningId) {
        if (values.tipe === "transfer") {
          // Pada transfer di detail rekening: jika rekening tujuan adalah defaultRekeningId (transfer masuk),
          // tegakkan defaultRekeningId di rekening tujuan. Selain itu, tegakkan di rekening asal (transfer keluar).
          if (values.rekening_tujuan === defaultRekeningId) {
            finalRekeningTujuan = defaultRekeningId;
            finalRekeningId = values.rekening_id;
          } else {
            finalRekeningId = defaultRekeningId;
            finalRekeningTujuan = values.rekening_tujuan;
          }
        } else {
          finalRekeningId = defaultRekeningId;
        }
      }

      const sanitizedValues: TransaksiSchema = {
        ...values,
        judul: isTransferOrCorrection ? null : (values.judul ?? null),
        kategori_id: finalKategoriId,
        rekening_id: finalRekeningId,
        rekening_tujuan: finalRekeningTujuan,
      };

      if (
        sanitizedValues.tipe === "transfer" &&
        sanitizedValues.rekening_id === sanitizedValues.rekening_tujuan
      ) {
        toast.error("Rekening asal dan tujuan tidak boleh sama");
        return;
      }

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
          onOpenChange(false);
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
          onOpenChange(false);
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
  let shownKategori = tipe === "income" ? incomeKategori : expenseKategori;
  if (lockKategori && lockedKategori) {
    if (!shownKategori.some((k) => k.id === lockedKategori.id)) {
      shownKategori = [lockedKategori, ...shownKategori];
    }
  }

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
    allowedTipe,
    lockKategori: !!lockKategori,
    lockRekening: !!lockRekening,
    disabledRekeningId,
    disabledRekeningTujuan,
    rekeningId,
    rekeningTujuan,
    canSwap,
    handleRekeningAsalChange,
    handleRekeningTujuanChange,
    handleSwapRekening,
    handleSelectSuggestion,
    handleParsedResult,
    onSubmit,
    handleCopyTransaksi,
  };
}
