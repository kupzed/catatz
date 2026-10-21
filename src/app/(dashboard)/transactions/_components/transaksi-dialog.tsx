"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Transaksi, Kategori } from "@/types/transaksi";
import type { Rekening } from "@/types/rekening";
import type { QueuedAction } from "@/lib/offline-queue";
import { useTransaksiDialog } from "./use-transaksi-dialog";
import { TransaksiDialogHeader } from "./transaksi-dialog-header";
import { TransaksiAiSection } from "./transaksi-ai-section";
import { TransaksiTipeTabs } from "./transaksi-tipe-tabs";
import {
  TransaksiDateTimeFields,
  TransaksiRekeningFields,
  TransaksiNominalField,
  TransaksiJudulField,
  TransaksiKategoriField,
  TransaksiCatatanField,
} from "./transaksi-form-fields";
import { TransaksiDialogFooter } from "./transaksi-dialog-footer";

export type TransaksiDialogProps = {
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
  /** Rekening default untuk mode create normal */
  defaultRekeningId?: string;
  /** Kategori default untuk mode create normal */
  defaultKategoriId?: string;
  /** Kunci kategori dan sesuaikan opsi tipe serta suggestions (misal di detail kategori) */
  lockKategori?: boolean;
  /** Kunci rekening dan sesuaikan suggestions (misal di detail rekening) */
  lockRekening?: boolean;
};

export default function TransaksiDialog(props: TransaksiDialogProps) {
  const {
    open,
    onOpenChange,
    rekening,
    kategori,
    copyFrom,
  } = props;

  const {
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
    lockKategori,
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
  } = useTransaksiDialog(props);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-lg">
        <TransaksiDialogHeader
          isCorrection={isCorrection}
          isEdit={isEdit}
          isCopy={!!copyFrom}
        />

        {/* AI input hanya tampil saat create (bukan edit & bukan copy & bukan correction). */}
        {!isEdit && !copyFrom && (
          <TransaksiAiSection
            voiceBusy={voiceBusy}
            fileBusy={fileBusy}
            onVoiceBusyChange={setVoiceBusy}
            onFileBusyChange={setFileBusy}
            onParsedResult={handleParsedResult}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipe Tabs atau banner Koreksi Saldo */}
          <TransaksiTipeTabs
            isCorrection={isCorrection}
            tipe={tipe}
            allowedTipe={allowedTipe}
            onTipeChange={(v) => setValue("tipe", v)}
          />

          {/* Tanggal & Waktu */}
          <TransaksiDateTimeFields
            register={register}
            control={control}
            errors={errors}
          />

          {/* Rekening Asal & Tujuan */}
          <TransaksiRekeningFields
            control={control}
            errors={errors}
            tipe={tipe}
            isCorrection={isCorrection}
            rekening={rekening}
            correctionRekening={correctionRekening}
            disabledRekeningId={disabledRekeningId}
            disabledRekeningTujuan={disabledRekeningTujuan}
            rekeningId={rekeningId}
            rekeningTujuan={rekeningTujuan}
            canSwap={canSwap}
            onRekeningAsalChange={handleRekeningAsalChange}
            onRekeningTujuanChange={handleRekeningTujuanChange}
            onSwapRekening={handleSwapRekening}
          />

          {/* Nominal */}
          <TransaksiNominalField control={control} errors={errors} />

          {/* Judul & Suggestions (hanya saat bukan transfer dan bukan correction) */}
          {!isCorrection && tipe !== "transfer" && (
            <TransaksiJudulField
              register={register}
              setValue={setValue}
              errors={errors}
              judul={judul}
              suggestions={suggestions}
              kategori={kategori}
              onSelectSuggestion={handleSelectSuggestion}
            />
          )}

          {/* Kategori (hanya saat bukan transfer dan bukan correction) */}
          {!isCorrection && tipe !== "transfer" && (
            <TransaksiKategoriField
              control={control}
              errors={errors}
              kategoriList={shownKategori}
              disabled={lockKategori}
            />
          )}

          {/* Catatan */}
          <TransaksiCatatanField
            register={register}
            setValue={setValue}
            isCorrection={isCorrection}
          />

          {/* Footer Actions */}
          <TransaksiDialogFooter
            isEdit={isEdit}
            isCorrection={isCorrection}
            copying={copying}
            submitting={submitting}
            disabled={voiceBusy || fileBusy}
            onCopy={handleCopyTransaksi}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
