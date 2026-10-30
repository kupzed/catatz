"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRekapSettings } from "@/actions/rekap-period-action";
import type { RekapSettings } from "@/types/rekap";
import { getCycleForDate, getTodayInJakarta } from "@/lib/rekap-period";
import { useTranslation } from "@/i18n/use-translation";

export type RekapSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: RekapSettings;
  onSettingsSaved?: (newSettings: RekapSettings) => void;
};

const CUTOFF_DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

function RekapSettingsForm({
  settings,
  onOpenChange,
  onSettingsSaved,
}: {
  settings: RekapSettings;
  onOpenChange: (open: boolean) => void;
  onSettingsSaved?: (newSettings: RekapSettings) => void;
}) {
  const router = useRouter();
  const { dict, locale } = useTranslation();
  const [selectedCutoff, setSelectedCutoff] = useState<number>(settings.cutoff_day);
  const [akumulasiSaldo, setAkumulasiSaldo] = useState<boolean>(settings.akumulasi_saldo);
  const [isSaving, setIsSaving] = useState(false);

  // Pratinjau siklus berjalan secara instan berdasarkan pilihan cut-off hari
  const runningCycle = useMemo(() => {
    const today = getTodayInJakarta();
    const rekapLocale = locale === "en" ? "en-US" : "id-ID";
    return getCycleForDate(selectedCutoff, today, rekapLocale);
  }, [locale, selectedCutoff]);

  const handleSave = async () => {
    if (isSaving) return;

    const previousSettings = { ...settings };
    const optimisticSettings: RekapSettings = {
      ...settings,
      cutoff_day: selectedCutoff,
      akumulasi_saldo: akumulasiSaldo,
    };

    // Terapkan state optimistik ke callback parent
    onSettingsSaved?.(optimisticSettings);
    setIsSaving(true);

    try {
      const res = await updateRekapSettings({
        cutoff_day: selectedCutoff,
        akumulasi_saldo: akumulasiSaldo,
      });

      if (!res.success || !res.data) {
        // Rollback ke pengaturan sebelumnya bila terjadi kegagalan
        onSettingsSaved?.(previousSettings);
        setSelectedCutoff(previousSettings.cutoff_day);
        setAkumulasiSaldo(previousSettings.akumulasi_saldo);
        toast.error(res.error || dict.reports.toasts.settingsSaveFailed);
        return;
      }

      onSettingsSaved?.(res.data);
      toast.success(dict.reports.toasts.settingsSaved);
      onOpenChange(false);
      router.refresh();
    } catch {
      // Rollback ke pengaturan sebelumnya bila exception tertangkap
      onSettingsSaved?.(previousSettings);
      setSelectedCutoff(previousSettings.cutoff_day);
      setAkumulasiSaldo(previousSettings.akumulasi_saldo);
      toast.error(dict.reports.toasts.settingsSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dict.reports.settings.title}</DialogTitle>
        <DialogDescription>
          {dict.reports.settings.description}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* Tanggal Cut-off (1-31) */}
        <div className="space-y-2">
          <Label htmlFor="cutoff-select" className="text-sm font-medium">
            {dict.reports.settings.cutoffDayLabel}
          </Label>
          <Select
            value={String(selectedCutoff)}
            onValueChange={(val) => setSelectedCutoff(Number(val))}
          >
            <SelectTrigger
              id="cutoff-select"
              aria-label={dict.reports.settings.cutoffDaySelectAria}
              className="h-12 w-full rounded-input border-hairline"
            >
              <SelectValue placeholder={dict.reports.settings.cutoffDayPlaceholder} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {CUTOFF_DAYS.map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day === 1
                    ? dict.reports.settings.cutoffDayFirst
                    : dict.reports.settings.cutoffDayOther.replace("{day}", String(day))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {dict.reports.settings.cutoffDayDescription}
          </p>
        </div>

        {/* Pratinjau Siklus Berjalan */}
        <div className="rounded-card border border-hairline bg-surface-soft p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {dict.reports.settings.previewTitle}
          </p>
          <p className="mt-1 font-mono text-base font-semibold text-foreground">
            {runningCycle.label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dict.reports.settings.activeRange
              .replace("{start}", runningCycle.startDate)
              .replace("{end}", runningCycle.endDate)
              .replace("{days}", String(runningCycle.daysCount))}
          </p>
        </div>

        {/* Switch Saldo Akumulasi */}
        <div className="flex items-start justify-between gap-4 rounded-card border border-hairline bg-card p-4">
          <div className="min-w-0 flex-1">
            <Label
              htmlFor="switch-akumulasi"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {dict.reports.settings.accumulateBalanceLabel}
            </Label>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {dict.reports.settings.accumulateBalanceDescription}
            </p>
          </div>
          <Switch
            id="switch-akumulasi"
            checked={akumulasiSaldo}
            onCheckedChange={setAkumulasiSaldo}
            aria-label={dict.reports.settings.accumulateBalanceLabel}
            className="mt-0.5"
          />
        </div>
      </div>

      <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
          className="w-full rounded-full sm:w-auto"
        >
          {dict.reports.settings.cancelButton}
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 w-full rounded-full bg-primary px-5 text-white hover:bg-primary-active sm:w-auto"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {dict.reports.settings.saveButton}
        </Button>
      </DialogFooter>
    </>
  );
}

export function RekapSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsSaved,
}: RekapSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        {open && (
          <RekapSettingsForm
            key={`${settings.cutoff_day}-${settings.akumulasi_saldo}`}
            settings={settings}
            onOpenChange={onOpenChange}
            onSettingsSaved={onSettingsSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
