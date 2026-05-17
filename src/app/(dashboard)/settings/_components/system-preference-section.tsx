"use client";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const THEME_OPTIONS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

export function SystemPreferenceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">System Preference</CardTitle>
        <CardDescription>
          Sesuaikan tampilan dan preferensi sistem aplikasi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Appearance row */}
        <div className="flex items-center justify-between gap-6 py-4">
          <div>
            <p className="text-sm font-medium">Tema Warna</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pilih tema terang, gelap, atau ikuti sistem</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-label={value}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all",
                  theme === value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Dark mode quick toggle */}
        <div className="flex items-center justify-between gap-6 py-4">
          <div>
            <p className="text-sm font-medium leading-tight">Mode Gelap</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle cepat terang / gelap
            </p>
          </div>
          <Switch
            id="dark-mode-switch"
            checked={theme === "dark"}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
