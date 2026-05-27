import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actionClassName?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
  actionClassName,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16 text-muted-foreground", className)}>
      <Icon className={cn("h-10 w-10 mx-auto mb-3 opacity-20", iconClassName)} />
      <p className={cn("text-sm", titleClassName)}>{title}</p>
      {description ? (
        <p className={cn("text-xs mt-1", descriptionClassName)}>
          {description}
        </p>
      ) : null}
      {action ? (
        <div className={actionClassName ?? "mt-4"}>{action}</div>
      ) : null}
    </div>
  );
}
