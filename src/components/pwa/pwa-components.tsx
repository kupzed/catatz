"use client";

import { InstallBanner } from "@/components/pwa/install-banner";
import { IOSInstallGuide } from "@/components/pwa/ios-install-guide";
import { UpdatePrompt } from "@/components/pwa/update-prompt";

export function PWAComponents() {
  return (
    <>
      <InstallBanner />
      <IOSInstallGuide />
      <UpdatePrompt />
    </>
  );
}
