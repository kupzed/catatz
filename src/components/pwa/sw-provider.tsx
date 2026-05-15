"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useServiceWorkerRegistration } from "@/lib/sw-register";

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export interface PWAContextValue {
  isOnline: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  triggerUpdate: () => void;
}

const PWAContext = createContext<PWAContextValue | null>(null);

function getInstalledStatus() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function usePWA() {
  const context = useContext(PWAContext);

  if (!context) {
    throw new Error("usePWA must be used inside SwProvider");
  }

  return context;
}

export function SwProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { isUpdateAvailable, triggerUpdate } = useServiceWorkerRegistration();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const handleInstalledStatusChange = () => {
      setIsInstalled(getInstalledStatus());
    };

    handleInstalledStatusChange();
    standaloneQuery.addEventListener("change", handleInstalledStatusChange);

    return () => {
      standaloneQuery.removeEventListener("change", handleInstalledStatusChange);
    };
  }, []);

  const value = useMemo<PWAContextValue>(
    () => ({
      isOnline,
      isInstalled,
      isUpdateAvailable,
      triggerUpdate,
    }),
    [isOnline, isInstalled, isUpdateAvailable, triggerUpdate],
  );

  return (
    <PWAContext.Provider value={value}>
      {children}
      {isUpdateAvailable && (
        <div className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-md border border-indigo-300/60 bg-white px-4 py-3 text-sm text-slate-900 shadow-lg shadow-black/10 dark:border-indigo-400/30 dark:bg-slate-900 dark:text-slate-50">
          <span className="font-medium">Update CatatZ tersedia.</span>
          <button
            type="button"
            onClick={triggerUpdate}
            className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            Perbarui
          </button>
        </div>
      )}
    </PWAContext.Provider>
  );
}
