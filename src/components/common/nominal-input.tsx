"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useSystemPreferences } from "@/providers/system-preference-provider";

interface NominalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number | string;
  onValueChange: (value: number | string) => void;
}

export function NominalInput({
  value,
  onValueChange,
  className,
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

  return (
    <Input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={isFocused ? draftValue : formattedValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
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

  const dotIndex = sanitizedValue.lastIndexOf(".");
  const commaIndex = sanitizedValue.lastIndexOf(",");
  const decimalIndex = Math.max(dotIndex, commaIndex);
  const hasDecimalSeparator = decimalIndex >= 0;
  const integerDigits = (
    hasDecimalSeparator
      ? sanitizedValue.slice(0, decimalIndex)
      : sanitizedValue
  ).replace(/\D/g, "");
  const decimalDigits = hasDecimalSeparator
    ? sanitizedValue.slice(decimalIndex + 1).replace(/\D/g, "").slice(0, 2)
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
