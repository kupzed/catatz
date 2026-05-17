"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function DeleteAccountSection() {
  return (
    <Card className="border-rose-500/20">
      <CardHeader>
        <CardTitle className="text-lg text-rose-600 dark:text-rose-500">Delete Account</CardTitle>
        <CardDescription>
          Hapus akun Anda secara permanen dari sistem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Semua data transaksi, rekening, dan pengaturan Anda akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
          <Button variant="destructive" className="w-full sm:w-auto gap-2" disabled>
            <AlertTriangle className="w-4 h-4" />
            Hapus Akun (Segera Hadir)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
