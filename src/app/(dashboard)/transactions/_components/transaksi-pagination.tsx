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
import { formatNumber } from "@/lib/utils";
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
    <div className="rounded-card border border-hairline bg-card p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Mobile view top row / Desktop left: info & page size */}
      <div className="flex items-center justify-between sm:justify-start gap-3 text-xs sm:text-sm text-muted-foreground">
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

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline">{dict.transactions.pagination.perPage}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger
              className="h-8 sm:h-9 w-18 sm:w-19.5 rounded-full border-hairline text-xs sm:text-sm font-mono text-foreground shrink-0 px-2 sm:px-2.5"
              aria-label={dict.transactions.pagination.selectRowsPerPage}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t border-hairline sm:border-t-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-full h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm gap-1 border-hairline"
          aria-label={dict.transactions.pagination.prevPageAria}
        >
          <ChevronLeft className="size-3.5 sm:size-4" />
          <span className="inline">{dict.transactions.pagination.prevPage}</span>
        </Button>

        {/* Mobile page indicator */}
        <div className="sm:hidden text-xs text-muted-foreground font-mono">
          {dict.transactions.pagination.page} <span className="font-semibold text-foreground">{currentPage}</span> / {totalPages}
        </div>

        {/* Desktop page buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-xs text-muted-foreground select-none"
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
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={`rounded-full h-9 w-9 p-0 font-mono text-xs sm:text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-[#003ecc]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-strong"
                }`}
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
          className="rounded-full h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm gap-1 border-hairline"
          aria-label={dict.transactions.pagination.nextPageAria}
        >
          <span className="inline">{dict.transactions.pagination.nextPage}</span>
          <ChevronRight className="size-3.5 sm:size-4" />
        </Button>
      </div>
    </div>
  );
}
