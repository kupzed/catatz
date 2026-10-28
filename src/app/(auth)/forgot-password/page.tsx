"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { resetPasswordRequest } from "@/actions/auth-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";

export default function ForgotPasswordPage() {
  const { dict } = useTranslation();
  const [state, formAction, isPending] = useActionState(
    resetPasswordRequest,
    null,
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(dict.toast.error, { description: state.error });
    }
    if (state?.success && state?.message) {
      toast.success(dict.auth.forgotPassword.sentSuccessTitle, { description: state.message });
    }
  }, [state, dict]);

  return (
    <div className="bg-card dark:bg-surface-dark-elevated border border-border dark:border-white/10 rounded-card p-8">
      <Link
        href="/login"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {dict.auth.forgotPassword.backToLogin}
      </Link>

      <h2 className="text-xl font-normal text-foreground mb-1">
        {dict.auth.forgotPassword.title}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {dict.auth.forgotPassword.subtitle}
      </p>

      <form action={formAction} method="POST" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground text-sm font-medium">
            {dict.auth.forgotPassword.emailLabel}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={dict.auth.forgotPassword.emailPlaceholder}
              required
              className="pl-10 bg-background dark:bg-surface-dark border-border dark:border-white/15 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending || state?.success}
          className="w-full bg-primary hover:bg-primary-active text-white font-semibold h-11 mt-2 rounded-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {dict.auth.forgotPassword.submitting}
            </>
          ) : (
            dict.auth.forgotPassword.submit
          )}
        </Button>
      </form>
    </div>
  );
}
