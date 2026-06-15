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
    <div
      role="status"
      aria-live="polite"
      data-slot="pwa-update-prompt"
      className="fixed inset-x-0 top-0 z-[60] animate-in border-b border-hairline bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur slide-in-from-top-3 duration-300"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 py-2 pl-[calc(0.75rem+env(safe-area-inset-left))] pr-[calc(0.75rem+env(safe-area-inset-right))]">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground sm:text-sm">
          Versi baru tersedia!
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            onClick={triggerUpdate}
            className="h-9 px-3 text-xs sm:px-4 sm:text-sm"
          >
            Perbarui Sekarang
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-9 px-2 text-xs sm:px-4 sm:text-sm"
          >
            Nanti
          </Button>
        </div>
      </div>
    </div>
  );
}
