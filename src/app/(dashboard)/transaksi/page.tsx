import type { Metadata } from 'next';
import { getTransaksi, getKategori } from '@/actions/transaksi-action';
import { getRekening } from '@/actions/rekening-action';
import TransaksiPageClient from './_components/transaksi-page-client';

export const metadata: Metadata = {
  title: 'Transaksi',
  description: 'Catat dan kelola transaksi keuangan Anda.',
};

export default async function TransaksiPage() {
  const [transaksi, rekening, kategori] = await Promise.all([
    getTransaksi(),
    getRekening(),
    getKategori(),
  ]);

  return (
    <TransaksiPageClient
      initialTransaksi={transaksi}
      rekening={rekening}
      kategori={kategori}
    />
  );
}
