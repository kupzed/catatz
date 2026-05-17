import { redirect } from 'next/navigation';
import { createClient } from '@/configs/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('default_landing_page')
    .eq('user_id', user.id)
    .single();

  const landingPage = preferences?.default_landing_page || '/transaksi';

  redirect(landingPage);
}
