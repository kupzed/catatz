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
import { useTranslation } from "@/i18n/use-translation";

type ExportFormat = "pdf" | "xlsx" | "csv";

export function ExportSection() {
  const { dict } = useTranslation();
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
        toast.error(res.error ?? dict.settings.export.toasts.fetchFailed);
        return;
      }
      if (res.data.transaksi.length === 0) {
        toast.info(dict.settings.export.toasts.noTransactions);
        return;
      }

      const userName = res.data.userName;

      if (format === "pdf") {
        const { generatePDF } = await import("@/lib/pdf-generator");
        await generatePDF(
          res.data.transaksi,
          res.data.summary,
          userName,
          res.data.preferences,
        );
      } else if (format === "xlsx") {
        const { generateXLSX } = await import("@/lib/spreadsheet-generator");
        await generateXLSX(
          res.data.transaksi,
          res.data.summary,
          userName,
          res.data.preferences,
        );
      } else {
        const { generateCSV } = await import("@/lib/spreadsheet-generator");
        generateCSV(res.data.transaksi, res.data.preferences);
      }

      toast.success(
        dict.settings.export.toasts.success
          .replace("{format}", format.toUpperCase())
          .replace("{count}", String(res.data.transaksi.length)),
      );
    } catch (err) {
      toast.error(dict.settings.export.toasts.error.replace("{format}", format.toUpperCase()));
      console.error(err);
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{dict.settings.export.title}</CardTitle>
        <CardDescription>
          {dict.settings.export.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label htmlFor="dari" className="text-sm font-medium">
                {dict.settings.export.fromDateLabel}
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
                {dict.settings.export.toDateLabel}
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
            {dict.settings.export.emptyFilterNote}
          </p>
        </div>

        <div className="bg-surface-soft rounded-input p-4 flex flex-col gap-1 text-sm border border-hairline">
          <p className="font-medium">
            {dict.settings.export.readyCount.replace("{count}", String(exportCount ?? "..."))}
          </p>
          <p className="text-muted-foreground">
            {dict.settings.export.periodLabel}{" "}
            {filter.dari || filter.sampai
              ? `${filter.dari || dict.settings.export.periodStartFallback} - ${filter.sampai || dict.settings.export.periodEndFallback}`
              : dict.settings.export.allTime}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {dict.settings.export.formatNote}
          </p>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              onClick={() => handleExport("pdf")}
              disabled={loadingFormat !== null}
              className="min-w-32.5 flex-1 gap-2 rounded-full h-11 whitespace-nowrap sm:flex-none"
            >
              {loadingFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              {loadingFormat === "pdf" ? dict.settings.export.generating : dict.settings.export.exportPdf}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={loadingFormat !== null}
              className="min-w-32.5 flex-1 gap-2 rounded-full h-11 whitespace-nowrap sm:flex-none"
            >
              {loadingFormat === "xlsx" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
              )}
              {loadingFormat === "xlsx" ? dict.settings.export.generating : dict.settings.export.exportExcel}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("csv")}
              disabled={loadingFormat !== null}
              className="min-w-32.5 flex-1 gap-2 rounded-full h-11 whitespace-nowrap sm:flex-none"
            >
              {loadingFormat === "csv" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              {loadingFormat === "csv" ? dict.settings.export.generating : dict.settings.export.exportCsv}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
