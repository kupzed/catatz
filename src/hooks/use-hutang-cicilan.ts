"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  createCicilan,
  deleteCicilan,
  updateCicilan,
} from "@/actions/hutang-action";
import { currentTime, todayISODate } from "@/lib/utils";
import { useTranslation } from "@/i18n/use-translation";
import type { Hutang, HutangCicilan } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";

export type CicilanDraft = {
  nominal: string;
  rekening_id: string;
  tanggal: string;
  waktu: string;
  catatan: string;
};

export type CicilanData = Record<
  string,
  { nominal: string; rekening_id: string }
>;

export const emptyEditDraft = (): CicilanDraft => ({
  nominal: "",
  rekening_id: "none",
  tanggal: todayISODate(),
  waktu: currentTime(),
  catatan: "",
});

export type UseHutangCicilanParams = {
  rekening: Rekening[];
  onHutangUpdated: (h: Hutang) => void;
};

export type UseHutangCicilanReturn = {
  cicilanData: CicilanData;
  setCicilanData: Dispatch<SetStateAction<CicilanData>>;
  loadingCicilan: string | null;
  setLoadingCicilan: Dispatch<SetStateAction<string | null>>;
  editingCicilanId: string | null;
  setEditingCicilanId: Dispatch<SetStateAction<string | null>>;
  editCicilanDraft: CicilanDraft;
  setEditCicilanDraft: Dispatch<SetStateAction<CicilanDraft>>;
  handleCicilan: (h: Hutang) => Promise<void | string | number>;
  handleUpdateCicilan: (
    h: Hutang,
    cicilan: HutangCicilan,
  ) => Promise<void | string | number>;
  handleDeleteCicilan: (id: string) => Promise<void>;
  startEditCicilan: (cicilan: HutangCicilan) => void;
};

/** Mengelola state dan aksi cicilan hutang agar halaman hutang tetap ringan. */
export function useHutangCicilan({
  onHutangUpdated,
}: UseHutangCicilanParams): UseHutangCicilanReturn {
  const { dict } = useTranslation();
  const [cicilanData, setCicilanData] = useState<CicilanData>({});
  const [loadingCicilan, setLoadingCicilan] = useState<string | null>(null);
  const [editingCicilanId, setEditingCicilanId] = useState<string | null>(null);
  const [editCicilanDraft, setEditCicilanDraft] =
    useState<CicilanDraft>(emptyEditDraft);

  async function handleCicilan(h: Hutang) {
    const data = cicilanData[h.id] || {};
    const nominal = Number(data.nominal ?? "0");

    if (!nominal || nominal <= 0) {
      return toast.error(dict.errors.validation.mustBePositive);
    }

    setLoadingCicilan(h.id);
    const res = await createCicilan({
      hutang_id: h.id,
      nominal,
      rekening_id:
        data.rekening_id && data.rekening_id !== "none"
          ? data.rekening_id
          : undefined,
      tanggal: todayISODate(),
      waktu: currentTime(),
    });

    if (res.success && res.data) {
      onHutangUpdated(res.data);
      setCicilanData((prev) => ({
        ...prev,
        [h.id]: { nominal: "", rekening_id: "" },
      }));
      toast.success(dict.toast.installmentCreated);
    } else {
      toast.error(res.error ?? dict.toast.saveFailed);
    }

    setLoadingCicilan(null);
  }

  function startEditCicilan(cicilan: HutangCicilan) {
    setEditingCicilanId(cicilan.id);
    setEditCicilanDraft({
      nominal: String(Number(cicilan.nominal)),
      rekening_id: cicilan.rekening_id ?? "none",
      tanggal: cicilan.tanggal,
      waktu: cicilan.waktu?.substring(0, 5) ?? currentTime(),
      catatan: cicilan.catatan ?? "",
    });
  }

  async function handleUpdateCicilan(h: Hutang, cicilan: HutangCicilan) {
    const nominal = Number(editCicilanDraft.nominal);
    if (!nominal || nominal <= 0) {
      return toast.error(dict.errors.validation.mustBePositive);
    }

    setLoadingCicilan(h.id);
    const res = await updateCicilan(cicilan.id, {
      nominal,
      rekening_id: editCicilanDraft.rekening_id,
      tanggal: editCicilanDraft.tanggal,
      waktu: editCicilanDraft.waktu,
      catatan: editCicilanDraft.catatan,
    });

    if (res.success && res.data) {
      onHutangUpdated(res.data);
      setEditingCicilanId(null);
      setEditCicilanDraft(emptyEditDraft());
      toast.success(dict.toast.installmentUpdated);
    } else {
      toast.error(res.error ?? dict.toast.updateFailed);
    }

    setLoadingCicilan(null);
  }

  async function handleDeleteCicilan(id: string) {
    const res = await deleteCicilan(id);
    if (res.success && res.data) {
      onHutangUpdated(res.data);
      toast.success(dict.toast.installmentDeleted);
    } else {
      toast.error(res.error ?? dict.toast.deleteFailed);
    }
  }

  return {
    cicilanData,
    setCicilanData,
    loadingCicilan,
    setLoadingCicilan,
    editingCicilanId,
    setEditingCicilanId,
    editCicilanDraft,
    setEditCicilanDraft,
    handleCicilan,
    handleUpdateCicilan,
    handleDeleteCicilan,
    startEditCicilan,
  };
}
