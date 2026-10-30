import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getKategoriById } from "@/actions/kategori-action";
import { getTransaksi, getKategori } from "@/actions/transaksi-action";
import { getRekening } from "@/actions/rekening-action";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { KategoriDetailClient } from "./_components/kategori-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const [res, dict] = await Promise.all([
    getKategoriById(id),
    getDictionary(locale),
  ]);

  if (!res.success || !res.data) {
    return {
      title: dict.categories.detail.title,
      description: dict.categories.detail.fallbackDescription,
    };
  }

  return {
    title: `${res.data.kategori.nama} - ${dict.categories.detail.metaTitleSuffix}`,
    description: `${dict.categories.detail.metaDescPrefix} ${res.data.kategori.nama}.`,
  };
}

export default async function KategoriDetailPage({ params }: Props) {
  const { id } = await params;

  const [kategoriRes, initialTransaksi, allRekening, allKategori] =
    await Promise.all([
      getKategoriById(id),
      getTransaksi({ kategori_id: [id] }),
      getRekening(),
      getKategori(),
    ]);

  if (!kategoriRes.success || !kategoriRes.data) {
    notFound();
  }

  return (
    <KategoriDetailClient
      initialKategori={kategoriRes.data.kategori}
      initialUsage={kategoriRes.data.usage}
      initialTransaksi={initialTransaksi}
      allRekening={allRekening}
      allKategori={allKategori}
    />
  );
}
