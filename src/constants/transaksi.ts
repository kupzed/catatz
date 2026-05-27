import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";

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
