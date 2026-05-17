import type { Metadata } from "next";
import { createClient } from "@/configs/supabase/server";
import SettingsPageClient from "./_components/settings-page-client";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Pengaturan dan preferensi CatatZ Anda.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const profileData = profile
    ? { ...profile, email: user?.email || "", created_at: profile.created_at || user?.created_at }
    : user
      ? { id: user.id, email: user.email || "", name: null, avatar_url: null, created_at: user.created_at }
      : null;

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("theme, currency, date_format, number_format, default_landing_page")
    .eq("user_id", user?.id)
    .single();

  const preferencesData = preferences || {
    theme: "system",
    currency: "IDR",
    date_format: "id-ID",
    number_format: "id-ID",
    default_landing_page: "/transaksi",
  };

  return <SettingsPageClient profile={profileData} preferences={preferencesData} />;
}
