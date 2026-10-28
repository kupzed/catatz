import type { Metadata } from 'next';
import { getHutang } from '@/actions/hutang-action';
import { getRekening } from '@/actions/rekening-action';
import { getLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';
import HutangPageClient from './_components/hutang-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.debts.title,
    description: dict.debts.subtitle,
  };
}

export default async function HutangPage() {
  const [hutang, rekening] = await Promise.all([
    getHutang(),
    getRekening(),
  ]);
  return <HutangPageClient initialHutang={hutang} rekening={rekening} />;
}
