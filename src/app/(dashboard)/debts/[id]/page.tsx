import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHutangDetail } from "@/actions/hutang-action";
import { getRekening } from "@/actions/rekening-action";
import { HutangDetailClient } from "./_components/hutang-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await getHutangDetail(id);

  if (!res.success || !res.data) {
    return {
      title: "Detail Hutang",
      description: "Detail catatan hutang dan piutang.",
    };
  }

  return {
    title: `${res.data.nama_entitas} - Hutang & Piutang`,
    description: `Detail transaksi hutang dan piutang dengan ${res.data.nama_entitas}.`,
  };
}

export default async function HutangDetailPage({ params }: Props) {
  const { id } = await params;
  const [res, rekening] = await Promise.all([
    getHutangDetail(id),
    getRekening(),
  ]);

  if (!res.success || !res.data) {
    notFound();
  }

  return <HutangDetailClient initialHutang={res.data} rekening={rekening} />;
}
