'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';

export type UserPreferences = {
  theme: string;
  currency: string;
  date_format: string;
  number_format: string;
  default_landing_page: string;
};

export async function getUserPreferences(): Promise<ActionResult<UserPreferences>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, currency, date_format, number_format, default_landing_page')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    return { success: false, error: error.message };
  }

  if (!data) {
    // Return default preferences if not found
    return {
      success: true,
      data: {
        theme: 'system',
        currency: 'IDR',
        date_format: 'id-ID',
        number_format: 'id-ID',
        default_landing_page: '/transaksi',
      }
    };
  }

  return { success: true, data };
}

export async function updateUserPreferences(values: Partial<UserPreferences>): Promise<ActionResult<UserPreferences>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const payload = {
    ...values,
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('theme, currency, date_format, number_format, default_landing_page')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  revalidatePath('/'); // Revalidate root for potential landing page redirect

  return { success: true, data };
}
