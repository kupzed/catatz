import { createClient } from "@/configs/supabase/server";
import type { Locale } from "./types";

export async function getLocale(): Promise<Locale> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return "id";
    }

    const { data } = await supabase
      .from("user_preferences")
      .select("language")
      .eq("user_id", user.id)
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
