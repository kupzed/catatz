import type { Metadata } from 'next';
import { getKategori } from '@/actions/transaksi-action';
import { getKategoriUsageCountsMap } from '@/actions/kategori-action';
import { getLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';
import KategoriPageClient from './_components/kategori-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.categories.metaTitle,
    description: dict.categories.metaDescription,
  };
}

export default async function KategoriPage() {
  const [kategori, usageCounts] = await Promise.all([
    getKategori(),
    getKategoriUsageCountsMap(),
  ]);

  return (
    <KategoriPageClient
      initialKategori={kategori}
      initialUsageCounts={usageCounts}
    />
  );
}
