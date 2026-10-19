"use client";

import type { Hutang } from "@/types/hutang";
import { HutangCard } from "./hutang-card";

export type HutangGroupProps = {
  title: string;
  items: Hutang[];
  onEdit: (hutang: Hutang) => void;
  onDelete: (id: string) => void;
};

export function HutangGroup({
  title,
  items,
  onEdit,
  onDelete,
}: HutangGroupProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((h) => (
          <HutangCard
            key={h.id}
            hutang={h}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
