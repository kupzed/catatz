import { useMemo } from "react";
import { Controller } from "react-hook-form";
import type {
  Control,
  UseFormRegister,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import type { TransaksiSchema } from "@/validations/transaksi-validation";
import type { Rekening } from "@/types/rekening";
import type { Kategori, JudulSuggestion } from "@/types/transaksi";
import { Input } from "@/components/ui/input";
import { ClearableInput } from "@/components/common/clearable-input";
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
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// 1. Tanggal & Waktu Fields
// ─────────────────────────────────────────────
type DateTimeFieldsProps = {
  register: UseFormRegister<TransaksiSchema>;
  control: Control<TransaksiSchema>;
  errors: FieldErrors<TransaksiSchema>;
};

export function TransaksiDateTimeFields({
  register,
  control,
  errors,
}: DateTimeFieldsProps) {
  return (
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
          <p className="text-xs text-rose-500 mt-1">{errors.tanggal.message}</p>
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
  );
}

// ─────────────────────────────────────────────
// 2. Rekening Fields (Asal & Tujuan / Correction)
// ─────────────────────────────────────────────
type RekeningFieldsProps = {
  control: Control<TransaksiSchema>;
  errors: FieldErrors<TransaksiSchema>;
  tipe: TransaksiSchema["tipe"];
  isCorrection: boolean;
  rekening: Rekening[];
  correctionRekening: Rekening | null;
  disabledRekeningId?: boolean;
  disabledRekeningTujuan?: boolean;
  rekeningId?: string;
  rekeningTujuan?: string;
  canSwap?: boolean;
  onRekeningAsalChange?: (value: string) => void;
  onRekeningTujuanChange?: (value: string) => void;
  onSwapRekening?: () => void;
};

export function TransaksiRekeningFields({
  control,
  errors,
  tipe,
  isCorrection,
  rekening,
  correctionRekening,
  disabledRekeningId = false,
  disabledRekeningTujuan = false,
  rekeningId,
  rekeningTujuan,
  canSwap = false,
  onRekeningAsalChange,
  onRekeningTujuanChange,
  onSwapRekening,
}: RekeningFieldsProps) {
  const { formatRupiah } = useSystemPreferences();

  const disabledAsalValues = useMemo(() => {
    if (tipe !== "transfer") return undefined;
    if (disabledRekeningTujuan && rekeningTujuan) {
      return [rekeningTujuan];
    }
    return undefined;
  }, [tipe, disabledRekeningTujuan, rekeningTujuan]);

  const disabledTujuanValues = useMemo(() => {
    if (tipe !== "transfer") return undefined;
    if (!rekeningId) return undefined;
    // Jika rekening asal terkunci atau rekening tujuan belum dipilih,
    // jangan izinkan memilih rekening yang sama dengan rekening asal.
    if (disabledRekeningId || !rekeningTujuan) {
      return [rekeningId];
    }
    return undefined;
  }, [tipe, disabledRekeningId, rekeningId, rekeningTujuan]);

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="rekening-select">
            Rekening {tipe === "transfer" ? "Asal" : ""}
          </Label>
          {disabledRekeningId && (
            <span className="text-[11px] text-muted-foreground">
              Terkunci di rekening ini
            </span>
          )}
        </div>
        {isCorrection ? (
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
                onValueChange={(val) => {
                  if (onRekeningAsalChange) {
                    onRekeningAsalChange(val);
                  } else {
                    field.onChange(val);
                  }
                }}
                placeholder="Pilih rekening"
                id="rekening-select"
                disabled={disabledRekeningId}
                disabledValues={disabledAsalValues}
                disabledReason="(Rekening tujuan)"
                className={cn(
                  errors.rekening_id && "border-rose-500",
                  disabledRekeningId &&
                    "opacity-80 cursor-not-allowed bg-muted/40",
                )}
              />
            )}
          />
        )}
        {errors.rekening_id && (
          <p className="text-xs text-rose-500">{errors.rekening_id.message}</p>
        )}
      </div>

      {tipe === "transfer" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="rekening-tujuan-select">Rekening Tujuan</Label>
            <div className="flex items-center gap-2">
              {canSwap && (
                <button
                  type="button"
                  onClick={onSwapRekening}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer transition-colors"
                  title="Tukar posisi rekening asal dan tujuan"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  <span>Tukar Rekening</span>
                </button>
              )}
              {disabledRekeningTujuan && (
                <span className="text-[11px] text-muted-foreground">
                  Terkunci di rekening ini
                </span>
              )}
            </div>
          </div>
          <Controller
            control={control}
            name="rekening_tujuan"
            render={({ field }) => (
              <RekeningSelect
                rekening={rekening}
                value={field.value || ""}
                onValueChange={(val) => {
                  if (onRekeningTujuanChange) {
                    onRekeningTujuanChange(val);
                  } else {
                    field.onChange(val);
                  }
                }}
                placeholder="Pilih rekening tujuan"
                id="rekening-tujuan-select"
                disabled={disabledRekeningTujuan}
                disabledValues={disabledTujuanValues}
                disabledReason="(Rekening asal)"
                className={cn(
                  errors.rekening_tujuan && "border-rose-500",
                  disabledRekeningTujuan &&
                    "opacity-80 cursor-not-allowed bg-muted/40",
                )}
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
    </>
  );
}

// ─────────────────────────────────────────────
// 3. Nominal Field
// ─────────────────────────────────────────────
type NominalFieldProps = {
  control: Control<TransaksiSchema>;
  errors: FieldErrors<TransaksiSchema>;
};

export function TransaksiNominalField({
  control,
  errors,
}: NominalFieldProps) {
  return (
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
  );
}

// ─────────────────────────────────────────────
// 4. Judul & Suggestion Field
// ─────────────────────────────────────────────
type JudulFieldProps = {
  register: UseFormRegister<TransaksiSchema>;
  setValue: UseFormSetValue<TransaksiSchema>;
  errors: FieldErrors<TransaksiSchema>;
  judul?: string | null;
  suggestions: JudulSuggestion[];
  kategori: Kategori[];
  onSelectSuggestion: (s: JudulSuggestion) => void;
};

export function TransaksiJudulField({
  register,
  setValue,
  errors,
  judul,
  suggestions,
  kategori,
  onSelectSuggestion,
}: JudulFieldProps) {
  const { onChange, ...registerProps } = register("judul");

  return (
    <div className="space-y-1.5">
      <Label htmlFor="judul">Judul</Label>
      <ClearableInput
        id="judul"
        placeholder="Nama transaksi, misal: Gaji Bulanan, Kopi Starb..."
        autoComplete="off"
        value={judul ?? ""}
        {...registerProps}
        onChange={(e) => {
          onChange(e);
          setValue("judul", e.target.value);
        }}
        onClear={() => setValue("judul", "")}
      />
      {errors.judul && (
        <p className="text-xs text-rose-500">{errors.judul.message}</p>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(s)}
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
  );
}

// ─────────────────────────────────────────────
// 5. Kategori Select Field
// ─────────────────────────────────────────────
type KategoriFieldProps = {
  control: Control<TransaksiSchema>;
  errors: FieldErrors<TransaksiSchema>;
  kategoriList: Kategori[];
  disabled?: boolean;
};

export function TransaksiKategoriField({
  control,
  errors,
  kategoriList,
  disabled = false,
}: KategoriFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="kategori-select">Kategori</Label>
        {disabled && (
          <span className="text-[11px] text-muted-foreground">
            Terkunci di kategori ini
          </span>
        )}
      </div>
      <Controller
        control={control}
        name="kategori_id"
        render={({ field }) => (
          <Select
            value={field.value || ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id="kategori-select"
              className={cn(
                errors.kategori_id && "border-rose-500",
                disabled && "opacity-80 cursor-not-allowed bg-muted/40",
              )}
            >
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {kategoriList.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.ikon} {k.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.kategori_id && (
        <p className="text-xs text-rose-500">{errors.kategori_id.message}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 6. Catatan Field
// ─────────────────────────────────────────────
type CatatanFieldProps = {
  register: UseFormRegister<TransaksiSchema>;
  setValue: UseFormSetValue<TransaksiSchema>;
  isCorrection: boolean;
};

export function TransaksiCatatanField({
  register,
  setValue,
  isCorrection,
}: CatatanFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="catatan">Catatan</Label>
      <ClearableInput
        id="catatan"
        placeholder={
          isCorrection
            ? "Alasan koreksi saldo (opsional)..."
            : "Keterangan tambahan..."
        }
        autoComplete="off"
        {...register("catatan")}
        onClear={() => setValue("catatan", "")}
      />
    </div>
  );
}
