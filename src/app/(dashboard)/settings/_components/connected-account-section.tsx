"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  linkGoogleIdentity,
  unlinkGoogleIdentity,
} from "@/actions/auth-action";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Link2Off,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export type ConnectedAccount = {
  provider: string;
  email: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

type Props = {
  accounts: ConnectedAccount[];
  primaryEmail: string;
  providers?: string[];
};

function GoogleIcon() {
  return (
    <svg
      className="h-4 w-4"
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 488 512"
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  );
}

export function ConnectedAccountSection({
  accounts,
  primaryEmail,
  providers = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLinkPending, startLinkTransition] = useTransition();
  const [isUnlinkPending, startUnlinkTransition] = useTransition();

  const googleAccount = accounts.find(
    (account) => account.provider === "google",
  );
  const hasGoogleProvider =
    Boolean(googleAccount) || providers.includes("google");
  const canUnlinkGoogle =
    hasGoogleProvider &&
    (accounts.length > 1 ||
      providers.some((provider) => provider !== "google"));

  useEffect(() => {
    const message = searchParams.get("message");

    if (!message?.startsWith("google-link")) {
      return;
    }

    if (message === "google-linked") {
      toast.success("Akun Google berhasil terhubung.");
    } else if (message === "google-link-email-mismatch") {
      toast.error("Akun Google tidak dihubungkan", {
        description: "Email Google berbeda dari email utama akun CatatZ Anda.",
      });
    } else if (message === "google-link-cleanup-failed") {
      toast.error("Koneksi Google perlu ditinjau", {
        description:
          "Email Google berbeda, tetapi koneksi belum bisa dibatalkan otomatis.",
      });
    } else {
      toast.error("Gagal menghubungkan akun Google", {
        description:
          "Pastikan provider Google dan Manual Linking aktif di Supabase.",
      });
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("message");
    const query = params.toString();
    const nextUrl = query ? `/settings?${query}` : "/settings";
    router.replace(nextUrl, { scroll: false });
  }, [router, searchParams]);

  function handleLinkGoogle() {
    startLinkTransition(async () => {
      const res = await linkGoogleIdentity();

      if (res.error) {
        toast.error("Gagal menghubungkan akun Google", {
          description: res.error,
        });
        return;
      }

      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }

      toast.success(res.message || "Akun Google sudah terhubung.");
      router.refresh();
    });
  }

  function handleUnlinkGoogle() {
    startUnlinkTransition(async () => {
      const res = await unlinkGoogleIdentity();

      if (res.error) {
        toast.error("Gagal memutuskan akun Google", {
          description: res.error,
        });
        return;
      }

      toast.success(res.message || "Akun Google berhasil diputuskan.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Akun Terhubung</CardTitle>
        <CardDescription>
          Kelola metode login pihak ketiga yang tersambung dengan CatatZ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 rounded-input border border-hairline bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-foreground">
              <GoogleIcon />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium leading-none">Google</h3>
                {hasGoogleProvider ? (
                  <Badge
                    variant="outline"
                    className="border-0 bg-semantic-up/10 text-semantic-up rounded-full"
                  >
                    Terhubung
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted/30">
                    Belum terhubung
                  </Badge>
                )}
              </div>
              <p className="break-all text-xs text-muted-foreground">
                {googleAccount?.email ||
                  (hasGoogleProvider ? primaryEmail : "Belum ada akun Google")}
              </p>
            </div>
          </div>

          {hasGoogleProvider ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnlinkGoogle}
              disabled={!canUnlinkGoogle || isUnlinkPending}
              title={
                canUnlinkGoogle
                  ? "Putuskan akun Google"
                  : "Tambahkan metode login lain sebelum memutuskan Google"
              }
              className="rounded-full border border-hairline text-foreground"
            >
              {isUnlinkPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2Off className="h-3.5 w-3.5" />
              )}
              Putuskan
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleLinkGoogle}
              disabled={isLinkPending}
              className="bg-primary text-white hover:bg-[#003ecc] rounded-full"
            >
              {isLinkPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              Hubungkan
            </Button>
          )}
        </div>

        {hasGoogleProvider ? (
          <div className="flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              Akun Google ini dapat dipakai untuk masuk ke CatatZ bersama metode
              login lain yang masih aktif.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              Hubungkan Google dengan email yang sama seperti{" "}
              <span className="font-medium">{primaryEmail}</span> agar identity
              tersambung ke akun CatatZ ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
