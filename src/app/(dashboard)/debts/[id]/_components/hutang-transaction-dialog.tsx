"use client";

import { useState, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hutangTransactionSchema,
  type HutangTransactionSchema,
} from "@/validations/hutang-validation";
import { createHutangTransaction, updateCicilan } from "@/actions/hutang-action";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { Hutang, HutangCicilan, JenisTransaksiHutang } from "@/types/hutang";
import type { Rekening } from "@/types/rekening";
import { todayISODate, currentTime } from "@/lib/utils";
import { RekeningSelect } from "@/components/common/rekening-select";
import { NominalInput } from "@/components/common/nominal-input";
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
import { ClearableInput } from "@/components/common/clearable-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hutang: Hutang;
  rekening: Rekening[];
  editData?: HutangCicilan | null;
  defaultJenis?: JenisTransaksiHutang;
  totalPinjaman?: number;
  onSuccess: (refreshed: Hutang) => void;
};

export function HutangTransactionDialog({
  open,
  onOpenChange,
  hutang,
  rekening,
  editData,
  defaultJenis = "pembayaran",
  totalPinjaman,
  onSuccess,
}: Props) {
  const { dict } = useTranslation();
  const isEdit = !!editData;
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HutangTransactionSchema>({
    resolver: zodResolver(hutangTransactionSchema),
    defaultValues: {
      hutang_id: hutang.id,
      jenis_transaksi: totalPinjaman === 0 ? "pinjaman" : defaultJenis,
      tanggal: todayISODate(),
      waktu: currentTime(),
    },
  });

  const jenisTransaksi = useWatch({ control, name: "jenis_transaksi" });

  useEffect(() => {
    if (editData) {
      reset({
        hutang_id: hutang.id,
        jenis_transaksi: editData.jenis_transaksi ?? "pembayaran",
        nominal: Number(editData.nominal),
        tanggal: editData.tanggal,
        waktu: editData.waktu?.substring(0, 5) ?? currentTime(),
        rekening_id: editData.rekening_id ?? undefined,
        catatan: editData.catatan ?? "",
      });
    } else {
      const fallbackJenis = totalPinjaman === 0 ? "pinjaman" : defaultJenis;
      reset({
        hutang_id: hutang.id,
        jenis_transaksi: fallbackJenis,
        tanggal: todayISODate(),
        waktu: currentTime(),
      });
    }
  }, [editData, defaultJenis, totalPinjaman, hutang.id, reset, open]);

  async function onSubmit(values: HutangTransactionSchema) {
    setSubmitting(true);
    try {
      if (isEdit && editData) {
        const res = await updateCicilan(editData.id, {
          nominal: values.nominal,
          jenis_transaksi: values.jenis_transaksi,
          tanggal: values.tanggal,
          waktu: values.waktu,
          rekening_id: values.rekening_id,
          catatan: values.catatan,
        });
        if (res.success && res.data) {
          toast.success(dict.debts.toasts.transactionUpdated);
          onSuccess(res.data);
          onOpenChange(false);
        } else {
          toast.error(res.error ?? dict.debts.toasts.transactionUpdateFailed);
        }
      } else {
        const res = await createHutangTransaction(values);
        if (res.success && res.data) {
          toast.success(dict.debts.toasts.transactionCreated);
          onSuccess(res.data);
          onOpenChange(false);
        } else {
          toast.error(res.error ?? dict.debts.toasts.transactionCreateFailed);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isPiutang = hutang.tipe === "memberi";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? dict.debts.transactionDialog.editTitle
              : jenisTransaksi === "pinjaman"
                ? totalPinjaman === 0
                  ? isPiutang
                    ? dict.debts.transactionDialog.giveFirstLoan
                    : dict.debts.transactionDialog.recordReceivedLoan
                  : isPiutang
                    ? dict.debts.transactionDialog.addGivenLoan
                    : dict.debts.transactionDialog.addReceivedLoan
                : isPiutang
                  ? dict.debts.transactionDialog.recordPayment
                  : dict.debts.transactionDialog.payDebt}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? dict.debts.transactionDialog.editDescription
              : isPiutang
                ? jenisTransaksi === "pinjaman"
                  ? totalPinjaman === 0
                    ? dict.debts.transactionDialog.descGiveInitialLoan
                    : dict.debts.transactionDialog.descGiveAdditionalLoan
                  : dict.debts.transactionDialog.descReceiveRepayment
                : jenisTransaksi === "pinjaman"
                  ? totalPinjaman === 0
                    ? dict.debts.transactionDialog.descReceiveInitialLoan
                    : dict.debts.transactionDialog.descReceiveAdditionalLoan
                  : dict.debts.transactionDialog.descMakePayment}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tabs Jenis Transaksi */}
          <Tabs
            value={jenisTransaksi}
            onValueChange={(val) =>
              setValue("jenis_transaksi", val as JenisTransaksiHutang)
            }
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="pinjaman">
                {isPiutang
                  ? `📤 ${dict.debts.transactionDialog.tabAddLoan}`
                  : `📥 ${dict.debts.transactionDialog.tabReceiveLoan}`}
              </TabsTrigger>
              <TabsTrigger
                value="pembayaran"
                disabled={totalPinjaman === 0 && !isEdit}
                title={
                  totalPinjaman === 0 && !isEdit
                    ? dict.debts.transactionDialog.recordLoanFirst
                    : undefined
                }
              >
                {isPiutang
                  ? `📥 ${dict.debts.transactionDialog.tabReceivePayment}`
                  : `📤 ${dict.debts.transactionDialog.tabPayDebt}`}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Nominal */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-nominal">{dict.debts.transactionDialog.nominalLabel}</Label>
            <Controller
              control={control}
              name="nominal"
              render={({ field }) => (
                <NominalInput
                  id="tx-nominal"
                  placeholder="0"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  className={errors.nominal ? "border-rose-500" : ""}
                />
              )}
            />
            {errors.nominal && (
              <p className="text-xs text-rose-500">{errors.nominal.message}</p>
            )}
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-[3fr_1fr] gap-3">
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label htmlFor="tx-tanggal">{dict.common.date}</Label>
              <Input
                id="tx-tanggal"
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
              <Label htmlFor="tx-waktu">{dict.common.time}</Label>
              <Controller
                control={control}
                name="waktu"
                render={({ field }) => (
                  <Input
                    id="tx-waktu"
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
            <Label htmlFor="tx-rekening">
              {isPiutang
                ? jenisTransaksi === "pinjaman"
                  ? dict.debts.transactionDialog.takenFromWallet
                  : dict.debts.transactionDialog.receivedToWallet
                : jenisTransaksi === "pinjaman"
                  ? dict.debts.transactionDialog.receivedToWallet
                  : dict.debts.transactionDialog.paidFromWallet}
            </Label>
            <Controller
              control={control}
              name="rekening_id"
              render={({ field }) => (
                <RekeningSelect
                  rekening={rekening}
                  value={field.value || "none"}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? "" : val)
                  }
                  placeholder={dict.debts.transactionDialog.noWalletPlaceholder}
                  includeNone={true}
                  noneLabel={dict.debts.transactionDialog.noWalletPlaceholder}
                  className="h-10 text-sm"
                />
              )}
            />
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-catatan">{dict.debts.form.notes}</Label>
            <ClearableInput
              id="tx-catatan"
              placeholder={dict.debts.transactionDialog.notesPlaceholder}
              {...register("catatan")}
              onClear={() => setValue("catatan", "")}
            />
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
              {isEdit ? dict.debts.form.submitUpdate : dict.debts.form.submitCreate}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
