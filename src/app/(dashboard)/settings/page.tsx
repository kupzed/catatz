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
    ? { ...profile, email: user?.email || "" }
    : user
      ? { id: user.id, email: user.email || "", name: null, avatar_url: null }
      : null;

  return <SettingsPageClient profile={profileData} />;
}
