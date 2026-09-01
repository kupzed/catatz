"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSystemPreferences } from "@/providers/system-preference-provider";

export type TransaksiSummaryCardProps = {
  dateLabel: string;
  canNavigateDate: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDatePick: (date: string) => void;
  preset: string;
  currentDate: string;
  totalIncome: number;
  totalExpense: number;
};

export function TransaksiSummaryCard({
  dateLabel,
  canNavigateDate,
  onPrev,
  onNext,
  onDatePick,
  preset,
  currentDate,
  totalIncome,
  totalExpense,
}: TransaksiSummaryCardProps) {
  const { formatRupiah } = useSystemPreferences();

  return (
    <div className="rounded-card border border-hairline bg-surface-dark dark:bg-surface-dark-elevated text-white overflow-hidden ring-1 ring-white/5">
      {/* Navigator Header */}
      <div className="bg-primary flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 h-8 w-8"
          onClick={onPrev}
          disabled={!canNavigateDate}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* dateLabel yang bisa diklik */}
        <div className="relative inline-flex items-center">
          <button
            className={cn(
              "font-semibold text-sm md:text-base flex items-center gap-1.5 text-white",
              "hover:text-white/80 transition-colors rounded-[6px] px-2 py-1",
              preset !== "all" && "hover:underline underline-offset-2",
            )}
            disabled={preset === "all"}
            title={preset !== "all" ? "Klik untuk pilih tanggal" : undefined}
          >
            <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
            {dateLabel}
          </button>
          {preset !== "all" && (
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              value={currentDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDatePick(e.target.value);
                }
              }}
            />
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 h-8 w-8"
          onClick={onNext}
          disabled={!canNavigateDate}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Summary - correction tidak dihitung */}
      <div className="grid grid-cols-3 divide-x divide-hairline px-3 sm:px-6 py-4 text-center bg-background dark:bg-card text-foreground rounded-b-card">
        <div className="px-0.5 sm:px-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            Pemasukan
          </p>
          <p className="font-mono text-sm sm:text-base font-semibold text-semantic-up mt-0.5 break-all leading-tight">
            {totalIncome > 0 ? "+" : ""}
            {formatRupiah(totalIncome)}
          </p>
        </div>
        <div className="px-0.5 sm:px-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            Pengeluaran
          </p>
          <p className="font-mono text-sm sm:text-base font-semibold text-semantic-down mt-0.5 break-all leading-tight">
            {formatRupiah(totalExpense)}
          </p>
        </div>
        <div className="px-0.5 sm:px-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            Selisih
          </p>
          <p
            className={cn(
              "font-mono text-sm sm:text-base font-semibold mt-0.5 break-all leading-tight",
              totalIncome - totalExpense >= 0
                ? "text-semantic-up"
                : "text-semantic-down",
            )}
          >
            {formatRupiah(totalIncome - totalExpense)}
          </p>
        </div>
      </div>
    </div>
  );
}
