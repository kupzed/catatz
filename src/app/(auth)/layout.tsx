import type { Metadata } from "next";
import Image from "next/image";
import { ReactNode } from "react";
import { DarkmodeToggle } from "@/components/common/darkmode-toggle";

export const metadata: Metadata = {
  title: "Autentikasi",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background dark:bg-surface-dark">
      {/* Dark/Light mode toggle — fixed top-right, safe-area aware */}
      <div className="fixed top-4 right-4 z-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
        <DarkmodeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Image src="/catatz.svg" alt="CatatZ Logo" width={40} height={40} />
            <span className="text-2xl font-semibold text-foreground">
              CatatZ
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Pencatatan keuangan pribadi yang cerdas
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
