import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getKategoriById } from "@/actions/kategori-action";
import { getTransaksi, getKategori } from "@/actions/transaksi-action";
import { getRekening } from "@/actions/rekening-action";
import { KategoriDetailClient } from "./_components/kategori-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await getKategoriById(id);

  if (!res.success || !res.data) {
    return {
      title: "Detail Kategori",
      description: "Detail kategori dan riwayat transaksi.",
    };
  }

  return {
    title: `${res.data.kategori.nama} - Detail Kategori | CatatZ`,
    description: `Riwayat dan catatan transaksi untuk kategori ${res.data.kategori.nama}.`,
  };
}

export default async function KategoriDetailPage({ params }: Props) {
  const { id } = await params;

  const [kategoriRes, initialTransaksi, allRekening, allKategori] =
    await Promise.all([
      getKategoriById(id),
      getTransaksi({ kategori_id: [id] }),
      getRekening(),
      getKategori(),
    ]);

  if (!kategoriRes.success || !kategoriRes.data) {
    notFound();
  }

  return (
    <KategoriDetailClient
      initialKategori={kategoriRes.data.kategori}
      initialUsage={kategoriRes.data.usage}
      initialTransaksi={initialTransaksi}
      allRekening={allRekening}
      allKategori={allKategori}
    />
  );
}
