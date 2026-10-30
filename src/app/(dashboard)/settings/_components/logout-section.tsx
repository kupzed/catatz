"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { signOut } from "@/actions/auth-action";
import { useTranslation } from "@/i18n/use-translation";

export function LogoutSection() {
  const { dict } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{dict.settings.logout.title}</CardTitle>
        <CardDescription>
          {dict.settings.logout.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {dict.settings.logout.infoText}
          </p>
          <ConfirmDialog
            title={dict.settings.logout.confirmTitle}
            description={dict.settings.logout.confirmDesc}
            confirmText={dict.settings.logout.confirmButton}
            cancelText={dict.common.cancel}
            onConfirm={() => signOut()}
          >
            <Button variant="outline" className="w-full sm:w-auto gap-2 border-border/50">
              <LogOut className="w-4 h-4" />
              {dict.settings.logout.button}
            </Button>
          </ConfirmDialog>
        </div>
      </CardContent>
    </Card>
  );
}
