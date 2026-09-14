"use server";

import { createClient } from "@/configs/supabase/server";
import { environment } from "@/configs/environment";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types/general";
import { createSessionRecord } from "./session-action";
import { cookies, headers } from "next/headers";

type AuthCallbackUrlResult =
  | { success: true; url: string }
  | { success: false; error: string };

function getFirstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function normalizeOrigin(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getHostFromOrigin(origin: string): string {
  return new URL(origin).host;
}

function normalizeAllowedHost(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    return new URL(trimmedValue).host;
  } catch {
    return trimmedValue;
  }
}

async function getRequestOrigin(): Promise<string | null> {
  const headerStore = await headers();
  const origin = normalizeOrigin(getFirstHeaderValue(headerStore.get("origin")));

  if (origin) {
    return origin;
  }

  const refererOrigin = normalizeOrigin(
    getFirstHeaderValue(headerStore.get("referer")),
  );

  if (refererOrigin) {
    return refererOrigin;
  }

  const forwardedHost = getFirstHeaderValue(headerStore.get("x-forwarded-host"));
  const host = forwardedHost || getFirstHeaderValue(headerStore.get("host"));

  if (!host) {
    return null;
  }

  const protocol =
    getFirstHeaderValue(headerStore.get("x-forwarded-proto")) ||
    (environment.isProduction ? "https" : "http");

  return normalizeOrigin(`${protocol}://${host}`);
}

async function createAuthCallbackUrl(
  next: string,
  flow?: string,
): Promise<AuthCallbackUrlResult> {
  const origin = environment.isProduction
    ? environment.appUrl
    : (await getRequestOrigin()) || environment.appUrl;

  if (!origin) {
    return {
      success: false,
      error:
        "Origin request tidak terbaca. Restart dev server dan cek konfigurasi URL auth.",
    };
  }

  if (environment.isDevelopment) {
    const allowedHosts = new Set(
      [getHostFromOrigin(environment.appUrl), ...environment.allowedDevOrigins]
        .map(normalizeAllowedHost)
        .filter((host): host is string => Boolean(host)),
    );
    const requestHost = getHostFromOrigin(origin);

    if (!allowedHosts.has(requestHost)) {
      return {
        success: false,
        error: `Origin ${origin} belum diizinkan untuk auth redirect. Tambahkan ${requestHost} ke ALLOWED_DEV_ORIGINS, restart dev server, dan pastikan Supabase Redirect URLs berisi /auth/callback untuk origin tersebut.`,
      };
    }
  }

  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

  if (flow) {
    callbackUrl.searchParams.set("flow", flow);
  }

  return { success: true, url: callbackUrl.toString() };
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const callbackUrl = await createAuthCallbackUrl("/transactions");

  if (!callbackUrl.success) {
    return { success: false, error: callbackUrl.error };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: callbackUrl.url,
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

  // Record the session
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await createSessionRecord(user.id);
  }

  revalidatePath("/", "layout");
  redirect("/transactions");
}

export async function signOut() {
  const supabase = await createClient();
  
  // Revoke current session
  const cookieStore = await cookies();
  const deviceId = cookieStore.get("device_id")?.value;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user && deviceId) {
    await supabase
      .from("user_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .is("revoked_at", null);
  }

  await supabase.auth.signOut();
  
  // Clean up device_id cookie
  cookieStore.delete("device_id");
  cookieStore.delete("last_ping");
  
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

  const callbackUrl = await createAuthCallbackUrl("/reset-password");

  if (!callbackUrl.success) {
    return { success: false, error: callbackUrl.error };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl.url,
  });

  if (error) {
    // Error logged to monitoring system in production
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
  const callbackUrl = await createAuthCallbackUrl("/transactions");

  if (!callbackUrl.success) {
    return { success: false, error: callbackUrl.error };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.url,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.url) {
    return { success: true, data: { url: data.url } };
  }

  return { success: false, error: "Gagal menginisialisasi login Google" };
}

export async function linkGoogleIdentity(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  const { data: identitiesData, error: identitiesError } =
    await supabase.auth.getUserIdentities();

  if (identitiesError) {
    return { success: false, error: identitiesError.message };
  }

  const hasGoogleIdentity = identitiesData.identities.some(
    (identity) => identity.provider === "google",
  );

  if (hasGoogleIdentity) {
    return { success: true, message: "Akun Google sudah terhubung." };
  }

  const queryParams: Record<string, string> = {
    prompt: "select_account",
  };

  if (user.email) {
    queryParams.login_hint = user.email;
  }

  const callbackUrl = await createAuthCallbackUrl("/settings", "link_google");

  if (!callbackUrl.success) {
    return { success: false, error: callbackUrl.error };
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: callbackUrl.url,
      queryParams,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.url) {
    return { success: true, data: { url: data.url } };
  }

  return { success: false, error: "Gagal menginisialisasi koneksi Google" };
}

export async function unlinkGoogleIdentity(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  const { data: identitiesData, error: identitiesError } =
    await supabase.auth.getUserIdentities();

  if (identitiesError) {
    return { success: false, error: identitiesError.message };
  }

  const identities = identitiesData.identities;
  const googleIdentity = identities.find(
    (identity) => identity.provider === "google",
  );

  if (!googleIdentity) {
    return { success: false, error: "Akun Google belum terhubung." };
  }

  if (identities.length < 2) {
    return {
      success: false,
      error: "Tambahkan metode login lain sebelum memutuskan akun Google.",
    };
  }

  const { error } = await supabase.auth.unlinkIdentity(googleIdentity);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");

  return { success: true, message: "Akun Google berhasil diputuskan." };
}
