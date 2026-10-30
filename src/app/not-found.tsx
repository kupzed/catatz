import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

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
          <p className="text-sm font-semibold text-primary">
            404
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {dict.notFound.title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {dict.notFound.description}
          </p>
        </div>
        <Button asChild className="rounded-full bg-primary text-white hover:bg-[#003ecc]">
          <Link href="/transactions">{dict.notFound.backLink}</Link>
        </Button>
      </div>
    </main>
  );
}
