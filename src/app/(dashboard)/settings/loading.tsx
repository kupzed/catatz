import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Sidebar Nav (Desktop) */}
        <div className="hidden md:flex md:flex-col md:w-48 md:shrink-0 gap-0.5">
          <div className="flex items-center h-9 px-3 py-2 pl-[calc(0.75rem-2px)] border-l-2 border-primary/20">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center h-9 px-3 py-2 pl-3">
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Mobile Nav strip */}
        <div className="md:hidden">
          <Skeleton className="h-10 w-full rounded-[8px]" />
        </div>

        {/* Content area card */}
        <div className="flex-1 min-w-0">
          <Card className="rounded-card border-hairline">
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-0">
              {/* Row 1: Avatar */}
              <div className="flex items-center justify-between gap-6 py-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>

              <Separator />

              {/* Row 2: Email */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-9 w-full sm:w-64 rounded-input" />
              </div>

              <Separator />

              {/* Row 3: Nama Tampilan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full sm:w-64 rounded-input" />
              </div>

              <Separator />

              {/* Row 4: Tanggal Bergabung */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-9 w-full sm:w-64 rounded-input" />
              </div>

              <Separator />

              {/* Row 5: Save button */}
              <div className="pt-4 flex justify-end">
                <Skeleton className="h-11 w-44 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
