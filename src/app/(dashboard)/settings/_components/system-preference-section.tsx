"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Loader2 } from "lucide-react";
import {
  cn,
  formatRupiah,
  formatTanggal,
  formatWaktu,
} from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  updateUserPreferences,
} from "@/actions/preference-action";
import type { UserPreferences } from "@/lib/user-preferences";
import { useSystemPreferences } from "@/providers/system-preference-provider";

const THEME_OPTIONS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

type Props = {
  preferences: UserPreferences;
};

type SettingRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
};

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="w-full max-w-full shrink-0 sm:w-56">{children}</div>
    </div>
  );
}

export function SystemPreferenceSection({ preferences }: Props) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { setPreferences, updatePreferences } = useSystemPreferences();
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const [isPending, setIsPending] = useState(false);

  const handlePreferenceChange = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    const previous = { ...localPrefs };
    const next = { ...localPrefs, [key]: value };

    setLocalPrefs(next);
    updatePreferences({ [key]: value } as Partial<UserPreferences>);
    setIsPending(true);

    try {
      if (key === "theme") {
        setTheme(String(value));
      }

      const res = await updateUserPreferences({
        [key]: value,
      } as Partial<UserPreferences>);

      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal menyimpan preferensi");
        setLocalPrefs(previous);
        setPreferences(previous);
        if (key === "theme") {
          setTheme(previous.theme);
        }
        return;
      }

      setLocalPrefs(res.data);
      setPreferences(res.data);
      router.refresh();
      toast.success("Preferensi berhasil diperbarui");
    } catch {
      toast.error("Gagal menyimpan preferensi");
      setLocalPrefs(previous);
      setPreferences(previous);
      if (key === "theme") {
        setTheme(previous.theme);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-lg">System Preference</CardTitle>
            <CardDescription>
              Atur tampilan, format data, dan preferensi sistem aplikasi.
            </CardDescription>
          </div>
          {isPending && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Tema Warna</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pilih tema terang, gelap, atau ikuti sistem.
            </p>
          </div>
          <div className="flex w-fit items-center gap-1 rounded-[8px] border border-hairline bg-surface-strong p-1">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePreferenceChange("theme", value)}
                aria-label={`Tema ${label}`}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[8px] transition-all",
                  localPrefs.theme === value
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <SettingRow label="Mata Uang" description="Format mata uang default.">
          <Select
            value={localPrefs.currency}
            onValueChange={(val) =>
              handlePreferenceChange(
                "currency",
                val as UserPreferences["currency"],
              )
            }
          >
            <SelectTrigger className="h-9 text-sm" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow
          label="Format Tanggal"
          description="Tampilan tanggal aplikasi dan export."
        >
          <Select
            value={localPrefs.date_format}
            onValueChange={(val) =>
              handlePreferenceChange(
                "date_format",
                val as UserPreferences["date_format"],
              )
            }
          >
            <SelectTrigger className="h-9 text-sm" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id-ID">Indonesia - 02 Jun 2026</SelectItem>
              <SelectItem value="en-US">English - Jun 02, 2026</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow
          label="Format Angka"
          description="Pemisah ribuan dan desimal."
        >
          <Select
            value={localPrefs.number_format}
            onValueChange={(val) =>
              handlePreferenceChange(
                "number_format",
                val as UserPreferences["number_format"],
              )
            }
          >
            <SelectTrigger className="h-9 text-sm" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id-ID">10.000,00</SelectItem>
              <SelectItem value="en-US">10,000.00</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow
          label="Tampilkan 2 Angka Desimal"
          description="Nominal penuh akan menampilkan dua digit di belakang koma."
        >
          <div className="flex items-center justify-between rounded-input border border-hairline bg-background px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {localPrefs.show_decimal_places ? "Aktif" : "Nonaktif"}
            </span>
            <Switch
              checked={localPrefs.show_decimal_places}
              onCheckedChange={(checked) =>
                handlePreferenceChange("show_decimal_places", checked)
              }
              aria-label="Tampilkan dua angka desimal"
            />
          </div>
        </SettingRow>

        <Separator />

        <SettingRow
          label="Format Waktu"
          description="Tampilan dan input waktu transaksi."
        >
          <Select
            value={localPrefs.time_format}
            onValueChange={(val) =>
              handlePreferenceChange(
                "time_format",
                val as UserPreferences["time_format"],
              )
            }
          >
            <SelectTrigger className="h-9 text-sm" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 jam - 14:30</SelectItem>
              <SelectItem value="12h">12 jam - 02:30 PM</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <div className="py-4">
          <p className="text-sm font-medium">Preview Format</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-input border border-hairline bg-surface-soft p-3">
              <p className="text-xs text-muted-foreground">Nominal</p>
              <p className="mt-1 break-all font-mono text-sm font-semibold">
                {formatRupiah(1000, false, localPrefs)}
              </p>
            </div>
            <div className="rounded-input border border-hairline bg-surface-soft p-3">
              <p className="text-xs text-muted-foreground">Tanggal</p>
              <p className="mt-1 text-sm font-semibold">
                {formatTanggal("2026-06-02", "dd MMM yyyy", localPrefs)}
              </p>
            </div>
            <div className="rounded-input border border-hairline bg-surface-soft p-3">
              <p className="text-xs text-muted-foreground">Waktu</p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {formatWaktu("14:30", localPrefs)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <SettingRow label="Halaman Awal" description="Halaman setelah login.">
          <Select
            value={localPrefs.default_landing_page}
            onValueChange={(val) =>
              handlePreferenceChange(
                "default_landing_page",
                val as UserPreferences["default_landing_page"],
              )
            }
          >
            <SelectTrigger className="h-9 text-sm" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/transaksi">Transaksi</SelectItem>
              <SelectItem value="/rekening">Rekening</SelectItem>
              <SelectItem value="/rekap">Rekap</SelectItem>
              <SelectItem value="/debts">Hutang</SelectItem>
              <SelectItem value="/categories">Kategori</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </CardContent>
    </Card>
  );
}
