import type { Metadata } from "next";
import Image from "next/image";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Autentikasi",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Image src="/catatz.svg" alt="CatatZ Logo" width={40} height={40} />
            <span className="text-2xl font-semibold text-white">
              CatatZ
            </span>
          </div>
          <p className="text-white/50 text-sm">
            Pencatatan keuangan pribadi yang cerdas
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
