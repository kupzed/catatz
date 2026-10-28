"use client";

import type { Transaksi } from "@/types/transaksi";
import type { DisplayTransaksi } from "@/hooks/use-offline-queue-sync";
import { cn } from "@/lib/utils";
import { TIPE_CONFIG } from "@/constants/transaksi";
import {
  filterSystemTags,
  getTransaksiNominalDisplay,
} from "@/lib/transaksi-detail";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/use-translation";
import {
  ArrowDown,
  FileText,
  Repeat,
  Tag,
  Wallet,
} from "lucide-react";

export type TransaksiDetailContentProps = {
  transaksi: Transaksi | DisplayTransaksi;
  className?: string;
};

function getHeroIconTheme(tipe: Transaksi["tipe"]) {
  switch (tipe) {
    case "income":
      return {
        bg: "bg-semantic-up/10 dark:bg-semantic-up/20",
        color: "text-semantic-up",
      };
    case "expense":
      return {
        bg: "bg-semantic-down/10 dark:bg-semantic-down/20",
        color: "text-semantic-down",
      };
    case "transfer":
      return {
        bg: "bg-primary/10 dark:bg-primary/20",
        color: "text-primary",
      };
    case "correction":
      return {
        bg: "bg-accent-yellow/15 dark:bg-accent-yellow/25",
        color: "text-accent-yellow",
      };
    default:
      return {
        bg: "bg-surface-strong",
        color: "text-foreground",
      };
  }
}

export function TransaksiDetailContent({
  transaksi,
  className,
}: TransaksiDetailContentProps) {
  const { formatRupiah, formatTanggal, formatWaktu } = useSystemPreferences();
  const { dict } = useTranslation();
  const cfg = TIPE_CONFIG[transaksi.tipe] ?? TIPE_CONFIG.expense;
  const TipeIcon = cfg.icon;
  const iconTheme = getHeroIconTheme(transaksi.tipe);
  const nominalDisplay = getTransaksiNominalDisplay(transaksi, dict);
  const userTags = filterSystemTags(transaksi.tags);
  const waktuLabel = formatWaktu(transaksi.waktu);
  const isPendingSync = (transaksi as DisplayTransaksi)._pendingSync;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 1. Hero Nominal Card */}
      <div className="rounded-[20px] p-6 bg-surface-soft dark:bg-surface-dark-elevated border border-hairline flex flex-col items-center text-center">
        {/* Fixed circular type icon (tidak mengikuti emoji kategori) */}
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shrink-0 mb-3 shadow-none",
            iconTheme.bg,
            iconTheme.color,
          )}
        >
          <TipeIcon className="h-7 w-7 stroke-[2.25]" />
        </div>

        {/* Label Tipe Transaksi */}
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            nominalDisplay.colorClass,
          )}
        >
          {nominalDisplay.label}
        </span>

        {/* Nominal Amount */}
        <div className="mt-1">
          <p
            className={cn(
              "font-mono text-3xl sm:text-4xl font-bold tracking-tight",
              nominalDisplay.colorClass,
            )}
          >
            {nominalDisplay.sign}
            {formatRupiah(Number(transaksi.nominal))}
          </p>
        </div>

        {/* Tanggal & Waktu */}
        <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-2 flex items-center justify-center gap-1.5">
          <span>{formatTanggal(transaksi.tanggal)}</span>
          {waktuLabel && (
            <>
              <span className="opacity-60">-</span>
              <span className="font-mono">{waktuLabel}</span>
            </>
          )}
        </p>

        {/* Status badges jika ada */}
        {(isPendingSync || transaksi.is_recurring) && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {isPendingSync && (
              <Badge className="border-0 bg-accent-yellow/15 px-3 py-1 rounded-full text-xs font-medium text-accent-yellow">
                {dict.transactions.pendingSync}
              </Badge>
            )}

            {transaksi.is_recurring && (
              <Badge className="border-0 bg-primary/10 px-3 py-1 rounded-full text-xs font-medium text-primary flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                <span>{dict.transactions.recurring}</span>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 2. Rekening & Alur Transfer / Metadata */}
      {transaksi.tipe === "transfer" ? (
        <div className="rounded-[20px] p-4 border border-hairline bg-card space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            {dict.transactions.detail.transferFlow}
          </span>

          <div className="flex flex-col gap-2 pt-1">
            {/* Rekening Asal */}
            <div className="flex items-center gap-3 p-3.5 rounded-[14px] bg-surface-soft dark:bg-surface-dark-elevated border border-hairline/60">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-xs"
                style={{
                  backgroundColor: transaksi.rekening?.warna || "#0052ff",
                }}
              >
                {transaksi.rekening?.nama?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground font-medium">
                  {dict.transactions.detail.sourceWallet}
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {transaksi.rekening?.nama ?? dict.transactions.detail.sourceWallet}
                </p>
                {transaksi.rekening?.jenis && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {transaksi.rekening.jenis}
                  </p>
                )}
              </div>
            </div>

            {/* Arrow Divider ke bawah */}
            <div className="flex justify-center items-center -my-1 text-muted-foreground">
              <div className="w-7 h-7 rounded-full bg-surface-strong flex items-center justify-center border border-hairline/40">
                <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Rekening Tujuan */}
            <div className="flex items-center gap-3 p-3.5 rounded-[14px] bg-surface-soft dark:bg-surface-dark-elevated border border-hairline/60">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-xs"
                style={{
                  backgroundColor:
                    transaksi.rekening_tujuan_data?.warna || "#05b169",
                }}
              >
                {transaksi.rekening_tujuan_data?.nama?.charAt(0).toUpperCase() ??
                  "T"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground font-medium">
                  {dict.transactions.detail.destinationWallet}
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {transaksi.rekening_tujuan_data?.nama ?? dict.transactions.detail.destinationWallet}
                </p>
                {transaksi.rekening_tujuan_data?.jenis && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {transaksi.rekening_tujuan_data.jenis}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Metadata Transaksi: Rekening, Judul, Kategori */
        <div className="rounded-[20px] p-4 border border-hairline bg-card divide-y divide-hairline">
          {/* Rekening */}
          <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">{dict.transactions.detail.wallet}</span>
            </div>
            <div className="flex items-center gap-2 truncate justify-end">
              {transaksi.rekening?.warna && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: transaksi.rekening.warna }}
                />
              )}
              <span className="text-sm font-semibold text-foreground truncate">
                {transaksi.rekening?.nama ?? dict.transactions.notSpecified}
              </span>
              {transaksi.rekening?.jenis && (
                <Badge
                  variant="secondary"
                  className="rounded-full text-[10px] px-2 py-0 bg-surface-strong text-muted-foreground border-none shrink-0 font-normal"
                >
                  {transaksi.rekening.jenis}
                </Badge>
              )}
            </div>
          </div>

          {/* Judul (jika ada) */}
          {transaksi.judul && (
            <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium">{dict.transactions.detail.titleLabel}</span>
              </div>
              <span className="text-sm font-semibold text-foreground text-right truncate">
                {transaksi.judul}
              </span>
            </div>
          )}

          {/* Kategori (jika ada) */}
          {transaksi.kategori && (
            <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <Tag className="h-4 w-4" />
                <span className="text-xs font-medium">{dict.transactions.detail.category}</span>
              </div>
              <span className="text-sm font-medium text-foreground text-right flex items-center gap-1.5 truncate">
                {transaksi.kategori.ikon && (
                  <span>{transaksi.kategori.ikon}</span>
                )}
                <span className="truncate">{transaksi.kategori.nama}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Judul Khusus Transfer (jika ada judul pada transfer) */}
      {transaksi.tipe === "transfer" && transaksi.judul && (
        <div className="rounded-[20px] p-4 border border-hairline bg-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">{dict.transactions.detail.titleLabel}</span>
            </div>
            <span className="text-sm font-semibold text-foreground text-right truncate">
              {transaksi.judul}
            </span>
          </div>
        </div>
      )}

      {/* 3. Catatan Section */}
      {transaksi.catatan && (
        <div className="rounded-[20px] p-4 border border-hairline bg-card space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5" />
            <span>{dict.transactions.detail.notes}</span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed pl-1">
            {transaksi.catatan}
          </p>
        </div>
      )}

      {/* 4. User Tags Section */}
      {userTags.length > 0 && (
        <div className="rounded-[20px] p-4 border border-hairline bg-card space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Tag className="h-3.5 w-3.5" />
            <span>Tags ({userTags.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {userTags.map((tag, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="rounded-full bg-surface-strong text-foreground/80 text-xs px-3 py-1 border-none font-normal"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 5. ID Referensi di paling bawah */}
      <div className="pt-2 pb-1 text-center">
        <p className="font-mono text-[11px] text-muted-foreground/60 select-all tracking-wide">
          {dict.transactions.idLabel}: {transaksi.id}
        </p>
      </div>
    </div>
  );
}

