"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";

/**
 * BreadcrumbTitleProvider (Optional pass-through for layout backwards-compatibility)
 * State is managed cleanly by Zustand via useBreadcrumbStore.
 */
export function BreadcrumbTitleProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Hook untuk membaca custom title breadcrumb (digunakan oleh DashboardBreadcrumb).
 */
export function useBreadcrumbTitle(): { title: string | null } {
  const pathname = usePathname();
  const customTitle = useBreadcrumbStore((s) =>
    s.path === pathname ? s.customTitle : null,
  );
  return { title: customTitle };
}

/**
 * Hook untuk mengeset custom title breadcrumb dari halaman/komponen client.
 * Tidak men-subscribe ke state sehingga tidak memicu cascading renders / infinite loop.
 */
export function useSetBreadcrumbTitle(title?: string | null) {
  const pathname = usePathname();
  const setBreadcrumbTitle = useBreadcrumbStore((s) => s.setBreadcrumbTitle);

  useEffect(() => {
    if (title) {
      setBreadcrumbTitle(title, pathname);
    }
  }, [title, pathname, setBreadcrumbTitle]);
}
