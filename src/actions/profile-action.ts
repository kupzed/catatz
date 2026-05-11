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

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ avatar_url: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const file = formData.get('avatar') as File;
  if (!file) {
    return { success: false, error: 'File tidak ditemukan' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Format file tidak valid' };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Ukuran file terlalu besar (maksimal 2MB)' };
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${publicUrl}?t=${new Date().getTime()}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString() 
    })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/settings');
  return { success: true, data: { avatar_url: avatarUrl } };
}

export async function removeAvatar(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  const { data: files } = await supabase.storage.from('avatars').list(user.id);
  
  if (files && files.length > 0) {
    const pathsToDelete = files.map(f => `${user.id}/${f.name}`);
    await supabase.storage.from('avatars').remove(pathsToDelete);
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      avatar_url: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/settings');
  return { success: true };
}
