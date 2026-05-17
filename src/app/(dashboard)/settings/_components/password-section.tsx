"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { changePassword } from "@/actions/profile-action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  providers?: string[];
};

type Props = {
  profile: Profile | null;
};

const schema = z.object({
  currentPassword: z.string().min(1, "Password lama harus diisi"),
  newPassword: z.string().min(8, "Password minimal 8 karakter").max(100),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"]
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "Password baru tidak boleh sama dengan password lama",
  path: ["newPassword"]
});

type FormValues = z.infer<typeof schema>;

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6 py-4">
      <div className="min-w-0 sm:pt-2">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0 w-full sm:w-64 max-w-full">{children}</div>
    </div>
  );
}

export function PasswordSection({ profile }: Props) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const providers = profile?.providers || [];
  const isGoogleProvider = providers.includes("google");
  const isEmailProvider = providers.includes("email");
  const isGoogleOnly = isGoogleProvider && !isEmailProvider;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const newPasswordValue = useWatch({ control, name: "newPassword" }) || "";

  const onSubmit = async (values: FormValues) => {
    const res = await changePassword({ 
      currentPassword: values.currentPassword,
      newPassword: values.newPassword 
    });
    if (res.success) {
      toast.success(res.message || "Password berhasil diperbarui");
      reset();
    } else {
      toast.error(res.error || "Gagal memperbarui password");
    }
  };

  const getStrength = (pwd: string) => {
    if (!pwd || pwd.length < 8) return { label: 'Lemah', width: 'w-1/3', color: 'bg-red-500' };
    if (pwd.length >= 12 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { label: 'Kuat', width: 'w-full', color: 'bg-green-500' };
    }
    return { label: 'Sedang', width: 'w-2/3', color: 'bg-yellow-500' };
  };

  const strength = getStrength(newPasswordValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Password & Authentication</CardTitle>
        <CardDescription>
          Kelola metode login dan keamanan password akun.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <SettingRow label="Email Terdaftar" description="Email utama akun Anda">
          <Input 
            value={profile?.email || ""} 
            readOnly 
            className="text-sm h-9 bg-muted/50" 
          />
        </SettingRow>

        <Separator />

        <SettingRow label="Metode Login Aktif" description="Otentikasi yang terhubung">
          <div className="flex flex-wrap gap-2">
            {isEmailProvider && (
              <Badge variant="outline" className="bg-muted/30">Email & Password</Badge>
            )}
            {isGoogleProvider && (
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Akun Google</Badge>
            )}
            {!isEmailProvider && !isGoogleProvider && (
              <span className="text-sm text-muted-foreground">Tidak diketahui</span>
            )}
          </div>
        </SettingRow>

        <Separator />

        {isGoogleOnly ? (
          <div className="py-6">
            <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium leading-none">Login via Google</p>
                <p className="text-sm opacity-90 leading-relaxed mt-1.5">
                  Anda mendaftar dan masuk menggunakan akun Google. Jika sewaktu-waktu Anda ingin login menggunakan password, Anda bisa mengaturnya melalui fitur <b>Lupa Password</b> di halaman depan.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
            <SettingRow label="Password Lama" description="Masukkan password saat ini">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    {...register("currentPassword")}
                    type={showCurrent ? "text" : "password"}
                    placeholder="Masukkan password lama"
                    className="text-sm h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
                )}
              </div>
            </SettingRow>

            <Separator />

            <SettingRow label="Password Baru" description="Minimal 8 karakter">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    {...register("newPassword")}
                    type={showNew ? "text" : "password"}
                    placeholder="Masukkan password baru"
                    className="text-sm h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-500">{errors.newPassword.message}</p>
                )}
                
                {newPasswordValue.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Kekuatan:</span>
                      <span className={`font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                      <div className={`h-full transition-all duration-300 ${strength.width} ${strength.color}`} />
                    </div>
                  </div>
                )}
              </div>
            </SettingRow>

            <Separator />

            <SettingRow label="Konfirmasi Password" description="Ketik ulang password baru">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ketik ulang password"
                    className="text-sm h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </SettingRow>

            <Separator />

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isSubmitting ? "Memperbarui..." : "Perbarui Password"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
