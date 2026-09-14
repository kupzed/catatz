import type { Metadata } from 'next';
import { getHutang } from '@/actions/hutang-action';
import { getRekening } from '@/actions/rekening-action';
import HutangPageClient from './_components/hutang-page-client';

export const metadata: Metadata = {
  title: 'Hutang',
  description: 'Kelola piutang dan hutang Anda dengan mudah.',
};

export default async function HutangPage() {
  const hutang = await getHutang();
  const rekening = await getRekening();
  return <HutangPageClient initialHutang={hutang} rekening={rekening} />;
}
