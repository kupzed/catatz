import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRekapDetailByRange } from '@/actions/rekap-action';
import { getCustomPeriod, getRekapSettings } from '@/actions/rekap-period-action';
import { getSaldoPeriodeList } from '@/actions/rekap-saldo-action';
import { DEFAULT_REKAP_SETTINGS, rekapDetailQuerySchema } from '@/validations/rekap-validation';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale } from '@/i18n/get-locale';
import { RekapDetailClient } from './_components/rekap-detail-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.reports.detail.title,
    description: dict.reports.detail.description,
  };
};

type RekapDetailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RekapDetailPage(props: RekapDetailPageProps) {
  const resolvedSearchParams = await props.searchParams;

  const rawDari = Array.isArray(resolvedSearchParams.dari)
    ? resolvedSearchParams.dari[0]
    : resolvedSearchParams.dari;
  const rawSampai = Array.isArray(resolvedSearchParams.sampai)
    ? resolvedSearchParams.sampai[0]
    : resolvedSearchParams.sampai;
  const rawJenis = Array.isArray(resolvedSearchParams.jenis)
    ? resolvedSearchParams.jenis[0]
    : resolvedSearchParams.jenis;
  const rawId = Array.isArray(resolvedSearchParams.id)
    ? resolvedSearchParams.id[0]
    : resolvedSearchParams.id;

  const parseResult = rekapDetailQuerySchema.safeParse({
    dari: rawDari,
    sampai: rawSampai,
    jenis: rawJenis,
    id: rawId,
  });

  if (!parseResult.success) {
    notFound();
  }

  const { dari, sampai, jenis, id } = parseResult.data;

  // Ambil data detail rekap, setting siklus, dan periode kustom (jika berlaku) secara paralel
  const [settingsRes, detailResult, customRes] = await Promise.all([
    getRekapSettings(),
    getRekapDetailByRange(dari, sampai).catch((err) => {
      console.error('Failed to getRekapDetailByRange:', err);
      return null;
    }),
    jenis === 'custom' && id ? getCustomPeriod(id) : Promise.resolve(null),
  ]);

  // Jika data transaksi detail tidak dapat dimuat, alihkan ke 404
  if (!detailResult) {
    notFound();
  }

  // Jika jenis custom dengan id spesifik diminta namun tidak ditemukan di database
  if (jenis === 'custom' && id) {
    if (!customRes || !customRes.success || !customRes.data) {
      notFound();
    }
  }

  const settings =
    settingsRes.success && settingsRes.data ? settingsRes.data : DEFAULT_REKAP_SETTINGS;
  const customName =
    customRes && customRes.success && customRes.data ? customRes.data.nama : null;

  let saldoAwal: number | undefined;
  let saldoAkhir: number | undefined;

  // Ambil saldo awal & saldo akhir jika akumulasi saldo aktif
  if (settings.akumulasi_saldo) {
    try {
      const saldoRes = await getSaldoPeriodeList([
        { startDate: dari, endDate: sampai },
      ]);
      if (saldoRes.success && saldoRes.data && saldoRes.data.length > 0) {
        saldoAwal = saldoRes.data[0].saldo_awal;
        saldoAkhir = saldoRes.data[0].saldo_akhir;
      }
    } catch (err) {
      console.error('Failed to fetch saldo periode:', err);
    }
  }

  return (
    <RekapDetailClient
      detail={detailResult}
      settings={settings}
      jenis={jenis}
      customName={customName}
      saldoAwal={saldoAwal}
      saldoAkhir={saldoAkhir}
    />
  );
}
