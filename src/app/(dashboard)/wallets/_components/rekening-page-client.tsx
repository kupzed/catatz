"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  JenisRekening,
  Rekening,
  RekeningUsageCounts,
} from "@/types/rekening";
import { deleteRekening, toggleExcludeTotal } from "@/actions/rekening-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Landmark,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import RekeningDialog from "./rekening-dialog";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState, PageHeader } from "@/components/common";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import { useTranslation } from "@/i18n/use-translation";
import { getJenisDisplay } from "@/constants/banks";
import type { Dictionary } from "@/i18n/types";

type Props = {
  initialRekening: Rekening[];
  initialUsageCounts: Record<string, RekeningUsageCounts>;
};

const JENIS_CONFIG: Record<
  JenisRekening,
  { icon: React.ElementType; color: string }
> = {
  Tunai: { icon: Wallet, color: "text-amber-500 bg-amber-500/10" },
  Bank: { icon: Landmark, color: "text-blue-500 bg-blue-500/10" },
  "E-Wallet": { icon: Smartphone, color: "text-purple-500 bg-purple-500/10" },
  Investasi: { icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
};

const JENIS_ORDER: JenisRekening[] = ["Bank", "E-Wallet", "Tunai", "Investasi"];

function usageDescription(usage: RekeningUsageCounts, dict: Dictionary) {
  const parts = [
    usage.transaksi_masuk > 0
      ? `${usage.transaksi_masuk} ${dict.wallets.usage.income}`
      : null,
    usage.transaksi_keluar > 0
      ? `${usage.transaksi_keluar} ${dict.wallets.usage.expense}`
      : null,
    usage.transfer_keluar > 0
      ? `${usage.transfer_keluar} ${dict.wallets.usage.transferOut}`
      : null,
    usage.transfer_masuk > 0
      ? `${usage.transfer_masuk} ${dict.wallets.usage.transferIn}`
      : null,
    usage.koreksi_saldo > 0
      ? `${usage.koreksi_saldo} ${dict.wallets.usage.balanceCorrection}`
      : null,
    usage.hutang > 0 ? `${usage.hutang} ${dict.wallets.usage.debt}` : null,
    usage.hutang_cicilan > 0
      ? `${usage.hutang_cicilan} ${dict.wallets.usage.installment}`
      : null,
    usage.recurring_asal > 0
      ? `${usage.recurring_asal} ${dict.wallets.usage.recurringOrigin}`
      : null,
    usage.recurring_tujuan > 0
      ? `${usage.recurring_tujuan} ${dict.wallets.usage.recurringDestination}`
      : null,
  ].filter(Boolean);

  if (parts.length === 0 && usage.transaksi_asal > 0) {
    parts.push(`${usage.transaksi_asal} ${dict.wallets.usage.transactions}`);
  }
  if (parts.length === 0 && usage.transaksi_tujuan > 0) {
    parts.push(`${usage.transaksi_tujuan} ${dict.wallets.usage.transferIn}`);
  }

  return `${dict.wallets.usage.prefix} ${parts.join(", ")}. ${dict.wallets.usage.suffix}`;
}

export default function RekeningPageClient({
  initialRekening,
  initialUsageCounts,
}: Props) {
  const router = useRouter();
  const { formatRupiah } = useSystemPreferences();
  const { dict } = useTranslation();
  const [rekening, setRekening] = useState(initialRekening);
  const [usageCounts, setUsageCounts] = useState(initialUsageCounts);
  const [prevInitialRekening, setPrevInitialRekening] = useState(initialRekening);
  const [prevInitialUsageCounts, setPrevInitialUsageCounts] = useState(initialUsageCounts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Rekening | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (initialRekening !== prevInitialRekening) {
    setPrevInitialRekening(initialRekening);
    setRekening(initialRekening);
  }

  if (initialUsageCounts !== prevInitialUsageCounts) {
    setPrevInitialUsageCounts(initialUsageCounts);
    setUsageCounts(initialUsageCounts);
  }

  const totalSaldo = useMemo(
    () =>
      rekening
        .filter((r) => !r.exclude_total)
        .reduce((s, r) => s + Number(r.saldo_saat_ini), 0),
    [rekening],
  );

  const grouped = useMemo(() => {
    const g: Partial<Record<JenisRekening, Rekening[]>> = {};
    JENIS_ORDER.forEach((j) => {
      const items = rekening.filter((r) => r.jenis === j);
      if (items.length > 0) g[j] = items;
    });
    return g;
  }, [rekening]);

  async function handleDelete(id: string) {
    const usage = usageCounts[id];
    if ((usage?.total ?? 0) > 0) {
      toast.warning(usageDescription(usage, dict));
      return;
    }

    setDeleting(id);
    const res = await deleteRekening(id);
    if (res.success) {
      setRekening((prev) => prev.filter((r) => r.id !== id));
      setUsageCounts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success(dict.wallets.toasts.deleted);
    } else {
      toast.error(res.error ?? dict.wallets.toasts.deleteFailed);
    }
    setDeleting(null);
  }

  async function handleExcludeToggle(id: string, current: boolean) {
    const res = await toggleExcludeTotal(id, !current);
    if (res.success) {
      setRekening((prev) =>
        prev.map((r) => (r.id === id ? { ...r, exclude_total: !current } : r)),
      );
    } else {
      toast.error(res.error ?? dict.wallets.toasts.updateFailed);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={dict.wallets.title}
        subtitle={dict.wallets.subtitle}
        action={
          <Button
            onClick={() => {
              setEditData(null);
              setDialogOpen(true);
            }}
            className="gap-2 bg-primary hover:bg-primary-active text-white rounded-full font-semibold"
            id="btn-tambah-rekening"
          >
            <Plus className="h-4 w-4" />
            {dict.common.add}
          </Button>
        }
      />

      {/* Total Balance Card */}
      <div className="rounded-card bg-primary p-5 text-white ring-1 ring-white/5 sm:p-8">
        <p className="text-sm text-white uppercase tracking-wider mb-2">
          {dict.wallets.totalActiveBalance}
        </p>
        <p className="break-all font-mono text-[28px] font-normal tracking-0 text-white leading-tight sm:text-[40px] lg:text-[44px]">
          {formatRupiah(totalSaldo)}
        </p>
        <p className="text-xs text-white/60 mt-3">
          {dict.wallets.walletsExcluded.replace(
            "{count}",
            String(rekening.filter((r) => r.exclude_total).length),
          )}
        </p>
      </div>

      {/* Grouped Cards */}
      {rekening.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={dict.wallets.emptyState}
          description={dict.wallets.emptyStateDesc}
        />
      ) : (
        Object.entries(grouped).map(([jenis, items]) => {
          const cfg = JENIS_CONFIG[jenis as JenisRekening];
          const JenisIcon = cfg.icon;
          return (
            <div key={jenis}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <JenisIcon className="h-4 w-4" />
                {getJenisDisplay(jenis, dict)}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {items!.map((r) => {
                  const usage = usageCounts[r.id];
                  const isUsed = (usage?.total ?? 0) > 0;

                  return (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/wallets/${r.id}`)}
                      className={cn(
                        "relative rounded-card border border-hairline bg-card p-6 transition-colors hover:bg-surface-soft group border-t-2 cursor-pointer",
                        r.exclude_total && "opacity-60",
                      )}
                      style={{ borderTopColor: r.warna ?? undefined }}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {r.nama}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-xs mt-0.5 rounded-full bg-surface-strong text-muted-foreground"
                            >
                              {getJenisDisplay(r.jenis, dict)}
                            </Badge>
                            {isUsed && usage ? (
                              <Link
                                href={`/wallets/${r.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block"
                                title={dict.wallets.viewDetailTitle}
                              >
                                <Badge
                                  variant="secondary"
                                  className="ml-1.5 text-xs mt-0.5 rounded-full bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors cursor-pointer"
                                >
                                  {dict.wallets.usedCount.replace(
                                    "{count}",
                                    String(usage.total),
                                  )}
                                </Badge>
                              </Link>
                            ) : null}
                          </div>
                          <div
                            className="flex gap-1 flex-wrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-surface-strong hover:bg-surface-strong/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditData(r);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {isUsed && usage ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.warning(usageDescription(usage, dict));
                                }}
                                title={dict.wallets.walletInUse}
                                aria-label={dict.wallets.walletInUseAria.replace(
                                  "{name}",
                                  r.nama,
                                )}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <ConfirmDialog
                                title={dict.wallets.deleteConfirmTitle}
                                description={dict.wallets.deleteConfirmDescription}
                                onConfirm={() => handleDelete(r.id)}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
                                  disabled={deleting === r.id}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </ConfirmDialog>
                            )}
                          </div>
                        </div>
                        <p className="font-mono text-xl font-medium text-foreground mt-3">
                          {formatRupiah(Number(r.saldo_saat_ini))}
                        </p>
                        <div
                          className="flex items-center gap-2 mt-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={!r.exclude_total}
                            onCheckedChange={() =>
                              handleExcludeToggle(r.id, r.exclude_total)
                            }
                            id={`exclude-${r.id}`}
                            className="scale-75"
                          />
                          <label
                            htmlFor={`exclude-${r.id}`}
                            className="text-xs text-muted-foreground cursor-pointer"
                          >
                            {r.exclude_total
                              ? dict.wallets.excludedFromTotal
                              : dict.wallets.includedInTotal}
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <RekeningDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditData(null);
        }}
        editData={editData}
        onCreated={(r) => {
          setRekening((prev) => [...prev, r]);
          setUsageCounts((prev) => ({
            ...prev,
            [r.id]: {
              transaksi_masuk: 0,
              transaksi_keluar: 0,
              transfer_keluar: 0,
              transfer_masuk: 0,
              koreksi_saldo: 0,
              hutang: 0,
              hutang_cicilan: 0,
              recurring_asal: 0,
              recurring_tujuan: 0,
              transaksi_asal: 0,
              transaksi_tujuan: 0,
              total: 0,
            },
          }));
          setDialogOpen(false);
        }}
        onUpdated={(r) => {
          setRekening((prev) => prev.map((x) => (x.id === r.id ? r : x)));
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
