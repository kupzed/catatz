import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-input border border-hairline bg-background px-4 py-3.5 text-base text-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-soft disabled:opacity-50 aria-invalid:border-semantic-down aria-invalid:ring-2 aria-invalid:ring-semantic-down/20",
        className,
      )}
      suppressHydrationWarning
      {...props}
    />
  );
}

export { Input };
