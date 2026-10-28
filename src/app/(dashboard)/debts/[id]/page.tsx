import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHutangDetail } from "@/actions/hutang-action";
import { getRekening } from "@/actions/rekening-action";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { HutangDetailClient } from "./_components/hutang-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const [res, dict] = await Promise.all([
    getHutangDetail(id),
    getDictionary(locale),
  ]);

  if (!res.success || !res.data) {
    return {
      title: dict.debts.detail.title,
      description: dict.debts.detail.fallbackDescription,
    };
  }

  return {
    title: `${res.data.nama_entitas} - ${dict.debts.detail.title}`,
    description: `${dict.debts.detail.metaDescriptionPrefix} ${res.data.nama_entitas}.`,
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
