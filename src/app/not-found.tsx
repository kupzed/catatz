import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="max-w-md space-y-5">
        <Image
          src="/catatz.svg"
          alt="CatatZ"
          width={64}
          height={64}
          className="mx-auto h-16 w-16 rounded-full"
        />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            404
          </p>
          <h1 className="text-2xl font-bold text-foreground">Halaman tidak ditemukan</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Link ini mungkin sudah berubah atau tidak tersedia.
          </p>
        </div>
        <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-500">
          <Link href="/transactions">Ke Transaksi</Link>
        </Button>
      </div>
    </main>
  );
}
