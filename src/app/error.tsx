"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { dict } = useTranslation();

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
          <p className="text-sm font-semibold text-primary">
            {dict.errorPage.badge}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {dict.errorPage.title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {dict.errorPage.description}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-full">
            {dict.errorPage.backButton}
          </Button>
          <Button type="button" onClick={reset} className="rounded-full bg-primary text-primary-foreground hover:bg-[#003ecc]">
            {dict.errorPage.reloadButton}
          </Button>
        </div>
      </div>
    </main>
  );
}
