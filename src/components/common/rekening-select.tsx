import * as React from "react";
import type { Rekening } from "@/types/rekening";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/use-translation";
import type { Dictionary } from "@/i18n/types";

function getWalletTypeLabel(jenis: string, dict: Dictionary): string {
  switch (jenis) {
    case "Tunai":
      return dict.wallets.types.cash;
    case "Bank":
      return dict.wallets.types.bank;
    case "E-Wallet":
      return dict.wallets.types.ewallet;
    case "Investasi":
      return dict.wallets.types.investment;
    case "Lainnya":
      return dict.wallets.types.other;
    default:
      return jenis;
  }
}

interface RekeningSelectProps {
  rekening: Rekening[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
  includeNone?: boolean;
  noneLabel?: string;
  disabled?: boolean;
  disabledValues?: string[];
  disabledReason?: string;
  id?: string;
}

export function RekeningSelect({
  rekening,
  value,
  onValueChange,
  placeholder,
  className,
  size = "default",
  includeNone = false,
  noneLabel,
  disabled = false,
  disabledValues,
  disabledReason,
  id,
}: RekeningSelectProps) {
  const { dict } = useTranslation();
  const resolvedPlaceholder = placeholder ?? dict.transactions.form.walletPlaceholder;
  const resolvedNoneLabel = noneLabel ?? dict.common.noWallet;

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size={size}
        className={className}
      >
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {includeNone && (
          <SelectItem value="none">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-muted-foreground/30" />
              {resolvedNoneLabel}
            </span>
          </SelectItem>
        )}
        {rekening.map((r) => {
          const isDisabledItem = disabledValues?.includes(r.id);
          return (
            <SelectItem
              key={r.id}
              value={r.id}
              disabled={isDisabledItem}
            >
              <span className="flex items-center gap-2 w-full">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: r.warna }}
                />
                <span className={cn(isDisabledItem && "opacity-50")}>
                  {r.nama}
                </span>{" "}
                <span className="text-muted-foreground text-xs ml-1 font-normal">
                  ({getWalletTypeLabel(r.jenis, dict)})
                </span>
                {isDisabledItem && disabledReason && (
                  <span className="text-[10px] text-muted-foreground ml-auto italic">
                    {disabledReason}
                  </span>
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
