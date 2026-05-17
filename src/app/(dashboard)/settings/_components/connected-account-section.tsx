"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2Off } from "lucide-react";

export function ConnectedAccountSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connected Account</CardTitle>
        <CardDescription>
          Kelola akun pihak ketiga yang terhubung dengan CatatZ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg border border-dashed border-border">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Link2Off className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-sm">Belum ada akun terhubung</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
            Fitur integrasi akun pihak ketiga belum tersedia saat ini.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
