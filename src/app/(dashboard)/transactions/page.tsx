import type { Metadata } from 'next';
import { getTransaksi, getKategori } from '@/actions/transaksi-action';
import { getRekening } from '@/actions/rekening-action';
import { getLocale } from '@/i18n/get-locale';
import { getDictionary } from '@/i18n/get-dictionary';
import TransaksiPageClient from './_components/transaksi-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.transactions.title,
    description: dict.transactions.subtitle,
  };
}

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
