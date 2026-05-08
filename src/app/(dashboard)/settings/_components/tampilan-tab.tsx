"use client";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

export function TampilanTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-0">
      <h2 className="text-sm font-semibold text-indigo-500 mb-2">Tampilan</h2>

      {/* Appearance row */}
      <div className="flex items-center justify-between gap-6 py-4">
        <p className="text-sm font-medium">Tema Warna</p>
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
    </div>
  );
}
