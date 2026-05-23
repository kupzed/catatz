"use client";

import {
  useActionState,
  useEffect,
  useState,
  Suspense,
  useTransition,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signInWithGoogle } from "@/actions/auth-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGooglePending, startGoogleTransition] = useTransition();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const handleGoogleLogin = () => {
    startGoogleTransition(async () => {
      const res = await signInWithGoogle();
      if (res?.error) {
        toast.error("Google login gagal", { description: res.error });
      } else if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    });
  };

  useEffect(() => {
    if (state?.error) {
      toast.error("Login gagal", { description: state.error });
    }
  }, [state]);

  useEffect(() => {
    if (message === "reset-success") {
      toast.success("Berhasil", {
        description: "Password berhasil diperbarui, silakan login.",
      });
    } else if (message === "auth-callback-failed") {
      toast.error("Gagal", {
        description: "Link tidak valid atau kadaluarsa.",
      });
    } else if (message === "session-revoked") {
      toast.error("Sesi Berakhir", {
        description:
          "Sesi Anda telah diakhiri dari perangkat lain. Silakan login kembali.",
      });
    }
  }, [message]);

  return (
    <div className="bg-surface-dark-elevated border border-white/10 rounded-card p-8">
      <h2 className="text-xl font-normal text-white mb-1">
        Selamat datang kembali
      </h2>
      <p className="text-white/50 text-sm mb-6">Masuk ke akun CatatZ Anda</p>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isGooglePending || isPending}
        className="w-full bg-surface-dark-elevated border border-white/15 text-white hover:bg-white/5 hover:text-white h-11 mb-6 rounded-full"
      >
        {isGooglePending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
        )}
        Masuk dengan Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface-dark-elevated text-white/40">
            Atau
          </span>
        </div>
      </div>

      <form action={formAction} method="POST" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/70 text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              required
              className="pl-10 bg-surface-dark border-white/15 text-white placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-white/70 text-sm font-medium"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              className="pl-10 pr-10 bg-surface-dark border-white/15 text-white placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-[#003ecc] text-white font-semibold h-11 mt-2 rounded-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Masuk...
            </>
          ) : (
            "Masuk"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-white/40 mt-6">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface-dark-elevated border border-white/10 rounded-card p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
