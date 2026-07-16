"use client";

import React, { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemPreferences } from "@/providers/system-preference-provider";

interface NominalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number | string;
  onValueChange: (value: number | string) => void;
}

export function NominalInput({
  value,
  onValueChange,
  className,
  disabled,
  ...props
}: NominalInputProps) {
  const { preferences } = useSystemPreferences();
  const allowDecimal = preferences.show_decimal_places;
  const formattedValue = formatDisplayValue(
    value,
    preferences.number_format,
    allowDecimal,
  );
  const [draftValue, setDraftValue] = useState(formattedValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const displayValue = isFocused ? draftValue : formattedValue;
  const hasValue = displayValue !== "" && displayValue !== "0";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(
      e.target.value,
      preferences.number_format,
      allowDecimal,
    );

    setDraftValue(parsed.displayValue);

    if (parsed.value === null) {
      onValueChange("");
      return;
    }

    onValueChange(parsed.value);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setDraftValue(formattedValue);
    setIsFocused(true);
    props.onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(
      draftValue,
      preferences.number_format,
      allowDecimal,
    );

    setIsFocused(false);
    setDraftValue(
      parsed.value === null
        ? ""
        : formatDisplayValue(
            parsed.value,
            preferences.number_format,
            allowDecimal,
          ),
    );
    props.onBlur?.(event);
  };

  const handleClear = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onValueChange("");
      setDraftValue("");
      inputRef.current?.focus();
    },
    [onValueChange],
  );

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(hasValue && !disabled && "pr-10", className)}
        {...props}
      />
      {hasValue && !disabled && (
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "flex h-5 w-5 items-center justify-center rounded-full",
            "bg-muted/80 text-muted-foreground",
            "hover:bg-muted hover:text-foreground",
            "transition-colors duration-150",
          )}
          aria-label="Hapus"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function formatDisplayValue(
  value: number | string,
  locale: string,
  allowDecimal: boolean,
) {
  if (value === "") {
    return "";
  }

  const numericValue =
    typeof value === "number"
      ? value
      : Number(value.toString().replace(",", "."));

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: allowDecimal ? 2 : 0,
    maximumFractionDigits: allowDecimal ? 2 : 0,
  }).format(numericValue);
}

function parseDisplayValue(
  rawValue: string,
  locale: string,
  allowDecimal: boolean,
): { displayValue: string; value: number | null } {
  const decimalSeparator = locale === "en-US" ? "." : ",";
  const thousandsSeparator = locale === "en-US" ? "," : ".";
  const sanitizedValue = rawValue.replace(/[^\d.,]/g, "");

  if (!sanitizedValue) {
    return { displayValue: "", value: null };
  }

  if (!allowDecimal) {
    const digits = sanitizedValue.replace(/\D/g, "");
    if (!digits) {
      return { displayValue: "", value: null };
    }

    const value = Number(digits);
    return {
      displayValue: value.toLocaleString(locale),
      value,
    };
  }

  // Strip thousands separators first so they are never mistaken for decimals.
  // e.g. id-ID: "12.345" → strip "." → "12345"; only "," is decimal.
  // e.g. en-US: "12,345" → strip "," → "12345"; only "." is decimal.
  const withoutThousands = sanitizedValue.replaceAll(thousandsSeparator, "");
  const decimalIndex = withoutThousands.lastIndexOf(decimalSeparator);
  const hasDecimalSeparator = decimalIndex >= 0;
  const integerDigits = (
    hasDecimalSeparator
      ? withoutThousands.slice(0, decimalIndex)
      : withoutThousands
  ).replace(/\D/g, "");
  const decimalDigits = hasDecimalSeparator
    ? withoutThousands.slice(decimalIndex + 1).replace(/\D/g, "").slice(0, 2)
    : "";
  const integerValue = integerDigits ? Number(integerDigits) : 0;
  const displayValue = `${integerValue.toLocaleString(locale)}${
    hasDecimalSeparator ? decimalSeparator : ""
  }${decimalDigits}`;
  const numericText = `${integerDigits || "0"}${
    hasDecimalSeparator ? `.${decimalDigits}` : ""
  }`;

  return {
    displayValue,
    value: Number(numericText),
  };
}
