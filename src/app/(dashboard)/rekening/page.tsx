import type { Metadata } from 'next';
import { getRekening } from '@/actions/rekening-action';
import RekeningPageClient from './_components/rekening-page-client';

export const metadata: Metadata = {
  title: 'Rekening',
  description: 'Kelola rekening, dompet, dan sumber dana Anda.',
};

export default async function RekeningPage() {
  const rekening = await getRekening();
  return <RekeningPageClient initialRekening={rekening} />;
}
