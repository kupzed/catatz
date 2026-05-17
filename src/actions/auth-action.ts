"use server";

import { createClient } from "@/configs/supabase/server";
import { environment } from "@/configs/environment";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types/general";

export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

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
    message: "Akun berhasil dibuat! Silakan cek email untuk verifikasi.",
  };
}

export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/transaksi");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function resetPasswordRequest(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, error: "Email wajib diisi" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${environment.appUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("Reset password request error:", error.message);
  }

  return {
    success: true,
    message:
      "Jika email terdaftar, link reset password akan dikirimkan ke email tersebut.",
  };
}

export async function updatePassword(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { success: false, error: "Password wajib diisi" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Konfirmasi password tidak cocok" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password minimal 8 karakter" };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message };
  }

  // Sign out the user after resetting password so they must log in again
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=reset-success");
}

export async function signInWithGoogle(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${environment.appUrl}/auth/callback?next=/transaksi`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.url) {
    return { success: true, data: { url: data.url } };
  }

  return { success: false, error: 'Gagal menginisialisasi login Google' };
}
