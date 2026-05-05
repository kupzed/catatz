import React, { useState, useEffect } from "react";
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
  const [displayValue, setDisplayValue] = useState("");

  // Update display value when actual value changes externally
  useEffect(() => {
    if (value === "" || value === 0 || value === "0") {
      setDisplayValue(value === 0 || value === "0" ? "0" : "");
    } else if (value) {
      // Keep only numbers and dots
      const numStr = value.toString().replace(/[^0-9]/g, "");
      if (numStr) {
        // Format with thousand separators
        setDisplayValue(
          parseInt(numStr, 10).toLocaleString("id-ID")
        );
      } else {
        setDisplayValue("");
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    // Remove all non-numeric characters
    rawValue = rawValue.replace(/[^0-9]/g, "");
    
    if (rawValue === "") {
      setDisplayValue("");
      onValueChange("");
      return;
    }

    const numValue = parseInt(rawValue, 10);
    
    // Format for display
    setDisplayValue(numValue.toLocaleString("id-ID"));
    
    // Pass raw number to parent
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
