import type { Metadata } from 'next';
import { getRekapBulanan, getRekapKategori, getBudgetWithUsage } from '@/actions/rekap-action';
import RekapPageClient from './_components/rekap-page-client';

export const metadata: Metadata = {
  title: 'Rekap',
  description: 'Visualisasi dan analitik keuangan bulanan Anda.',
};

export default async function RekapPage() {
  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  const [bulanan, kategori, budget] = await Promise.all([
    getRekapBulanan(tahun),
    getRekapKategori(bulan, tahun),
    getBudgetWithUsage(bulan, tahun),
  ]);

  return (
    <RekapPageClient
      initialBulanan={bulanan}
      initialKategori={kategori}
      initialBudget={budget}
      currentBulan={bulan}
      currentTahun={tahun}
    />
  );
}
