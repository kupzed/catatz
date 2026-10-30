"use client";

import { SlidersHorizontal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTipeTabs } from "@/constants/transaksi";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/use-translation";
import type { TransaksiSchema } from "@/validations/transaksi-validation";

type TransaksiTipeTabsProps = {
  isCorrection: boolean;
  tipe: TransaksiSchema["tipe"];
  onTipeChange: (tipe: TransaksiSchema["tipe"]) => void;
  allowedTipe?: TransaksiSchema["tipe"][];
};

export function TransaksiTipeTabs({
  isCorrection,
  tipe,
  onTipeChange,
  allowedTipe,
}: TransaksiTipeTabsProps) {
  const { dict } = useTranslation();

  if (isCorrection) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <SlidersHorizontal className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
          {dict.transactions.types.correction}
        </span>
        <span className="text-xs text-amber-600 dark:text-amber-500 ml-auto">
          {dict.transactions.tabs.typeCannotBeChanged}
        </span>
      </div>
    );
  }

  const allTabs = getTipeTabs(dict);
  const tabs = allowedTipe
    ? allTabs.filter((t) =>
        allowedTipe.includes(t.value as TransaksiSchema["tipe"]),
      )
    : allTabs;

  const gridColsClass =
    tabs.length === 1
      ? "grid-cols-1"
      : tabs.length === 2
      ? "grid-cols-2"
      : "grid-cols-3";

  return (
    <Tabs
      value={tipe}
      onValueChange={(v) => onTipeChange(v as TransaksiSchema["tipe"])}
    >
      <TabsList className={cn("w-full grid", gridColsClass)}>
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={cn("text-xs", t.color)}
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
