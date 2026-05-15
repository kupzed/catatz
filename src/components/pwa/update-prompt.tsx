"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/components/pwa/sw-provider";

export function UpdatePrompt() {
  const { isUpdateAvailable, triggerUpdate } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isUpdateAvailable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 animate-in slide-in-from-top-3 duration-300">
      <div className="flex items-center justify-between gap-3 border-b border-indigo-500/20 bg-background/95 px-4 py-2 text-sm shadow-sm backdrop-blur">
        <span className="font-medium text-foreground">Versi baru tersedia!</span>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" size="sm" onClick={triggerUpdate}>
            Perbarui Sekarang
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsDismissed(true)}>
            Nanti
          </Button>
        </div>
      </div>
    </div>
  );
}
