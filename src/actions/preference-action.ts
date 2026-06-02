'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCE_SELECT,
  normalizeUserPreferences,
  validateUserPreferenceUpdate,
  type UserPreferences,
  type UserPreferenceUpdate,
} from '@/lib/user-preferences';

export async function getUserPreferences(): Promise<ActionResult<UserPreferences>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select(USER_PREFERENCE_SELECT)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    return { success: false, error: error.message };
  }

  if (!data) {
    return {
      success: true,
      data: DEFAULT_USER_PREFERENCES
    };
  }

  return { success: true, data: normalizeUserPreferences(data) };
}

export async function updateUserPreferences(values: UserPreferenceUpdate): Promise<ActionResult<UserPreferences>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const validation = validateUserPreferenceUpdate(values);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const payload = {
    ...validation.data,
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select(USER_PREFERENCE_SELECT)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  revalidatePath('/transaksi');
  revalidatePath('/rekening');
  revalidatePath('/rekap');
  revalidatePath('/hutang');
  revalidatePath('/'); // Revalidate root for potential landing page redirect

  return { success: true, data: normalizeUserPreferences(data) };
}
