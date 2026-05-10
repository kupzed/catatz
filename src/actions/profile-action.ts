'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';

export async function updateProfile(values: { name: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      name: values.name, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}
