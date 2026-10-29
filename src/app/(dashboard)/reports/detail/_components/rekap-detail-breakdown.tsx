"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ReceiptText, Tags, Type } from "lucide-react";
import type {
  RekapBreakdownItem,
  RekapDetailRange,
  RekapDetailTransaksi,
} from "@/actions/rekap-action";
import { TIPE_CONFIG } from "@/constants/transaksi";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";
import { RekapDonutChart } from "@/app/(dashboard)/reports/_components/rekap-charts";

export type BreakdownMode = "kategori" | "judul";

const PALETTE = [
  "#0052ff",
  "#05b169",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#10b981",
  "#6366f1",
  "#f97316",
  "#14b8a6",
];

export type RekapDetailBreakdownProps = {
  detail: RekapDetailRange;
};

function DetailListItem({ item }: { item: RekapDetailTransaksi }) {
  const { formatRupiah, formatTanggal, formatWaktu } = useSystemPreferences();
  const cfg = TIPE_CONFIG[item.tipe];
  const TipeIcon = cfg.icon;
  const displayName = item.judul || item.catatan || cfg.label;
  const waktuLabel = formatWaktu(item.waktu);

  return (
    <div className="flex flex-col gap-2.5 border-t border-hairline bg-transparent p-3 transition-colors hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex min-w-0 flex-1 items-start sm:items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-sm">
          {item.kategori?.ikon ? (
            <span>{item.kategori.ikon}</span>
          ) : (
            <TipeIcon className={cn("size-4", cfg.color)} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground max-w-55 sm:max-w-[320px]">
              {displayName}
            </p>
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border-0 px-2 py-0.5 text-xs font-normal shrink-0",
                cfg.badge,
              )}
            >
              {item.kategori
                ? `${item.kategori.ikon} ${item.kategori.nama}`
                : cfg.label}
            </Badge>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="shrink-0">{formatTanggal(item.tanggal, "d MMM yyyy")}</span>
            {waktuLabel && <span className="shrink-0">• {waktuLabel}</span>}
            {item.rekening && (
              <span className="truncate max-w-35">• {item.rekening.nama}</span>
            )}
            {item.catatan && (
              <span className="min-w-0 wrap-break-word text-muted-foreground/85">
                • {item.catatan}
              </span>
            )}
          </div>
        </div>
      </div>
      <p
        className={cn(
          "shrink-0 font-mono text-sm font-semibold text-left sm:text-right pl-12 sm:pl-0",
          item.tipe === "income" ? "text-semantic-up" : "text-semantic-down",
        )}
      >
        {item.tipe === "income" ? "+" : "-"}
        {formatRupiah(Number(item.nominal))}
      </p>
    </div>
  );
}

function BreakdownIcon({
  item,
  mode,
}: {
  item: RekapBreakdownItem;
  mode: BreakdownMode;
}) {
  if (mode === "kategori") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-base">
        {item.icon || "🏷️"}
      </span>
    );
  }

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong">
      <ReceiptText
        className={cn(
          "size-4",
          item.tipe === "income" ? "text-semantic-up" : "text-semantic-down",
        )}
      />
    </span>
  );
}

function BreakdownRows({
  title,
  items,
  mode,
  activeId,
  onToggle,
}: {
  title: string;
  items: RekapBreakdownItem[];
  mode: BreakdownMode;
  activeId: string | null;
  onToggle: (id: string) => void;
}) {
  const { formatRupiah } = useSystemPreferences();
  const { dict } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {title}
        </h3>
        <div className="rounded-input border border-dashed border-hairline p-5 text-center text-sm text-muted-foreground">
          {dict.reports.detail.noDataFor.replace("{title}", title.toLowerCase())}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {title}
        </h3>
        <span className="text-xs font-mono text-muted-foreground">
          {mode === "kategori"
            ? dict.reports.realtime.categoryCount.replace("{count}", String(items.length))
            : dict.reports.realtime.titleCount.replace("{count}", String(items.length))}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-input border border-hairline bg-card transition-colors"
            >
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={cn(
                  "flex min-h-13 w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-surface-soft",
                  isActive && "bg-surface-soft",
                )}
                aria-expanded={isActive}
              >
                <BreakdownIcon item={item} mode={mode} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-sm font-semibold",
                        item.tipe === "income"
                          ? "text-semantic-up"
                          : "text-semantic-down",
                      )}
                    >
                      {formatRupiah(item.total)}
                    </span>
                  </div>

                  <Progress
                    value={item.persentase}
                    className="mt-2 h-1.5 [&>div]:bg-primary"
                  />

                  <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      {item.count} {dict.reports.detail.transactions}
                    </span>
                    <span className="shrink-0 font-mono">{item.persentase}%</span>
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isActive && "rotate-180",
                  )}
                />
              </button>

              {isActive && (
                <div className="bg-card">
                  {item.transaksi.length > 0 ? (
                    item.transaksi.map((t) => (
                      <DetailListItem key={t.id} item={t} />
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground border-t border-hairline">
                      {dict.reports.detail.noTransactionDetail}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RekapDetailBreakdown({ detail }: RekapDetailBreakdownProps) {
  const { dict } = useTranslation();
  const [mode, setMode] = useState<BreakdownMode>("kategori");
  const [donutType, setDonutType] = useState<"expense" | "income">("expense");
  // Satu baris terbuka per bagian (activeExpenseId untuk pengeluaran, activeIncomeId untuk pemasukan)
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);
  const [activeIncomeId, setActiveIncomeId] = useState<string | null>(null);

  const handleModeChange = (val: string) => {
    setMode(val as BreakdownMode);
    setActiveExpenseId(null);
    setActiveIncomeId(null);
  };

  const handleToggleExpense = (id: string) => {
    setActiveExpenseId((curr) => (curr === id ? null : id));
  };

  const handleToggleIncome = (id: string) => {
    setActiveIncomeId((curr) => (curr === id ? null : id));
  };

  const activeDonutItems = useMemo(() => {
    const source =
      mode === "kategori"
        ? donutType === "expense"
          ? detail.kategori.expense
          : detail.kategori.income
        : donutType === "expense"
          ? detail.judul.expense
          : detail.judul.income;

    return source.map((item, idx) => ({
      id: item.id,
      label: item.label,
      total: item.total,
      color: item.color || PALETTE[idx % PALETTE.length],
      persentase: item.persentase,
      icon: item.icon,
    }));
  }, [detail, mode, donutType]);

  const activeDonutTotal =
    donutType === "expense" ? detail.total_expense : detail.total_income;

  return (
    <Card className="rounded-card border border-hairline bg-card">
      <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-primary">
                {mode === "kategori" ? (
                  <Tags className="size-5" />
                ) : (
                  <Type className="size-5" />
                )}
              </span>
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                  {dict.reports.detail.transactionBreakdown}
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {mode === "kategori"
                    ? dict.reports.detail.breakdownCategoryDesc
                    : dict.reports.detail.breakdownTitleDesc}
                </p>
              </div>
            </div>

            <TabsList className="grid grid-cols-2 rounded-full p-1 bg-surface-strong h-10 w-full sm:w-56">
              <TabsTrigger
                value="kategori"
                className="rounded-full text-xs font-semibold data-active:bg-card"
              >
                {dict.reports.realtime.categoryTab}
              </TabsTrigger>
              <TabsTrigger
                value="judul"
                className="rounded-full text-xs font-semibold data-active:bg-card"
              >
                {dict.reports.realtime.titleTab}
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-4 space-y-6">
          {/* Visual Donut Chart seperti di Realtime */}
          <div className="rounded-input border border-hairline bg-surface-soft/50 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {mode === "kategori"
                    ? dict.reports.detail.chartPropCategory
                    : dict.reports.detail.chartPropTitle}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {donutType === "expense"
                    ? dict.reports.detail.chartPropExpenseDesc
                    : dict.reports.detail.chartPropIncomeDesc}
                </p>
              </div>

              {/* Toggle Pengeluaran | Pemasukan */}
              <div className="inline-flex rounded-full bg-surface-strong p-1">
                <button
                  type="button"
                  onClick={() => setDonutType("expense")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    donutType === "expense"
                      ? "bg-card text-semantic-down shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {dict.reports.detail.expenseButton}
                </button>
                <button
                  type="button"
                  onClick={() => setDonutType("income")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    donutType === "income"
                      ? "bg-card text-semantic-up shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {dict.reports.detail.incomeButton}
                </button>
              </div>
            </div>

            {activeDonutItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {donutType === "expense"
                  ? dict.reports.detail.noExpenseChartData
                  : dict.reports.detail.noIncomeChartData}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <RekapDonutChart
                  data={activeDonutItems}
                  totalExpense={activeDonutTotal}
                  centerLabel={
                    donutType === "expense"
                      ? dict.reports.detail.totalExpense
                      : dict.reports.detail.totalIncome
                  }
                  height={240}
                />
              </div>
            )}
          </div>

          <TabsContent value="kategori" className="m-0 space-y-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <BreakdownRows
                title={dict.reports.chart.expenseByCategory}
                items={detail.kategori.expense}
                mode="kategori"
                activeId={activeExpenseId}
                onToggle={handleToggleExpense}
              />
              <BreakdownRows
                title={dict.reports.chart.incomeByCategory}
                items={detail.kategori.income}
                mode="kategori"
                activeId={activeIncomeId}
                onToggle={handleToggleIncome}
              />
            </div>
          </TabsContent>

          <TabsContent value="judul" className="m-0 space-y-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <BreakdownRows
                title={dict.reports.chart.expenseByTitle}
                items={detail.judul.expense}
                mode="judul"
                activeId={activeExpenseId}
                onToggle={handleToggleExpense}
              />
              <BreakdownRows
                title={dict.reports.chart.incomeByTitle}
                items={detail.judul.income}
                mode="judul"
                activeId={activeIncomeId}
                onToggle={handleToggleIncome}
              />
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
