import { Skeleton } from "@/components/ui/skeleton";

export default function RekeningDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-44 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      </div>

      {/* Saldo Hero Skeleton */}
      <div className="rounded-card border border-hairline bg-card p-6 sm:p-8 space-y-3">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-10 w-60 rounded-md" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>

      {/* Transactions List Skeleton */}
      <div className="rounded-card border border-hairline bg-card p-5 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
