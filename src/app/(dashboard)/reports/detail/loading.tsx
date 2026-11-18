import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RekapDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Skeleton Header & Navigasi Kembali */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-36 rounded-full" />
        <div className="flex items-center gap-2.5 flex-wrap">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Skeleton 3 Kartu Sorotan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-card border border-hairline bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="size-7 rounded-full" />
            </div>
            <Skeleton className="h-7 w-36 rounded" />
            <Skeleton className="mt-2 h-3 w-40 rounded" />
          </Card>
        ))}
      </div>

      {/* Skeleton Grid 2 Kolom: Rincian Lengkap & Grafik Proporsi Saldo */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        {/* Skeleton Rincian Finansial */}
        <Card className="flex h-full flex-col rounded-card border border-hairline bg-card">
          <CardHeader className="p-5 sm:p-6 pb-3 border-b border-hairline">
            <Skeleton className="h-4 w-44 rounded" />
          </CardHeader>
          <CardContent className="flex-1 p-5 sm:p-6 pt-2 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-hairline py-3 last:border-b-0"
              >
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skeleton Grafik Proporsi */}
        <Card className="flex h-full flex-col justify-between rounded-card border border-hairline bg-card">
          <CardHeader className="p-5 sm:p-6 pb-3 border-b border-hairline">
            <Skeleton className="h-4 w-52 rounded" />
          </CardHeader>
          <CardContent className="flex-1 p-5 sm:p-6 pt-4 space-y-5">
            <div className="flex h-60 items-center justify-center">
              <Skeleton className="size-48 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-input" />
              <Skeleton className="h-16 rounded-input" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skeleton Rincian Breakdown Transaksi */}
      <Card className="rounded-card border border-hairline bg-card">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
            </div>
            <Skeleton className="h-10 w-full sm:w-56 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-4 w-44 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-input" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-44 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-input" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
