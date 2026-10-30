import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import type { Dictionary } from "@/i18n/types";

// Konfigurasi tampilan transaksi yang dipakai lintas komponen transaksi.
export const TIPE_CONFIG = {
  income: {
    label: "Pemasukan",
    icon: ArrowDownLeft,
    color: "text-semantic-up",
    bg: "bg-surface-strong",
    badge: "bg-surface-strong text-muted-foreground",
  },
  expense: {
    label: "Pengeluaran",
    icon: ArrowUpRight,
    color: "text-semantic-down",
    bg: "bg-surface-strong",
    badge: "bg-surface-strong text-muted-foreground",
  },
  transfer: {
    label: "Transfer",
    icon: ArrowLeftRight,
    color: "text-foreground",
    bg: "bg-surface-strong",
    badge: "bg-surface-strong text-muted-foreground",
  },
  correction: {
    label: "Koreksi Saldo",
    icon: SlidersHorizontal,
    color: "text-accent-yellow",
    bg: "bg-surface-strong",
    badge: "bg-surface-strong text-muted-foreground",
  },
} as const;

export function getTipeConfig(dict?: Dictionary) {
  if (!dict) return TIPE_CONFIG;
  return {
    income: {
      ...TIPE_CONFIG.income,
      label: dict.transactions.types.income,
    },
    expense: {
      ...TIPE_CONFIG.expense,
      label: dict.transactions.types.expense,
    },
    transfer: {
      ...TIPE_CONFIG.transfer,
      label: dict.transactions.types.transfer,
    },
    correction: {
      ...TIPE_CONFIG.correction,
      label: dict.transactions.types.correction,
    },
  };
}

export const TIPE_TABS = [
  {
    value: "expense",
    label: "\uD83D\uDD34 Keluar",
    color:
      "data-[state=active]:text-semantic-down data-[state=active]:border-semantic-down",
  },
  {
    value: "income",
    label: "\uD83D\uDFE2 Masuk",
    color:
      "data-[state=active]:text-semantic-up data-[state=active]:border-semantic-up",
  },
  {
    value: "transfer",
    label: "\uD83D\uDD35 Transfer",
    color:
      "data-[state=active]:text-primary data-[state=active]:border-primary",
  },
];

export function getTipeTabs(dict?: Dictionary) {
  if (!dict) return TIPE_TABS;
  return [
    {
      value: "expense",
      label: dict.transactions.tabs.expense,
      color:
        "data-[state=active]:text-semantic-down data-[state=active]:border-semantic-down",
    },
    {
      value: "income",
      label: dict.transactions.tabs.income,
      color:
        "data-[state=active]:text-semantic-up data-[state=active]:border-semantic-up",
    },
    {
      value: "transfer",
      label: dict.transactions.tabs.transfer,
      color:
        "data-[state=active]:text-primary data-[state=active]:border-primary",
    },
  ];
}
