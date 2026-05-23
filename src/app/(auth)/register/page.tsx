"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp, signInWithGoogle } from "@/actions/auth-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [isGooglePending, startGoogleTransition] = useTransition();

  const handleGoogleLogin = () => {
    startGoogleTransition(async () => {
      const res = await signInWithGoogle();
      if (res?.error) {
        toast.error("Daftar via Google gagal", { description: res.error });
      } else if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    });
  };

  const getStrength = (pwd: string) => {
    if (!pwd || pwd.length < 8)
      return {
        label: "Lemah",
        width: "w-1/3",
        color: "bg-semantic-down",
        textColor: "text-semantic-down",
      };
    if (pwd.length >= 12 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return {
        label: "Kuat",
        width: "w-full",
        color: "bg-semantic-up",
        textColor: "text-semantic-up",
      };
    }
    return {
      label: "Sedang",
      width: "w-2/3",
      color: "bg-[#f4b000]",
      textColor: "text-[#f4b000]",
    };
  };

  const strength = getStrength(passwordValue);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await signUp(formData);
    if (result.error) {
      toast.error("Pendaftaran gagal", { description: result.error });
      setLoading(false);
    } else {
      toast.success(result.message);
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="bg-surface-dark-elevated border border-white/10 rounded-card p-8 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-normal text-white mb-2">Cek Email Anda</h2>
        <p className="text-white/50 text-sm">
          Kami telah mengirim link verifikasi ke email Anda. Silakan klik link
          tersebut untuk mengaktifkan akun.
        </p>
        <Link href="/login">
          <Button className="mt-6 bg-primary hover:bg-[#003ecc] text-white w-full rounded-full font-semibold h-11">
            Ke Halaman Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark-elevated border border-white/10 rounded-card p-8">
      <h2 className="text-xl font-normal text-white mb-1">Buat akun baru</h2>
      <p className="text-white/50 text-sm mb-6">
        Mulai catat keuangan Anda hari ini
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isGooglePending || loading}
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
        Daftar dengan Google
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/70 text-sm font-medium">
            Nama Lengkap
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nama Anda"
              required
              className="pl-10 bg-surface-dark border-white/15 text-white placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

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
              placeholder="Minimal 6 karakter"
              minLength={6}
              required
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
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
          {passwordValue.length > 0 && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Kekuatan:</span>
                <span className={`font-medium ${strength.textColor}`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-dark rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.width} ${strength.color} rounded-full`}
                />
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-[#003ecc] text-white font-semibold h-11 mt-2 rounded-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mendaftar...
            </>
          ) : (
            "Daftar"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-white/40 mt-6">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
