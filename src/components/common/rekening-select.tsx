import * as React from "react";
import type { Rekening } from "@/types/rekening";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  id?: string;
}

export function RekeningSelect({
  rekening,
  value,
  onValueChange,
  placeholder = "Pilih rekening",
  className,
  size = "default",
  includeNone = false,
  noneLabel = "Tanpa rekening",
  disabled = false,
  id,
}: RekeningSelectProps) {
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
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeNone && (
          <SelectItem value="none">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-muted-foreground/30" />
              {noneLabel}
            </span>
          </SelectItem>
        )}
        {rekening.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: r.warna }}
              />
              {r.nama}{" "}
              <span className="text-muted-foreground text-xs ml-1 font-normal">
                ({r.jenis})
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
