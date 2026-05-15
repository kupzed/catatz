"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { changePassword } from "@/actions/profile-action";

const schema = z.object({
  currentPassword: z.string().min(1, "Password lama harus diisi"),
  newPassword: z.string().min(8, "Password minimal 8 karakter").max(100),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"]
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

export function KeamananTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const newPasswordValue = useWatch({ control, name: "newPassword" });

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
    <div className="space-y-0">
      <h2 className="text-sm font-semibold text-indigo-500 mb-2">Keamanan</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
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

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {isSubmitting ? "Memperbarui..." : "Perbarui Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
