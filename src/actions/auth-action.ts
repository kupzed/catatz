'use server';

import { createClient } from '@/configs/supabase/server';
import { environment } from '@/configs/environment';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ActionResult } from '@/types/general';

export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${environment.appUrl}/auth/callback?next=/transaksi`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: 'Akun berhasil dibuat! Silakan cek email untuk verifikasi.',
  };
}

export async function signIn(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/transaksi');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
