"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { signOut } from "@/actions/auth-action";

export function LogoutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Logout Account</CardTitle>
        <CardDescription>
          Keluar dari akun ini di perangkat saat ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Anda akan diminta untuk login kembali untuk mengakses data.
          </p>
          <ConfirmDialog
            title="Logout dari akun?"
            description="Anda akan keluar dari akun CatatZ di perangkat ini."
            onConfirm={() => signOut()}
          >
            <Button variant="outline" className="w-full sm:w-auto gap-2 border-border/50">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </ConfirmDialog>
        </div>
      </CardContent>
    </Card>
  );
}
