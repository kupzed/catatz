'use server';

import { createClient } from '@/configs/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/general';
import { createAdminClient } from '@/configs/supabase/admin';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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

export async function changePassword(values: { currentPassword?: string, newPassword: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  if (values.currentPassword) {
    // Verifikasi password lama
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.currentPassword
    });

    if (verifyError) {
      return { success: false, error: 'Password lama tidak sesuai' };
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: values.newPassword
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: "Password berhasil diperbarui" };
}

export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  try {
    // 1. Hapus avatar storage jika ada
    const { data: files } = await supabase.storage.from('avatars').list(user.id);
    if (files && files.length > 0) {
      const pathsToDelete = files.map(f => `${user.id}/${f.name}`);
      await supabase.storage.from('avatars').remove(pathsToDelete);
    }

    // 2. Hapus dari Auth menggunakan Admin API
    // Hal ini akan memicu penghapusan CASCADE otomatis di semua tabel (profiles, transaksi, dll)
    const adminAuth = createAdminClient();
    const { error: deleteError } = await adminAuth.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return { success: false, error: 'Gagal menghapus akun, silakan coba lagi.' };
    }

    // 3. Clear auth session/cookies secara manual
    // Karena kita tidak bisa memanggil supabase.auth.signOut() pada user yang sudah dihapus dengan baik,
    // kita hapus cookie device_id dan biarkan request dihentikan oleh redirect
    const cookieStore = await cookies();
    cookieStore.delete("device_id");
    cookieStore.delete("last_ping");

  } catch (err) {
    console.error('Unexpected error during delete account:', err);
    return { success: false, error: 'Terjadi kesalahan sistem.' };
  }

  // 4. Redirect out
  redirect('/login?message=account-deleted');
}
