"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

export function ExportTab() {
  function handleExport(format: "csv" | "excel") {
    toast.info(`Export ${format.toUpperCase()} — segera hadir`);
  }

  return (
    <div className="space-y-0">
      <h2 className="text-sm font-semibold text-indigo-500 mb-2">
        Export Data
      </h2>

      {/* CSV row */}
      <div className="flex items-center justify-between gap-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">CSV</p>
            <p className="text-xs text-muted-foreground">
              Google Sheets, Numbers
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => handleExport("csv")}
          id="btn-export-csv"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      <Separator />

      {/* Excel row */}
      <div className="flex items-center justify-between gap-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">Excel</p>
            <p className="text-xs text-muted-foreground">
              Microsoft Excel (.xlsx)
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => handleExport("excel")}
          id="btn-export-excel"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground py-3">
        Hanya data transaksi milik akun Anda yang akan dieksport. Data
        rekening & hutang akan menyusul di update berikutnya.
      </p>
    </div>
  );
}
