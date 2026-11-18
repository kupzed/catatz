"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { getExportCount, getExportData } from "@/actions/export-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n/use-translation";
import { useSystemPreferences } from "@/providers/system-preference-provider";

type ExportFormat = "pdf" | "xlsx" | "csv";

export type RekapExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RekapExportDialog({
  open,
  onOpenChange,
}: RekapExportDialogProps) {
  const { dict } = useTranslation();
  const { formatNumber } = useSystemPreferences();
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [filter, setFilter] = useState<{ dari: string; sampai: string }>({
    dari: "",
    sampai: "",
  });

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    const fetchCount = async () => {
      const countFilter =
        filter.dari || filter.sampai
          ? {
              dari: filter.dari || undefined,
              sampai: filter.sampai || undefined,
            }
          : undefined;

      const res = await getExportCount(countFilter);
      if (!ignore && res.success && res.data) {
        setExportCount(res.data.count);
      }
    };

    fetchCount();

    return () => {
      ignore = true;
    };
  }, [open, filter.dari, filter.sampai]);

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
        toast.error(res.error ?? dict.reports.export.toasts.fetchFailed);
        return;
      }
      if (res.data.transaksi.length === 0) {
        toast.info(dict.reports.export.toasts.noTransactions);
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
        dict.reports.export.toasts.success
          .replace("{format}", format.toUpperCase())
          .replace("{count}", String(res.data.transaksi.length)),
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(
        dict.reports.export.toasts.error.replace(
          "{format}",
          format.toUpperCase(),
        ),
      );
      console.error(err);
    } finally {
      setLoadingFormat(null);
    }
  }

  const hasDateFilter = Boolean(filter.dari || filter.sampai);
  const [readyPrefix, readySuffix] =
    dict.reports.export.readyCount.split("{count}");
  const formattedReadyCount =
    exportCount !== null ? formatNumber(exportCount) : "...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dict.reports.export.title}</DialogTitle>
          <DialogDescription>
            {dict.reports.export.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="export-dari" className="text-sm font-medium">
                  {dict.reports.export.fromDateLabel}
                </Label>
                <Input
                  id="export-dari"
                  type="date"
                  className="h-12 w-full appearance-none rounded-input bg-background border-hairline"
                  value={filter.dari}
                  onChange={(e) =>
                    setFilter((prev) => ({ ...prev, dari: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="export-sampai" className="text-sm font-medium">
                  {dict.reports.export.toDateLabel}
                </Label>
                <Input
                  id="export-sampai"
                  type="date"
                  className="h-12 w-full appearance-none rounded-input bg-background border-hairline"
                  value={filter.sampai}
                  onChange={(e) =>
                    setFilter((prev) => ({ ...prev, sampai: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {dict.reports.export.emptyFilterNote}
              </p>
              {hasDateFilter && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter({ dari: "", sampai: "" })}
                  className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 shrink-0"
                >
                  <RotateCcw className="size-3 shrink-0" />
                  <span>{dict.reports.export.resetFilter}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="bg-surface-soft rounded-input p-4 flex flex-col gap-1 text-sm border border-hairline">
            <p className="font-medium text-foreground">
              {readyPrefix}
              <span className="font-mono font-semibold">
                {formattedReadyCount}
              </span>
              {readySuffix ?? ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {dict.reports.export.periodLabel}{" "}
              <span className="font-mono text-foreground">
                {hasDateFilter
                  ? `${filter.dari || dict.reports.export.periodStartFallback} - ${filter.sampai || dict.reports.export.periodEndFallback}`
                  : dict.reports.export.allTime}
              </span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            {dict.reports.export.formatNote}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={loadingFormat !== null}
              className="h-11 rounded-full gap-2 whitespace-nowrap"
            >
              {loadingFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              <span>
                {loadingFormat === "pdf"
                  ? dict.reports.export.generating
                  : dict.reports.export.exportPdf}
              </span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={loadingFormat !== null}
              className="h-11 rounded-full gap-2 whitespace-nowrap"
            >
              {loadingFormat === "xlsx" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
              )}
              <span>
                {loadingFormat === "xlsx"
                  ? dict.reports.export.generating
                  : dict.reports.export.exportExcel}
              </span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleExport("csv")}
              disabled={loadingFormat !== null}
              className="h-11 rounded-full gap-2 whitespace-nowrap"
            >
              {loadingFormat === "csv" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              <span>
                {loadingFormat === "csv"
                  ? dict.reports.export.generating
                  : dict.reports.export.exportCsv}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
