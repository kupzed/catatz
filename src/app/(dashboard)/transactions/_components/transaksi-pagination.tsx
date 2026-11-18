"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatNumber } from "@/lib/utils";
import { useTranslation } from "@/i18n/use-translation";

export type TransaksiPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function TransaksiPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: TransaksiPaginationProps) {
  const { dict } = useTranslation();
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  return (
    <div className="rounded-card border border-hairline bg-card px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Mobile view top row / Desktop left: info & page size */}
      <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
        <div>
          {dict.transactions.pagination.showing}{" "}
          <span className="font-mono font-medium text-foreground">
            {formatNumber(startItem)}-{formatNumber(endItem)}
          </span>{" "}
          {dict.transactions.pagination.of}{" "}
          <span className="font-mono font-medium text-foreground">
            {formatNumber(totalItems)}
          </span>{" "}
          {dict.transactions.pagination.transactions}
        </div>

        <span
          aria-hidden="true"
          className="hidden sm:block h-4 w-px bg-hairline"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline">{dict.transactions.pagination.perPage}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger
              size="sm"
              className="h-9! w-auto min-w-17 rounded-full! border-hairline bg-surface-strong/60 dark:bg-surface-dark-elevated px-3 font-mono text-xs font-medium text-foreground shadow-none hover:bg-surface-strong transition-colors"
              aria-label={dict.transactions.pagination.selectRowsPerPage}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="min-w-20 rounded-input">
              <SelectItem value="10" className="font-mono text-xs">10</SelectItem>
              <SelectItem value="25" className="font-mono text-xs">25</SelectItem>
              <SelectItem value="50" className="font-mono text-xs">50</SelectItem>
              <SelectItem value="100" className="font-mono text-xs">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2.5 sm:pt-0 border-t border-hairline sm:border-t-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 rounded-full border-hairline px-3.5 text-xs font-medium gap-1.5 text-foreground hover:bg-surface-strong disabled:opacity-40"
          aria-label={dict.transactions.pagination.prevPageAria}
        >
          <ChevronLeft className="size-3.5 shrink-0" />
          <span className="inline">{dict.transactions.pagination.prevPage}</span>
        </Button>

        {/* Mobile page indicator */}
        <div className="sm:hidden inline-flex h-9 items-center rounded-full bg-surface-soft px-3 font-mono text-xs text-muted-foreground border border-hairline">
          {dict.transactions.pagination.page}&nbsp;
          <span className="font-semibold text-foreground">{currentPage}</span>
          <span className="mx-1">/</span>
          <span>{totalPages}</span>
        </div>

        {/* Desktop page buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex size-9 items-center justify-center font-mono text-xs text-muted-foreground select-none"
                >
                  …
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                variant={isActive ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "h-9 min-w-9 w-auto px-2.5 rounded-full font-mono text-xs font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-[#003ecc]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-strong",
                )}
                aria-label={`${dict.transactions.pagination.pageAria} ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-9 rounded-full border-hairline px-3.5 text-xs font-medium gap-1.5 text-foreground hover:bg-surface-strong disabled:opacity-40"
          aria-label={dict.transactions.pagination.nextPageAria}
        >
          <span className="inline">{dict.transactions.pagination.nextPage}</span>
          <ChevronRight className="size-3.5 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
