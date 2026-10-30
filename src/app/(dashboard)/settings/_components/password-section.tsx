"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { changePassword } from "@/actions/profile-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/use-translation";
import type { Dictionary } from "@/i18n/types";

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

const createPasswordSchema = (dict: Dictionary) =>
  z
    .object({
      currentPassword: z.string().min(1, dict.settings.password.validation.currentRequired),
      newPassword: z.string().min(8, dict.settings.password.validation.newMinLength).max(100),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: dict.settings.password.validation.confirmMismatch,
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: dict.settings.password.validation.mustDiffer,
      path: ["newPassword"],
    });

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

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
  const { dict } = useTranslation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const providers = profile?.providers || [];
  const isGoogleProvider = providers.includes("google");
  const isEmailProvider = providers.includes("email");
  const isGoogleOnly = isGoogleProvider && !isEmailProvider;

  const schema = useMemo(() => createPasswordSchema(dict), [dict]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = useWatch({ control, name: "newPassword" }) || "";

  const onSubmit = async (values: FormValues) => {
    const res = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (res.success) {
      toast.success(res.message || dict.settings.password.toasts.success);
      reset();
    } else {
      toast.error(res.error || dict.settings.password.toasts.error);
    }
  };

  const getStrength = (pwd: string) => {
    if (!pwd || pwd.length < 8)
      return {
        label: dict.settings.password.strengthWeak,
        width: "w-1/3",
        color: "bg-semantic-down",
        textColor: "text-semantic-down",
      };
    if (pwd.length >= 12 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return {
        label: dict.settings.password.strengthStrong,
        width: "w-full",
        color: "bg-semantic-up",
        textColor: "text-semantic-up",
      };
    }
    return {
      label: dict.settings.password.strengthMedium,
      width: "w-2/3",
      color: "bg-[#f4b000]",
      textColor: "text-[#f4b000]",
    };
  };

  const strength = getStrength(newPasswordValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{dict.settings.password.title}</CardTitle>
        <CardDescription>
          {dict.settings.password.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <SettingRow
          label={dict.settings.password.registeredEmailLabel}
          description={dict.settings.password.registeredEmailDesc}
        >
          <Input
            value={profile?.email || ""}
            readOnly
            className="text-sm h-9 bg-muted/50"
          />
        </SettingRow>

        <Separator />

        <SettingRow
          label={dict.settings.password.activeMethodsLabel}
          description={dict.settings.password.activeMethodsDesc}
        >
          <div className="flex flex-wrap gap-2">
            {isEmailProvider && (
              <Badge variant="outline" className="bg-muted/30">
                {dict.settings.password.emailPasswordBadge}
              </Badge>
            )}
            {isGoogleProvider && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {dict.settings.password.googleBadge}
              </Badge>
            )}
            {!isEmailProvider && !isGoogleProvider && (
              <span className="text-sm text-muted-foreground">
                {dict.settings.password.unknownMethod}
              </span>
            )}
          </div>
        </SettingRow>

        <Separator />

        {isGoogleOnly ? (
          <div className="py-6">
            <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium leading-none">{dict.settings.password.googleOnlyTitle}</p>
                <p className="text-sm opacity-90 leading-relaxed mt-1.5">
                  {dict.settings.password.googleOnlyDesc}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
            <SettingRow
              label={dict.settings.password.currentPasswordLabel}
              description={dict.settings.password.currentPasswordDesc}
            >
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    {...register("currentPassword")}
                    type={showCurrent ? "text" : "password"}
                    placeholder={dict.settings.password.currentPasswordPlaceholder}
                    className="text-sm h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-500">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>
            </SettingRow>

            <Separator />

            <SettingRow
              label={dict.settings.password.newPasswordLabel}
              description={dict.settings.password.newPasswordDesc}
            >
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    {...register("newPassword")}
                    type={showNew ? "text" : "password"}
                    placeholder={dict.settings.password.newPasswordPlaceholder}
                    className="text-sm h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-500">
                    {errors.newPassword.message}
                  </p>
                )}

                {newPasswordValue.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{dict.settings.password.strengthLabel}</span>
                      <span
                        className={`font-medium ${strength.color.replace("bg-semantic-down", "text-semantic-down").replace("bg-semantic-up", "text-semantic-up").replace("bg-[#f4b000]", "text-[#f4b000]").replace("bg-red-500", "text-red-500").replace("bg-green-500", "text-green-500").replace("bg-yellow-500", "text-yellow-500")}`}
                      >
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-strong rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.width} ${strength.color} rounded-full`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </SettingRow>

            <Separator />

            <SettingRow
              label={dict.settings.password.confirmPasswordLabel}
              description={dict.settings.password.confirmPasswordDesc}
            >
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder={dict.settings.password.confirmPasswordPlaceholder}
                    className="text-sm h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </SettingRow>

            <Separator />

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-active text-white rounded-full h-11 px-5"
              >
                {isSubmitting ? dict.settings.password.savingButton : dict.settings.password.saveButton}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
