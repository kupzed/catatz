import { createClient } from "@/configs/supabase/server";
import type { Locale } from "./types";

export async function getLocale(
  client?: Awaited<ReturnType<typeof createClient>>,
  userId?: string,
): Promise<Locale> {
  try {
    const supabase = client ?? (await createClient());
    let uid = userId;

    if (!uid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      uid = user?.id;
    }

    if (!uid) {
      return "id";
    }

    const { data } = await supabase
      .from("user_preferences")
      .select("language")
      .eq("user_id", uid)
      .maybeSingle();

    if (data?.language === "en" || data?.language === "id") {
      return data.language;
    }

    return "id";
  } catch {
    return "id";
  }
}

export const getActionLocale = getLocale;
