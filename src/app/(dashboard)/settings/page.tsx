import type { Metadata } from 'next';
import { getKategori } from '@/actions/transaksi-action';
import { createClient } from '@/configs/supabase/server';
import SettingsPageClient from './_components/settings-page-client';

export const metadata: Metadata = {
  title: 'Pengaturan',
  description: 'Pengaturan dan preferensi CatatZ Anda.',
};

export default async function SettingsPage() {
  const [kategori, supabase] = await Promise.all([
    getKategori(),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return <SettingsPageClient kategori={kategori} profile={profile} />;
}
