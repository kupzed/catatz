import React from "react";
import { Input } from "@/components/ui/input";

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
  const displayValue = formatDisplayValue(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    // Remove all non-numeric characters
    rawValue = rawValue.replace(/[^0-9]/g, "");
    
    if (rawValue === "") {
      onValueChange("");
      return;
    }

    const numValue = parseInt(rawValue, 10);
    onValueChange(numValue);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}

function formatDisplayValue(value: number | string) {
  if (value === "") {
    return "";
  }

  if (value === 0 || value === "0") {
    return "0";
  }

  const numStr = value.toString().replace(/[^0-9]/g, "");
  if (!numStr) {
    return "";
  }

  return parseInt(numStr, 10).toLocaleString("id-ID");
}
