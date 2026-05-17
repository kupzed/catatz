"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop } from "lucide-react";

export function ActiveSessionsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Active Sessions</CardTitle>
        <CardDescription>
          Sesi aktif perangkat Anda yang terhubung dengan CatatZ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 py-3 px-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Perangkat Saat Ini</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Session sedang aktif
              </p>
            </div>
          </div>
          <div className="shrink-0 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
            Active
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
