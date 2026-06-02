"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSystemPreferences } from "@/providers/system-preference-provider";
import {
  cn,
  fromTwelveHourTimeParts,
  normalizeTimeValue,
  toTwelveHourTimeParts,
} from "@/lib/utils";

type TimeInputProps = {
  id?: string;
  value?: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

const HOURS_12 = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

export function TimeInput({
  id,
  value,
  onValueChange,
  disabled,
  className,
}: TimeInputProps) {
  const { preferences } = useSystemPreferences();
  const normalized = normalizeTimeValue(value);

  if (preferences.time_format !== "12h") {
    return (
      <Input
        id={id}
        type="time"
        value={normalized}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled}
        className={cn(
          "w-full appearance-none bg-background border-input",
          className,
        )}
      />
    );
  }

  const parts = toTwelveHourTimeParts(normalized);

  function updatePart(next: Partial<typeof parts>) {
    const updated = { ...parts, ...next };
    onValueChange(
      fromTwelveHourTimeParts(updated.hour, updated.minute, updated.period),
    );
  }

  return (
    <div className={cn("grid grid-cols-[1fr_1fr_76px] gap-2", className)}>
      <Select
        value={parts.hour}
        onValueChange={(hour) => updatePart({ hour })}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-12 px-3 text-sm">
          <SelectValue aria-label={`${parts.hour} jam`} />
        </SelectTrigger>
        <SelectContent>
          {HOURS_12.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour.padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={parts.minute}
        onValueChange={(minute) => updatePart({ minute })}
        disabled={disabled}
      >
        <SelectTrigger className="h-12 px-3 text-sm">
          <SelectValue aria-label={`${parts.minute} menit`} />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((minute) => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={parts.period}
        onValueChange={(period) => updatePart({ period: period as "AM" | "PM" })}
        disabled={disabled}
      >
        <SelectTrigger className="h-12 px-3 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
