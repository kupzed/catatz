"use client";

import { useCallback, useEffect, useState } from "react";
import { type ReactNode } from "react";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePWAInstall } from "@/hooks/use-pwa-install";

const guideSeenStorageKey = "catatz_ios_install_guide_seen";
export const openIOSInstallGuideEvent = "catatz:open-ios-install-guide";

function ShareIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
      <path
        d="M16 4v16m0-16 5 5m-5-5-5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M9 13H7.5A2.5 2.5 0 0 0 5 15.5v9A2.5 2.5 0 0 0 7.5 27h17a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 24.5 13H23"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function AddToHomeIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
      <rect
        x="6"
        y="6"
        width="20"
        height="20"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="M16 11v10m-5-5h10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
      <circle
        cx="16"
        cy="16"
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="m10.5 16.5 3.8 3.8 7.8-8.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

const steps = [
  {
    icon: <ShareIcon />,
    text: "Ketuk tombol Share, ikon kotak dengan panah ke atas.",
  },
  {
    icon: <AddToHomeIcon />,
    text: 'Pilih "Add to Home Screen" atau "Tambahkan ke Layar Utama".',
  },
  {
    icon: <CheckIcon />,
    text: 'Ketuk "Add" atau "Tambahkan" di pojok kanan atas.',
  },
] satisfies Array<{ icon: ReactNode; text: string }>;

function getGuideSeen() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(guideSeenStorageKey) === "true";
}

export function IOSInstallGuide() {
  const { isIOSSafari, isInstalled } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHasSeenGuide(getGuideSeen());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const openGuide = () => {
      if (isIOSSafari && !isInstalled) {
        setIsOpen(true);
      }
    };

    window.addEventListener(openIOSInstallGuideEvent, openGuide);

    return () => {
      window.removeEventListener(openIOSInstallGuideEvent, openGuide);
    };
  }, [isIOSSafari, isInstalled]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const handleUnderstood = () => {
    window.localStorage.setItem(guideSeenStorageKey, "true");
    setHasSeenGuide(true);
    setIsOpen(false);
  };

  if (!isIOSSafari || isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="default"
        aria-label="Buka panduan pasang CatatZ"
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-16 z-50 h-10 w-10 shadow-lg shadow-primary/20"
      >
        <Share className="h-4 w-4" />
        {!hasSeenGuide && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-card"
        >
          <SheetHeader>
            <SheetTitle>Tambahkan ke Layar Utama</SheetTitle>
            <SheetDescription>
              Nikmati CatatZ seperti aplikasi native, tanpa install dari App
              Store.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-2">
            <div className="relative mb-4 overflow-hidden rounded-lg border border-border bg-muted/40 p-4">
              <div className="mx-auto h-44 max-w-55 rounded-[1.75rem] border-4 border-slate-700 bg-slate-950 p-3 shadow-inner dark:border-slate-600">
                <div className="h-full rounded-[1.2rem] bg-linear-to-b from-slate-800 to-slate-950 p-3">
                  <div className="h-5 w-20 rounded-full bg-slate-700" />
                  <div className="mt-5 h-16 rounded-lg bg-primary/20" />
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-md bg-slate-700/80"
                      />
                    ))}
                  </div>
                  <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-primary">
                    <span className="h-8 w-px animate-pulse bg-primary" />
                    <span className="h-3 w-3 animate-bounce rotate-45 border-b-2 border-r-2 border-primary" />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
                Contoh posisi tombol Share di Safari iPhone.
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.text}
                  className="grid grid-cols-[2rem_2.75rem_1fr] items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-primary">{step.icon}</span>
                  <p className="m-0 text-sm leading-6 text-foreground">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button
                type="button"
                onClick={handleUnderstood}
                className="w-full"
              >
                Mengerti
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
