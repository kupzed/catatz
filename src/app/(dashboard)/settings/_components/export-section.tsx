"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Database, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAccountExportData,
  getAccountExportSummary,
  type AccountExportSummary,
} from "@/actions/export-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/i18n/use-translation";
import { todayISODate } from "@/lib/utils";
import { useSystemPreferences } from "@/providers/system-preference-provider";

export function ExportSection() {
  const { dict } = useTranslation();
  const { formatNumber } = useSystemPreferences();
  const [isExporting, setIsExporting] = useState(false);
  const [summary, setSummary] = useState<AccountExportSummary | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchSummary = async () => {
      const res = await getAccountExportSummary();
      if (!ignore && res.success && res.data) {
        setSummary(res.data);
      }
    };

    fetchSummary();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleExportAccount() {
    setIsExporting(true);
    try {
      const res = await getAccountExportData();
      if (!res.success || !res.data) {
        toast.error(res.error ?? dict.settings.export.accountToasts.fetchFailed);
        return;
      }

      const jsonContent = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `catatz-account-backup-${todayISODate()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(dict.settings.export.accountToasts.success);
    } catch (err) {
      toast.error(dict.settings.export.accountToasts.error);
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }

  const summaryItems = [
    {
      label: dict.settings.export.walletsLabel,
      count: summary?.walletsCount,
    },
    {
      label: dict.settings.export.categoriesLabel,
      count: summary?.categoriesCount,
    },
    {
      label: dict.settings.export.transactionsLabel,
      count: summary?.transactionsCount,
    },
    {
      label: dict.settings.export.debtsLabel,
      count: summary?.debtsCount,
    },
    {
      label: dict.settings.export.budgetsLabel,
      count: summary?.budgetsCount,
    },
    {
      label: dict.settings.export.customPeriodsLabel,
      count: summary?.customPeriodsCount,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {dict.settings.export.accountTitle}
        </CardTitle>
        <CardDescription>
          {dict.settings.export.accountDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.settings.export.summaryTitle}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-input border border-hairline bg-surface-soft px-3.5 py-2.5 min-w-0"
              >
                <p className="text-xs text-muted-foreground truncate">
                  {item.label}
                </p>
                <p className="mt-0.5 font-mono text-base font-semibold text-foreground">
                  {item.count !== undefined ? formatNumber(item.count) : "..."}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-input border border-hairline bg-surface-soft/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-primary">
              <Database className="size-4" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {dict.settings.export.reportsHintTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {dict.settings.export.reportsHintDescription}
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-hairline px-4 shrink-0 w-full sm:w-auto gap-1.5"
          >
            <Link href="/reports">
              <span>{dict.settings.export.reportsLinkLabel}</span>
              <ArrowUpRight className="size-3.5 shrink-0" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <p className="text-xs text-muted-foreground">
            {dict.settings.export.accountFormatNote}
          </p>
          <Button
            type="button"
            onClick={handleExportAccount}
            disabled={isExporting}
            className="h-11 w-full sm:w-auto rounded-full px-5 gap-2 whitespace-nowrap shrink-0"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Download className="h-4 w-4 shrink-0" />
            )}
            <span>
              {isExporting
                ? dict.settings.export.generating
                : dict.settings.export.exportAccountButton}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
