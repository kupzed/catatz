"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth-action";
import { createClient } from "@/configs/supabase/client";
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
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/transaksi`,
        },
      });
      
      if (error) {
        toast.error("Daftar via Google gagal", { description: error.message });
      }
    });
  };

  const getStrength = (pwd: string) => {
    if (!pwd || pwd.length < 8)
      return { label: "Lemah", width: "w-1/3", color: "bg-red-500" };
    if (pwd.length >= 12 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { label: "Kuat", width: "w-full", color: "bg-green-500" };
    }
    return { label: "Sedang", width: "w-2/3", color: "bg-yellow-500" };
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Cek Email Anda
        </h2>
        <p className="text-slate-400 text-sm">
          Kami telah mengirim link verifikasi ke email Anda. Silakan klik link
          tersebut untuk mengaktifkan akun.
        </p>
        <Link href="/login">
          <Button className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white w-full">
            Ke Halaman Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-1">Buat akun baru</h2>
      <p className="text-slate-400 text-sm mb-6">
        Mulai catat keuangan Anda hari ini
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isGooglePending || loading}
        className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-11 mb-6"
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
          <span className="px-2 bg-[#1a1f36] text-slate-400">Atau</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300">
            Nama Lengkap
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nama Anda"
              required
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              required
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              minLength={6}
              required
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
                <span className="text-slate-400">Kekuatan:</span>
                <span
                  className={`font-medium ${strength.color.replace("bg-", "text-")}`}
                >
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${strength.width} ${strength.color}`}
                />
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-11 mt-2 transition-all duration-200"
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

      <p className="text-center text-sm text-slate-500 mt-6">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
