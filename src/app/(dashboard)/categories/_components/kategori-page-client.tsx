"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Kategori, KategoriUsageCounts } from "@/types/transaksi";
import { deleteKategori } from "@/actions/kategori-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import KategoriDialog from "./kategori-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState, PageHeader } from "@/components/common";
import { ClearableInput } from "@/components/common/clearable-input";
import { useTranslation } from "@/i18n/use-translation";
import type { Dictionary } from "@/i18n/types";
import { cn } from "@/lib/utils";

type Props = {
  initialKategori?: Kategori[];
  kategori?: Kategori[]; // fallback for backward compatibility
  initialUsageCounts?: Record<string, KategoriUsageCounts>;
};

function TipeBadge({
  tipe,
  dict,
}: {
  tipe: Kategori["tipe"];
  dict: Dictionary;
}) {
  const isExpense = tipe === "expense";
  const isIncome = tipe === "income";

  const color = isExpense
    ? "text-semantic-down bg-semantic-down/10"
    : isIncome
      ? "text-semantic-up bg-semantic-up/10"
      : "text-primary bg-primary/10";

  const label = isExpense
    ? dict.categories.types.expense
    : isIncome
      ? dict.categories.types.income
      : dict.categories.types.all;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-none",
        color,
      )}
    >
      {label}
    </span>
  );
}

function getUsageDescription(usage: KategoriUsageCounts, dict: Dictionary) {
  const parts = [
    usage.transaksi > 0
      ? dict.categories.usageTx.replace("{count}", String(usage.transaksi))
      : null,
    usage.budget > 0
      ? dict.categories.usageBudget.replace("{count}", String(usage.budget))
      : null,
    usage.recurring > 0
      ? dict.categories.usageRecurring.replace(
          "{count}",
          String(usage.recurring),
        )
      : null,
  ].filter(Boolean);

  return dict.categories.usageWarning.replace("{parts}", parts.join(", "));
}

export default function KategoriPageClient({
  initialKategori,
  kategori: fallbackKategori,
  initialUsageCounts = {},
}: Props) {
  const router = useRouter();
  const { dict } = useTranslation();
  const rawList = initialKategori ?? fallbackKategori ?? [];
  const [items, setItems] = useState<Kategori[]>(rawList);
  const [usageCounts, setUsageCounts] = useState<Record<string, KategoriUsageCounts>>(initialUsageCounts);
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | null>(null);
  const [, startTransition] = useTransition();

  // Sync if props update
  const [prevInitial, setPrevInitial] = useState(rawList);
  if (rawList !== prevInitial) {
    setPrevInitial(rawList);
    setItems(rawList);
  }

  // Summary counts
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let all = 0;
    for (const k of items) {
      if (k.tipe === "income") income++;
      else if (k.tipe === "expense") expense++;
      else all++;
    }
    return { total: items.length, income, expense, all };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((k) => {
      const matchSearch =
        !search ||
        k.nama.toLowerCase().includes(search.toLowerCase()) ||
        (k.ikon ?? "").includes(search);
      const matchTipe =
        filterTipe === "all" || k.tipe === filterTipe || k.tipe === "all";
      return matchSearch && matchTipe;
    });
  }, [items, search, filterTipe]);

  function handleOpenAdd() {
    setEditTarget(null);
    setShowDialog(true);
  }

  function handleEdit(k: Kategori) {
    setEditTarget(k);
    setShowDialog(true);
  }

  function handleDelete(k: Kategori) {
    startTransition(async () => {
      const res = await deleteKategori(k.id);
      if (res.success) {
        setItems((prev) => prev.filter((x) => x.id !== k.id));
        setUsageCounts((prev) => {
          const next = { ...prev };
          delete next[k.id];
          return next;
        });
        toast.success(dict.categories.toasts.deleted.replace("{name}", k.nama));
      } else {
        toast.error(res.error ?? dict.categories.toasts.deleteFailed);
      }
    });
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title={dict.categories.title}
        subtitle={dict.categories.subtitle}
        subtitleClassName="mt-0.5"
        action={
          <Button
            onClick={handleOpenAdd}
            className="gap-2 bg-primary hover:bg-primary-active text-white rounded-full font-semibold shrink-0"
            id="btn-tambah-kategori"
          >
            <Plus className="h-4 w-4" />
            {dict.categories.add}
          </Button>
        }
      />

      {/* Summary Card */}
      <div className="rounded-card border border-hairline bg-card p-5 sm:p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              {dict.categories.totalCategories}
            </p>
            <p className="font-mono text-3xl sm:text-4xl font-normal text-foreground">
              {summary.total}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
            <div className="bg-surface-strong dark:bg-surface-dark-elevated rounded-full px-3.5 py-1.5 border border-hairline flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">{dict.categories.expenseLabel}</span>
              <span className="font-mono font-semibold text-semantic-down">{summary.expense}</span>
            </div>
            <div className="bg-surface-strong dark:bg-surface-dark-elevated rounded-full px-3.5 py-1.5 border border-hairline flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">{dict.categories.incomeLabel}</span>
              <span className="font-mono font-semibold text-semantic-up">{summary.income}</span>
            </div>
            <div className="bg-surface-strong dark:bg-surface-dark-elevated rounded-full px-3.5 py-1.5 border border-hairline flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">{dict.categories.allTypesLabel}</span>
              <span className="font-mono font-semibold text-primary">{summary.all}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <ClearableInput
            id="kategori-search"
            placeholder={dict.categories.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            className="pl-9 h-11 rounded-input bg-card border-hairline"
          />
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-strong p-1 sm:inline-grid sm:w-auto h-11 items-center">
          {[
            { id: "all", label: dict.categories.types.all },
            { id: "expense", label: dict.categories.types.expense },
            { id: "income", label: dict.categories.types.income },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTipe(tab.id)}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors sm:px-4 cursor-pointer",
                filterTipe === tab.id
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Categories */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={
            search || filterTipe !== "all"
              ? dict.categories.emptySearchTitle
              : dict.categories.emptyState
          }
          description={
            search || filterTipe !== "all"
              ? dict.categories.emptySearchDescription
              : dict.categories.emptyStateDescription
          }
          action={
            <Button
              variant="link"
              onClick={handleOpenAdd}
              className="mt-2 text-primary font-semibold"
            >
              {dict.categories.addNew}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((k) => {
            const usage = usageCounts[k.id];
            const isUsed = (usage?.total ?? 0) > 0;

            return (
              <div
                key={k.id}
                onClick={() => router.push(`/categories/${k.id}`)}
                className="relative rounded-card border border-hairline bg-card p-5 transition-colors hover:bg-surface-soft group border-t-4 cursor-pointer flex flex-col justify-between"
                style={{ borderTopColor: k.warna ?? undefined }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-input flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: k.warna ? `${k.warna}20` : undefined,
                        }}
                      >
                        {k.ikon ?? "📂"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {k.nama}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <TipeBadge tipe={k.tipe} dict={dict} />
                          {isUsed && usage ? (
                            <Link
                              href={`/categories/${k.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-block"
                              title={dict.categories.viewHistoryTitle}
                            >
                              <Badge
                                variant="secondary"
                                className="text-xs rounded-full bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors cursor-pointer"
                              >
                                {dict.categories.usedCount.replace(
                                  "{count}",
                                  String(usage.total),
                                )}
                              </Badge>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full bg-surface-strong text-foreground hover:bg-surface-strong/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(k);
                        }}
                        aria-label={dict.categories.editAria.replace(
                          "{name}",
                          k.nama,
                        )}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {isUsed && usage ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.warning(getUsageDescription(usage, dict));
                          }}
                          aria-label={dict.categories.deleteAria.replace(
                            "{name}",
                            k.nama,
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <ConfirmDialog
                          title={dict.categories.deleteItemConfirmTitle.replace(
                            "{name}",
                            k.nama,
                          )}
                          description={
                            dict.categories.deleteItemConfirmDescription
                          }
                          onConfirm={() => handleDelete(k)}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20"
                            aria-label={dict.categories.deleteAria.replace(
                              "{name}",
                              k.nama,
                            )}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </ConfirmDialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <KategoriDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editData={editTarget}
        onCreated={(k) => {
          setItems((prev) => [...prev, k]);
        }}
        onUpdated={(k) => {
          setItems((prev) => prev.map((x) => (x.id === k.id ? k : x)));
        }}
      />
    </div>
  );
}
