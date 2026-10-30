"use client";

import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import { formatPeriodLabel } from "@/lib/rekap-period";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";

export type RekapPeriodCardData = {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label?: string;
  isCurrent?: boolean;
  total_expense: number;
  total_income: number;
  net: number; // total_income - total_expense
  net_arus_kas_hutang_piutang?: number; // D8 formula
  koreksi?: {
    net: number;
    count: number;
  };
  saldo_awal?: number;
  saldo_akhir?: number;
  id?: string; // ID periode custom bila ada
  nama?: string; // Nama periode custom bila ada
};

export type RekapPeriodCardProps = {
  period: RekapPeriodCardData;
  akumulasiAktif: boolean;
  jenis?: "bulanan" | "custom";
  onEdit?: () => void;
};

function formatSignedRupiah(
  value: number,
  formatter: (val: number) => string,
): string {
  if (value === 0) return formatter(0);
  return `${value > 0 ? "+" : "-"}${formatter(Math.abs(value))}`;
}

function valueColor(value: number): string {
  if (value > 0) return "text-semantic-up";
  if (value < 0) return "text-semantic-down";
  return "text-muted-foreground";
}

function CardRow({
  label,
  value,
  className,
  signed,
}: {
  label: string;
  value: number;
  className?: string;
  signed?: boolean;
}) {
  const { formatRupiah } = useSystemPreferences();

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs sm:text-sm">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span
        className={cn(
          "shrink-0 font-mono font-semibold text-right",
          className,
        )}
      >
        {signed ? formatSignedRupiah(value, formatRupiah) : formatRupiah(value)}
      </span>
    </div>
  );
}

export function RekapPeriodCard({
  period,
  akumulasiAktif,
  jenis = "bulanan",
  onEdit,
}: RekapPeriodCardProps) {
  const { dict, locale } = useTranslation();
  const rekapLocale = locale === "en" ? "en-US" : "id-ID";
  const formattedDates = formatPeriodLabel(period.startDate, period.endDate, rekapLocale);
  const displayTitle = period.nama || period.label || formattedDates;
  const href = `/reports/detail?dari=${period.startDate}&sampai=${period.endDate}&jenis=${jenis}${
    period.id ? `&id=${period.id}` : ""
  }`;

  const netHutangPiutang = period.net_arus_kas_hutang_piutang ?? 0;
  const hasKoreksi =
    Boolean(period.koreksi && (period.koreksi.count > 0 || period.koreksi.net !== 0));

  return (
    <Link
      href={href}
      className="group block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Card className="rounded-card border border-hairline bg-card p-5 sm:p-6 transition-all hover:bg-surface-soft/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] h-full flex flex-col justify-between">
        {/* Header Kartu */}
        <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {displayTitle}
              </h3>
              {period.isCurrent && (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-primary/10 text-primary border-0 px-2 py-0.5 text-xs font-semibold shrink-0"
                >
                  {dict.reports.card.active}
                </Badge>
              )}
            </div>
            {period.nama && (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground truncate">
                {formattedDates}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                aria-label={dict.reports.card.editPeriod.replace("{title}", displayTitle)}
                className="size-8 rounded-full hover:bg-surface-strong"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </Button>
            )}
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Daftar Metrik Finansial */}
        <div className="mt-3 divide-y divide-hairline flex-1 flex flex-col justify-start">
          {akumulasiAktif ? (
            // Mode Akumulasi Aktif
            <>
              <CardRow
                label={dict.reports.card.initialBalance}
                value={period.saldo_awal ?? 0}
                className="text-foreground"
              />
              <CardRow
                label={dict.reports.card.expense}
                value={period.total_expense}
                className="text-semantic-down"
              />
              <CardRow
                label={dict.reports.card.income}
                value={period.total_income}
                className="text-semantic-up"
              />
              <CardRow
                label={dict.reports.card.net}
                value={period.net}
                className={valueColor(period.net)}
                signed
              />
              <CardRow
                label={dict.reports.card.debtReceivable}
                value={netHutangPiutang}
                className={valueColor(netHutangPiutang)}
                signed
              />
              {hasKoreksi && (
                <CardRow
                  label={dict.reports.card.correction}
                  value={period.koreksi!.net}
                  className={valueColor(period.koreksi!.net)}
                  signed
                />
              )}
              <CardRow
                label={dict.reports.card.endingBalance}
                value={period.saldo_akhir ?? 0}
                className="text-foreground font-bold"
              />
            </>
          ) : (
            // Mode Akumulasi Nonaktif
            <>
              <CardRow
                label={dict.reports.card.expense}
                value={period.total_expense}
                className="text-semantic-down"
              />
              <CardRow
                label={dict.reports.card.income}
                value={period.total_income}
                className="text-semantic-up"
              />
              <CardRow
                label={dict.reports.card.net}
                value={period.net}
                className={valueColor(period.net)}
                signed
              />
              <CardRow
                label={dict.reports.card.debtReceivable}
                value={netHutangPiutang}
                className={valueColor(netHutangPiutang)}
                signed
              />
              {hasKoreksi && (
                <CardRow
                  label={dict.reports.card.correction}
                  value={period.koreksi!.net}
                  className={valueColor(period.koreksi!.net)}
                  signed
                />
              )}
            </>
          )}
        </div>
      </Card>
    </Link>
  );
}
