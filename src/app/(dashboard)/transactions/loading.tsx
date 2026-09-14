import { Skeleton } from "@/components/ui/skeleton";

export default function TransaksiLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Skeleton className="h-36 w-full rounded-xl" />

      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl sm:h-20" />
        ))}
      </div>
    </div>
  );
}
