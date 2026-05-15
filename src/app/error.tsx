"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[app-error] CatatZ route crashed", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="max-w-md space-y-5">
        <Image
          src="/catatz.svg"
          alt="CatatZ"
          width={64}
          height={64}
          className="mx-auto h-16 w-16 rounded-full"
        />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Ada yang tidak beres
          </p>
          <h1 className="text-2xl font-bold text-foreground">Halaman gagal dimuat</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Coba muat ulang halaman. Jika masih gagal, kembali ke halaman sebelumnya.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Kembali
          </Button>
          <Button type="button" onClick={reset} className="bg-indigo-600 text-white hover:bg-indigo-500">
            Muat Ulang Halaman
          </Button>
        </div>
      </div>
    </main>
  );
}
