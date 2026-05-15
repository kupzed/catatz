"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-md border border-amber-300/60 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-950 shadow-lg shadow-black/10 transition-all duration-300 ease-out dark:border-amber-400/30 dark:bg-amber-500 dark:text-slate-950 ${
        isOnline
          ? "pointer-events-none translate-y-6 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Tidak ada koneksi internet. Data baru membutuhkan koneksi.</span>
    </div>
  );
}
