"use client";

import { getExportCount, getExportData } from "@/actions/export-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ExportFormat = "pdf" | "xlsx" | "csv";

export function ExportSection() {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(
    null,
  );
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [filter, setFilter] = useState<{ dari: string; sampai: string }>({
    dari: "",
    sampai: "",
  });

  useEffect(() => {
    let ignore = false;

    const fetchCount = async () => {
      const res = await getExportCount();
      if (!ignore && res.success && res.data) {
        setExportCount(res.data.count);
      }
    };

    fetchCount();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleExport(format: ExportFormat) {
    setLoadingFormat(format);
    try {
      const exportFilter =
        filter.dari || filter.sampai
          ? {
              dari: filter.dari || undefined,
              sampai: filter.sampai || undefined,
            }
          : undefined;

      const res = await getExportData(exportFilter);
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Gagal mengambil data");
        return;
      }
      if (res.data.transaksi.length === 0) {
        toast.info("Tidak ada transaksi untuk diexport");
        return;
      }

      const userName = res.data.userName;

      if (format === "pdf") {
        const { generatePDF } = await import("@/lib/pdf-generator");
        await generatePDF(res.data.transaksi, res.data.summary, userName);
      } else if (format === "xlsx") {
        const { generateXLSX } = await import("@/lib/spreadsheet-generator");
        await generateXLSX(res.data.transaksi, res.data.summary, userName);
      } else {
        const { generateCSV } = await import("@/lib/spreadsheet-generator");
        generateCSV(res.data.transaksi);
      }

      toast.success(
        `${format.toUpperCase()} berhasil dibuat - ${
          res.data.transaksi.length
        } transaksi`,
      );
    } catch (err) {
      toast.error(`Gagal membuat ${format.toUpperCase()}`);
      console.error(err);
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export Data</CardTitle>
        <CardDescription>
          Download laporan transaksi keuangan Anda dalam format PDF, XLSX, atau
          CSV.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label htmlFor="dari" className="text-sm font-medium">
                Dari Tanggal
              </Label>
              <Input
                id="dari"
                type="date"
                className="w-full appearance-none bg-background border-input"
                value={filter.dari}
                onChange={(e) => setFilter({ ...filter, dari: e.target.value })}
              />
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label htmlFor="sampai" className="text-sm font-medium">
                Sampai Tanggal
              </Label>
              <Input
                id="sampai"
                type="date"
                className="w-full appearance-none bg-background border-input"
                value={filter.sampai}
                onChange={(e) =>
                  setFilter({ ...filter, sampai: e.target.value })
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Kosongkan untuk export semua transaksi
          </p>
        </div>

        <div className="bg-surface-soft rounded-input p-4 flex flex-col gap-1 text-sm border border-hairline">
          <p className="font-medium">
            {exportCount ?? "..."} transaksi siap diexport
          </p>
          <p className="text-muted-foreground">
            Periode:{" "}
            {filter.dari || filter.sampai
              ? `${filter.dari || "Awal"} - ${filter.sampai || "Sekarang"}`
              : "Semua waktu"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            PDF dan XLSX berisi ringkasan keuangan. CSV berisi rincian
            transaksi untuk import data.
          </p>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
            <Button
              onClick={() => handleExport("pdf")}
              disabled={loadingFormat !== null}
              className="w-full gap-2 rounded-full h-11"
            >
              {loadingFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {loadingFormat === "pdf" ? "Membuat..." : "Export PDF"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={loadingFormat !== null}
              className="w-full gap-2 rounded-full h-11"
            >
              {loadingFormat === "xlsx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {loadingFormat === "xlsx" ? "Membuat..." : "Export XLSX"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("csv")}
              disabled={loadingFormat !== null}
              className="w-full gap-2 rounded-full h-11"
            >
              {loadingFormat === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loadingFormat === "csv" ? "Membuat..." : "Export CSV"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
