import { redirect } from 'next/navigation';
import { createClient } from '@/configs/supabase/server';
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCE_SELECT,
  normalizeUserPreferences,
} from '@/lib/user-preferences';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select(USER_PREFERENCE_SELECT)
    .eq('user_id', user.id)
    .single();

  const landingPage = preferences
    ? normalizeUserPreferences(preferences).default_landing_page
    : DEFAULT_USER_PREFERENCES.default_landing_page;

  redirect(landingPage);
}
