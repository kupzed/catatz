import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getRekapSettings } from '@/actions/rekap-period-action';
import { DEFAULT_REKAP_SETTINGS } from '@/validations/rekap-validation';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale } from '@/i18n/get-locale';
import RekapPageClient from './_components/rekap-page-client';
import RekapLoading from './loading';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.reports.title,
    description: dict.reports.subtitle,
  };
}

export default async function RekapPage() {
  const res = await getRekapSettings();
  const settings = res.success && res.data ? res.data : DEFAULT_REKAP_SETTINGS;

  return (
    <Suspense fallback={<RekapLoading />}>
      <RekapPageClient initialSettings={settings} />
    </Suspense>
  );
}
