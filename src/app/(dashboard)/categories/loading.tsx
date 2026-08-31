import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function KategoriLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* Filter Bar */}
      <div className="rounded-card border border-hairline bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-10 w-full lg:max-w-sm rounded-input" />
          <Skeleton className="h-11 w-full sm:w-80 rounded-full" />
        </div>
      </div>

      {/* Custom Kategori Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="grid gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="w-8 h-8 rounded-[8px]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* System Kategori Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="grid gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="w-8 h-8 rounded-[8px]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
