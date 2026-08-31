import type { Metadata } from 'next';
import {
  getBudgetWithUsage,
  getRekapBulanan,
  getRekapDetailBulanan,
} from '@/actions/rekap-action';
import RekapPageClient from './_components/rekap-page-client';

export const metadata: Metadata = {
  title: 'Rekap',
  description: 'Visualisasi dan analitik keuangan bulanan Anda.',
};

export default async function RekapPage() {
  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  const [bulanan, detail, budget] = await Promise.all([
    getRekapBulanan(tahun),
    getRekapDetailBulanan(bulan, tahun),
    getBudgetWithUsage(bulan, tahun),
  ]);

  return (
    <RekapPageClient
      initialBulanan={bulanan}
      initialDetail={detail}
      initialBudget={budget}
      currentBulan={bulan}
      currentTahun={tahun}
    />
  );
}
