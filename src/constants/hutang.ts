import type { Dictionary } from "@/i18n/types";
import type { StatusHutang } from "@/types/hutang";

// Konfigurasi badge status hutang yang dipakai lintas komponen hutang.
export const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-primary/10 text-primary",
  lunas: "bg-semantic-up/10 text-semantic-up",
  overdue: "bg-semantic-down/10 text-semantic-down",
};

/**
 * Returns localized label for debt status (StatusHutang).
 * Defaults to original string if dictionary is not provided.
 */
export function getStatusHutangDisplay(
  status: StatusHutang | string,
  dict?: Dictionary
): string {
  if (dict) {
    switch (status) {
      case "aktif":
        return dict.debts.status.active;
      case "lunas":
        return dict.debts.status.paidOff;
      case "overdue":
        return dict.debts.status.overdue;
      default:
        return status;
    }
  }
  return status;
}
