import type { Metadata } from 'next';
import { getRekening, getRekeningUsageCountsMap } from '@/actions/rekening-action';
import { getLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';
import RekeningPageClient from './_components/rekening-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.wallets.title,
    description: dict.wallets.subtitle,
  };
}

export default async function RekeningPage() {
  const [rekening, usageCounts] = await Promise.all([
    getRekening(),
    getRekeningUsageCountsMap(),
  ]);

  return (
    <RekeningPageClient
      initialRekening={rekening}
      initialUsageCounts={usageCounts}
    />
  );
}
