import type { Metadata } from 'next';
import { getKategori } from '@/actions/transaksi-action';
import { getKategoriUsageCountsMap } from '@/actions/kategori-action';
import KategoriPageClient from './_components/kategori-page-client';

export const metadata: Metadata = {
  title: 'Kategori',
  description: 'Kelola kategori transaksi Anda di CatatZ.',
};

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
