"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  pwaInstallAcceptedEvent,
  usePWAInstall,
} from "@/hooks/use-pwa-install";

export function InstallBanner() {
  const {
    isInstallable,
    isInstalled,
    hasBeenDismissed,
    promptInstall,
    dismissPrompt,
  } = usePWAInstall();
  const [isPrompting, setIsPrompting] = useState(false);

  const shouldShow = isInstallable && !isInstalled && !hasBeenDismissed;

  if (!shouldShow) {
    return null;
  }

  const handleInstall = async () => {
    setIsPrompting(true);
    let successShown = false;
    const showSuccessToast = () => {
      successShown = true;
      toast.success("CatatZ berhasil dipasang.");
    };

    try {
      window.addEventListener(pwaInstallAcceptedEvent, showSuccessToast, { once: true });
      await promptInstall();
    } catch (error) {
      window.removeEventListener(pwaInstallAcceptedEvent, showSuccessToast);
      console.error("[pwa] Install prompt failed", error);
      toast.error("Gagal membuka prompt instalasi.");
    } finally {
      if (!successShown) {
        window.removeEventListener(pwaInstallAcceptedEvent, showSuccessToast);
      }
      setIsPrompting(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-3 border-t border-hairline bg-background/95 px-4 py-3 text-foreground shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-center sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Image
            src="/catatz.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
            className="h-4 w-4 shrink-0 rounded-full"
          />
          <span className="text-body font-normal">Pasang CatatZ di layar utama untuk akses lebih cepat!</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            onClick={handleInstall}
            disabled={isPrompting}
            variant="default"
          >
            {isPrompting ? "Membuka..." : "Pasang Sekarang"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={dismissPrompt}
          >
            Nanti
          </Button>
        </div>
      </div>
    </div>
  );
}
