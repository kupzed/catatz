import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  subtitleAction?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function PageHeader({
  title,
  subtitle,
  action,
  subtitleAction,
  className,
  titleClassName,
  subtitleClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h1
          className={cn(
            "text-[32px] font-normal tracking-[-0.4px] text-foreground leading-tight",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {subtitle || subtitleAction ? (
          subtitleAction ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {subtitle ? (
                <p
                  className={cn(
                    "text-sm text-muted-foreground",
                    subtitleClassName,
                  )}
                >
                  {subtitle}
                </p>
              ) : null}
              {subtitleAction}
            </div>
          ) : (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                subtitleClassName,
              )}
            >
              {subtitle}
            </p>
          )
        ) : null}
      </div>
      {action}
    </div>
  );
}
