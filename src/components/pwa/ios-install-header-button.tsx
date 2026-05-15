"use client";

import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  openIOSInstallGuideEvent,
} from "@/components/pwa/ios-install-guide";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export function IOSInstallHeaderButton() {
  const { isIOSSafari, isInstalled } = usePWAInstall();

  if (!isIOSSafari || isInstalled) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Pasang CatatZ ke layar utama"
          onClick={() => window.dispatchEvent(new Event(openIOSInstallGuideEvent))}
          className="relative h-8 w-8"
        >
          <Share className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-background" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Pasang ke layar utama</TooltipContent>
    </Tooltip>
  );
}
