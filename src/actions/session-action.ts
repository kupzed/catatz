"use server";

import { createClient } from "@/configs/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/general";
import { cookies, headers } from "next/headers";
import { UAParser } from "ua-parser-js";

export async function createSessionRecord(userId: string): Promise<void> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Try to keep existing device_id or create a new one
  let deviceId = cookieStore.get("device_id")?.value;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    cookieStore.set("device_id", deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  const userAgent = headersList.get("user-agent") || "";
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  
  let deviceName = "Unknown Device";
  if (device.vendor && device.model) {
    deviceName = `${device.vendor} ${device.model}`;
  } else if (os.name) {
    deviceName = `${os.name} Device`;
  }

  // Get IP address if available
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "";

  // Upsert session (since user might log in again on the same device)
  // We can just update last_active_at if device_id and user_id match
  const { data: existingSession } = await supabase
    .from("user_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .is("revoked_at", null)
    .single();

  if (existingSession) {
    await supabase
      .from("user_sessions")
      .update({
        last_active_at: new Date().toISOString(),
        user_agent: userAgent,
        browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "Unknown",
        os: os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown",
        device_name: deviceName,
        ip_address: ipAddress,
      })
      .eq("id", existingSession.id);
  } else {
    await supabase
      .from("user_sessions")
      .insert({
        user_id: userId,
        device_id: deviceId,
        user_agent: userAgent,
        browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "Unknown",
        os: os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown",
        device_name: deviceName,
        ip_address: ipAddress,
      });
  }
}

export type SessionData = {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  last_active_at: string;
  created_at: string;
};

export async function getActiveSessions(): Promise<ActionResult<{ sessions: SessionData[], current_device_id: string | null }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const cookieStore = await cookies();
  const currentDeviceId = cookieStore.get("device_id")?.value || null;

  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { sessions: data, current_device_id: currentDeviceId } };
}

export async function revokeSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings", "layout");
  return { success: true, message: "Sesi berhasil diakhiri" };
}

export async function revokeAllOtherSessions(): Promise<ActionResult> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const deviceId = cookieStore.get("device_id")?.value;
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!deviceId) {
    return { success: false, error: "Perangkat saat ini tidak teridentifikasi" };
  }

  const { error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .neq("device_id", deviceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings", "layout");
  return { success: true, message: "Semua sesi lain berhasil diakhiri" };
}

export async function pingSessionActivity(): Promise<void> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const deviceId = cookieStore.get("device_id")?.value;
  
  if (!deviceId) return;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // We only update if last_active_at is older than 5 minutes to avoid DB spam
  // This is better done checking a cookie timestamp
  const lastPing = cookieStore.get("last_ping")?.value;
  const now = Date.now();
  
  if (lastPing && now - parseInt(lastPing) < 5 * 60 * 1000) {
    return; // Less than 5 minutes ago
  }
  
  // Update DB
  const { error } = await supabase
    .from("user_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("device_id", deviceId)
    .is("revoked_at", null);
    
  if (!error) {
    cookieStore.set("last_ping", now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });
  }
}
