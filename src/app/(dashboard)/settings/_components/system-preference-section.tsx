"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateUserPreferences, type UserPreferences } from "@/actions/preference-action";

const THEME_OPTIONS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

type Props = {
  preferences: UserPreferences;
};

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0 w-full sm:w-48 max-w-full">{children}</div>
    </div>
  );
}

export function SystemPreferenceSection({ preferences }: Props) {
  const { theme, setTheme } = useTheme();
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const [isPending, setIsPending] = useState(false);

  const handlePreferenceChange = async (key: keyof UserPreferences, value: string) => {
    // Optimistic UI update
    const previous = { ...localPrefs };
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    setIsPending(true);

    if (key === "theme") {
      setTheme(value);
    }

    const res = await updateUserPreferences({ [key]: value });
    setIsPending(false);

    if (!res.success) {
      toast.error(res.error || "Gagal menyimpan preferensi");
      // Revert optimistic update
      setLocalPrefs(previous);
      if (key === "theme") {
        setTheme(previous.theme);
      }
    } else {
      toast.success("Preferensi berhasil diperbarui");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">System Preference</CardTitle>
            <CardDescription>
              Atur tampilan, format data, dan preferensi sistem aplikasi.
            </CardDescription>
          </div>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Appearance row */}
        <div className="flex items-center justify-between gap-6 py-4">
          <div>
            <p className="text-sm font-medium">Tema Warna</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pilih tema terang, gelap, atau ikuti sistem</p>
          </div>
          <div className="flex items-center gap-1 rounded-[8px] border bg-surface-strong p-1">
            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handlePreferenceChange("theme", value)}
                aria-label={value}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-[8px] transition-all",
                  theme === value
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <SettingRow label="Mata Uang" description="Format mata uang default">
          <Select value={localPrefs.currency} onValueChange={(val) => handlePreferenceChange("currency", val)}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
              {/* Future-proofing for other currencies */}
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow label="Format Tanggal" description="Tampilan tanggal aplikasi">
          <Select value={localPrefs.date_format} onValueChange={(val) => handlePreferenceChange("date_format", val)}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id-ID">Indonesia (DD/MM/YYYY)</SelectItem>
              <SelectItem value="en-US">US (MM/DD/YYYY)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow label="Format Angka" description="Pemisah ribuan dan desimal">
          <Select value={localPrefs.number_format} onValueChange={(val) => handlePreferenceChange("number_format", val)}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id-ID">Indonesia (1.000,00)</SelectItem>
              <SelectItem value="en-US">US (1,000.00)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator />

        <SettingRow label="Halaman Awal" description="Halaman setelah login">
          <Select value={localPrefs.default_landing_page} onValueChange={(val) => handlePreferenceChange("default_landing_page", val)}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/">Dashboard / Rekap</SelectItem>
              <SelectItem value="/transaksi">Transaksi</SelectItem>
              <SelectItem value="/rekening">Rekening</SelectItem>
              <SelectItem value="/kategori">Kategori</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </CardContent>
    </Card>
  );
}
