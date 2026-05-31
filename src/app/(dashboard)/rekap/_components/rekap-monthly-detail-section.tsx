"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  HandCoins,
  ReceiptText,
  SlidersHorizontal,
  Tags,
  Type,
} from "lucide-react";
import type {
  RekapBreakdown,
  RekapBreakdownItem,
  RekapDetailBulanan,
  RekapDetailTransaksi,
  RekapHutangPiutangItem,
  RekapKoreksiItem,
} from "@/actions/rekap-action";
import { BULAN_NAMES } from "@/constants/rekap";
import { TIPE_CONFIG } from "@/constants/transaksi";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

type BreakdownMode = "kategori" | "judul";
type RekapMonthlyDetailSectionProps = {
  detail: RekapDetailBulanan;
  isLoading?: boolean;
};

const debtLabels: Record<RekapHutangPiutangItem["jenis"], string> = {
  piutang_baru: "Piutang baru",
  hutang_baru: "Hutang baru",
  cicilan_piutang: "Cicilan piutang",
  cicilan_hutang: "Cicilan hutang",
};

function formatSignedRupiah(value: number) {
  if (value === 0) return formatRupiah(0);
  return `${value > 0 ? "+" : "-"}${formatRupiah(Math.abs(value))}`;
}

function valueColor(value: number) {
  if (value > 0) return "text-semantic-up";
  if (value < 0) return "text-semantic-down";
  return "text-muted-foreground";
}

function DetailMetric({
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
  return (
    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3 last:border-b-0">
      <span className="min-w-0 text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "shrink-0 text-right font-mono text-sm font-semibold",
          className,
        )}
      >
        {signed ? formatSignedRupiah(value) : formatRupiah(value)}
      </span>
    </div>
  );
}

function DetailListItem({ item }: { item: RekapDetailTransaksi }) {
  const cfg = TIPE_CONFIG[item.tipe];
  const TipeIcon = cfg.icon;
  const displayName = item.judul || item.catatan || cfg.label;

  return (
    <div className="flex flex-col gap-3 border-t border-hairline bg-transparent p-3 transition-colors hover:bg-surface-soft sm:flex-row sm:items-center sm:p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong">
          {item.kategori?.ikon ?? <TipeIcon className={cn("h-5 w-5", cfg.color)} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <Badge
              className={cn(
                "w-fit rounded-full border-0 px-2.5 py-0.5 text-xs",
                cfg.badge,
              )}
            >
              {item.kategori
                ? `${item.kategori.ikon} ${item.kategori.nama}`
                : cfg.label}
            </Badge>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatTanggal(item.tanggal, "d MMM yyyy")}</span>
            {item.rekening && (
              <span className="truncate">- {item.rekening.nama}</span>
            )}
            {item.catatan && (
              <span className="min-w-0 break-words">- {item.catatan}</span>
            )}
          </div>
        </div>
      </div>
      <p
        className={cn(
          "shrink-0 text-left font-mono text-sm font-semibold sm:text-right",
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-base">
        {item.icon}
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-strong">
      <ReceiptText
        className={cn(
          "h-4 w-4",
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
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-hairline p-5 text-sm text-muted-foreground">
        Belum ada data {title.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-center text-sm font-semibold text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={cn(
                  "flex min-h-16 w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors hover:bg-surface-soft",
                  isActive && "bg-surface-soft",
                )}
                aria-expanded={isActive}
              >
                <BreakdownIcon item={item} mode={mode} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
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
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{item.count} transaksi</span>
                    <span className="font-mono">{item.persentase}%</span>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isActive && "rotate-180",
                  )}
                />
              </button>

              {isActive && (
                <div className="ml-0 overflow-hidden sm:ml-12">
                  {item.transaksi.map((transaksi) => (
                    <DetailListItem key={transaksi.id} item={transaksi} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BreakdownSection({ detail }: { detail: RekapDetailBulanan }) {
  const [mode, setMode] = useState<BreakdownMode>("kategori");
  const [activeId, setActiveId] = useState<string | null>(null);
  const breakdown: RekapBreakdown = mode === "kategori" ? detail.kategori : detail.judul;
  const titleSuffix = mode === "kategori" ? "Kategori" : "Judul";

  function handleModeChange(checked: boolean) {
    setMode(checked ? "judul" : "kategori");
    setActiveId(null);
  }

  function handleToggle(id: string) {
    setActiveId((current) => (current === id ? null : id));
  }

  return (
    <div className="rounded-card border border-hairline bg-card p-5 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-primary">
            {mode === "kategori" ? (
              <Tags className="h-4 w-4" />
            ) : (
              <Type className="h-4 w-4" />
            )}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Rincian {titleSuffix}
            </h2>
            <p className="text-sm text-muted-foreground">
              {BULAN_NAMES[detail.bulan - 1]} {detail.tahun}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-surface-strong px-4 py-2">
          <span
            className={cn(
              "text-xs font-semibold",
              mode === "kategori" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Kategori
          </span>
          <Switch
            size="sm"
            checked={mode === "judul"}
            onCheckedChange={handleModeChange}
            aria-label="Ubah rincian kategori atau judul"
          />
          <span
            className={cn(
              "text-xs font-semibold",
              mode === "judul" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Judul
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <BreakdownRows
          title={`Pengeluaran per ${titleSuffix}`}
          items={breakdown.expense}
          mode={mode}
          activeId={activeId}
          onToggle={handleToggle}
        />
        <BreakdownRows
          title={`Pemasukan per ${titleSuffix}`}
          items={breakdown.income}
          mode={mode}
          activeId={activeId}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}

function KoreksiSection({ items }: { items: RekapKoreksiItem[] }) {
  if (items.length === 0) {
    return (
      <p className="border-t border-hairline pt-4 text-sm text-muted-foreground">
        Belum ada koreksi saldo pada periode ini.
      </p>
    );
  }

  return (
    <div className="border-t border-hairline">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-4 border-b border-hairline py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {item.arah === "tambah" ? "Tambah saldo" : "Kurangi saldo"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatTanggal(item.tanggal, "d MMM yyyy")}
              {item.rekening ? ` - ${item.rekening.nama}` : ""}
            </p>
          </div>
          <p
            className={cn(
              "shrink-0 text-right font-mono text-sm font-semibold",
              item.arah === "tambah"
                ? "text-semantic-up"
                : "text-semantic-down",
            )}
          >
            {item.arah === "tambah" ? "+" : "-"}
            {formatRupiah(item.nominal)}
          </p>
        </div>
      ))}
    </div>
  );
}

function HutangPiutangList({ items }: { items: RekapHutangPiutangItem[] }) {
  if (items.length === 0) {
    return (
      <p className="border-t border-hairline pt-4 text-sm text-muted-foreground">
        Belum ada aktivitas hutang/piutang pada periode ini.
      </p>
    );
  }

  return (
    <div className="border-t border-hairline">
      {items.map((item) => {
        const isPositive =
          item.jenis === "piutang_baru" || item.jenis === "cicilan_piutang";

        return (
          <div
            key={`${item.jenis}-${item.id}`}
            className="flex items-start justify-between gap-4 border-b border-hairline py-3 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <Badge className="rounded-full border-0 bg-surface-strong px-2.5 py-0.5 text-xs text-muted-foreground">
                  {debtLabels[item.jenis]}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatTanggal(item.tanggal, "d MMM yyyy")}
                {item.catatan ? ` - ${item.catatan}` : ""}
              </p>
            </div>
            <p
              className={cn(
                "shrink-0 text-right font-mono text-sm font-semibold",
                isPositive ? "text-semantic-up" : "text-semantic-down",
              )}
            >
              {isPositive ? "+" : "-"}
              {formatRupiah(item.nominal)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function RekapMonthlyDetailSection({
  detail,
  isLoading,
}: RekapMonthlyDetailSectionProps) {
  const periodLabel = useMemo(
    () =>
      `${formatTanggal(detail.startDate, "dd MMM yyyy")} - ${formatTanggal(
        detail.endDate,
        "dd MMM yyyy",
      )}`,
    [detail.endDate, detail.startDate],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-card" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-56 w-full rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-card border border-hairline bg-card p-5 sm:p-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Detail Rekap
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {BULAN_NAMES[detail.bulan - 1]} {detail.tahun}
            </h2>
          </div>
          <p className="font-mono text-sm font-semibold text-muted-foreground">
            {periodLabel}
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Selisih pemasukan dan pengeluaran
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Koreksi saldo dan hutang/piutang dipisahkan dari selisih utama.
            </p>
          </div>
          <div>
            <DetailMetric
              label="Pengeluaran"
              value={detail.total_expense}
              className="text-semantic-down"
            />
            <DetailMetric
              label="Rata-rata pengeluaran per hari"
              value={detail.rata_expense_harian}
              className="text-semantic-down"
            />
            <DetailMetric
              label="Pemasukan"
              value={detail.total_income}
              className="text-semantic-up"
            />
            <DetailMetric
              label="Rata-rata pemasukan per hari"
              value={detail.rata_income_harian}
              className="text-semantic-up"
            />
            <DetailMetric
              label="Selisih utama"
              value={detail.net}
              className={valueColor(detail.net)}
              signed
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-hairline bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Rincian Koreksi Saldo
              </p>
              <p className="text-xs text-muted-foreground">
                {detail.koreksi.count} koreksi pada periode ini
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-accent-yellow">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
          </div>
          <div className="mb-4">
            <DetailMetric
              label="Saldo ditambah"
              value={detail.koreksi.total_tambah}
              className="text-semantic-up"
            />
            <DetailMetric
              label="Saldo dikurangi"
              value={detail.koreksi.total_kurang}
              className="text-semantic-down"
            />
            <DetailMetric
              label="Selisih koreksi"
              value={detail.koreksi.net}
              className={valueColor(detail.koreksi.net)}
              signed
            />
          </div>
          <KoreksiSection items={detail.koreksi.items} />
        </div>

        <div className="rounded-card border border-hairline bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Rincian Hutang Piutang
              </p>
              <p className="text-xs text-muted-foreground">
                {detail.hutang_piutang.count} aktivitas pada periode ini
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-primary">
              <HandCoins className="h-4 w-4" />
            </span>
          </div>
          <div className="mb-4 grid gap-x-6 md:grid-cols-2">
            <DetailMetric
              label="Piutang baru"
              value={detail.hutang_piutang.piutang_baru}
              className="text-semantic-up"
            />
            <DetailMetric
              label="Hutang baru"
              value={detail.hutang_piutang.hutang_baru}
              className="text-semantic-down"
            />
            <DetailMetric
              label="Cicilan piutang"
              value={detail.hutang_piutang.cicilan_piutang}
              className="text-semantic-up"
            />
            <DetailMetric
              label="Cicilan hutang"
              value={detail.hutang_piutang.cicilan_hutang}
              className="text-semantic-down"
            />
            <DetailMetric
              label="Piutang aktif"
              value={detail.hutang_piutang.piutang_aktif}
              className="text-semantic-up"
            />
            <DetailMetric
              label="Hutang aktif"
              value={detail.hutang_piutang.hutang_aktif}
              className="text-semantic-down"
            />
          </div>
          <HutangPiutangList items={detail.hutang_piutang.items} />
        </div>
      </div>

      <BreakdownSection detail={detail} />
    </section>
  );
}
