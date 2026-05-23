"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePassword } from "@/actions/auth-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (state?.error) {
      toast.error("Gagal", { description: state.error });
    }
  }, [state]);

  return (
    <div className="bg-surface-dark-elevated border border-white/10 rounded-card p-8">
      <h2 className="text-xl font-normal text-white mb-1">Reset Password</h2>
      <p className="text-white/50 text-sm mb-6">
        Buat password baru untuk akun Anda.
      </p>

      <form action={formAction} method="POST" className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-white/70 text-sm font-medium"
          >
            Password Baru
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
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
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-white/70 text-sm font-medium"
          >
            Konfirmasi Password Baru
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password baru"
              required
              minLength={8}
              className="pl-10 pr-10 bg-surface-dark border-white/15 text-white placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
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
              Menyimpan...
            </>
          ) : (
            "Simpan Password Baru"
          )}
        </Button>
      </form>
    </div>
  );
}
