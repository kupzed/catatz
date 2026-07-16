"use client";

import React, { forwardRef, useCallback, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ClearableInput — wraps the base Input with an end-positioned X button
 * that clears the field value when clicked.
 *
 * Works with both controlled (value/onChange) and react-hook-form register()
 * patterns. The clear button is hidden when the field is empty or disabled.
 *
 * Usage with register():
 *   <ClearableInput {...register("fieldName")} onClear={() => setValue("fieldName", "")} />
 *
 * Usage controlled:
 *   <ClearableInput value={val} onChange={...} onClear={() => setVal("")} />
 */
export interface ClearableInputProps
  extends React.ComponentProps<typeof Input> {
  /** Called when the clear button is clicked. MUST be provided
   *  to properly clear the value (especially for react-hook-form). */
  onClear?: () => void;
}

const ClearableInput = forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ className, value, onClear, disabled, onChange, ...props }, ref) => {
    // Track the current value internally to show/hide the clear button.
    // This is necessary for react-hook-form register() where `value` prop
    // is not passed — instead the input is uncontrolled.
    const [internalHasValue, setInternalHasValue] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Merge refs
    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
        // Sync initial value
        if (node) {
          setInternalHasValue(node.value !== "");
        }
      },
      [ref],
    );

    // Determine whether the field has a value
    const isControlled = value !== undefined;
    const hasValue = isControlled
      ? value !== null && value !== ""
      : internalHasValue;

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalHasValue(e.target.value !== "");
        onChange?.(e);
      },
      [onChange],
    );

    const handleClear = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (onClear) {
          onClear();
        } else if (inputRef.current) {
          // Fallback: dispatch native events for uncontrolled inputs
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          nativeInputValueSetter?.call(inputRef.current, "");
          inputRef.current.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
          inputRef.current.dispatchEvent(
            new Event("change", { bubbles: true }),
          );
        }
        setInternalHasValue(false);
        inputRef.current?.focus();
      },
      [onClear],
    );

    return (
      <div className="relative">
        <Input
          ref={mergedRef}
          value={value}
          disabled={disabled}
          onChange={handleInputChange}
          className={cn(hasValue && !disabled && "pr-10", className)}
          {...props}
        />
        {hasValue && !disabled && (
          <button
            type="button"
            tabIndex={-1}
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
  },
);

ClearableInput.displayName = "ClearableInput";

export { ClearableInput };
