import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRekening, getRekeningById } from "@/actions/rekening-action";
import { getTransaksi, getKategori } from "@/actions/transaksi-action";
import { RekeningDetailClient } from "./_components/rekening-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await getRekeningById(id);

  if (!res.success || !res.data) {
    return {
      title: "Detail Rekening",
      description: "Detail rekening dan riwayat transaksi.",
    };
  }

  return {
    title: `${res.data.rekening.nama} - Detail Rekening | CatatZ`,
    description: `Riwayat dan catatan transaksi untuk rekening ${res.data.rekening.nama}.`,
  };
}

export default async function RekeningDetailPage({ params }: Props) {
  const { id } = await params;

  const [rekeningRes, initialTransaksi, allRekening, kategori] =
    await Promise.all([
      getRekeningById(id),
      getTransaksi({ rekening_id: [id] }),
      getRekening(),
      getKategori(),
    ]);

  if (!rekeningRes.success || !rekeningRes.data) {
    notFound();
  }

  return (
    <RekeningDetailClient
      initialRekening={rekeningRes.data.rekening}
      initialUsage={rekeningRes.data.usage}
      initialTransaksi={initialTransaksi}
      allRekening={allRekening}
      kategori={kategori}
    />
  );
}
