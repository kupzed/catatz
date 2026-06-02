import type { Metadata } from "next";
import { createClient } from "@/configs/supabase/server";
import SettingsPageClient from "./_components/settings-page-client";
import type { ConnectedAccount } from "./_components/connected-account-section";
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCE_SELECT,
  normalizeUserPreferences,
} from "@/lib/user-preferences";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Pengaturan dan preferensi CatatZ Anda.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const identitiesResult = user ? await supabase.auth.getUserIdentities() : null;
  const connectedAccounts: ConnectedAccount[] =
    identitiesResult?.data?.identities.map((identity) => {
      const identityEmail =
        typeof identity.identity_data?.email === "string"
          ? identity.identity_data.email
          : null;

      return {
        provider: identity.provider,
        email: identityEmail,
        created_at: identity.created_at,
        last_sign_in_at: identity.last_sign_in_at,
      };
    }) ?? [];
  const identityProviders = connectedAccounts.map((account) => account.provider);
  const appMetadataProviders = Array.isArray(user?.app_metadata?.providers)
    ? user.app_metadata.providers.filter(
        (provider): provider is string => typeof provider === "string",
      )
    : [];
  const providers =
    identityProviders.length > 0 ? identityProviders : appMetadataProviders;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const profileData = profile
    ? { ...profile, email: user?.email || "", created_at: profile.created_at || user?.created_at, providers }
    : user
      ? { id: user.id, email: user.email || "", name: null, avatar_url: null, created_at: user.created_at, providers }
      : null;

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select(USER_PREFERENCE_SELECT)
    .eq("user_id", user?.id)
    .single();

  const preferencesData = preferences
    ? normalizeUserPreferences(preferences)
    : DEFAULT_USER_PREFERENCES;

  return (
    <SettingsPageClient
      profile={profileData}
      preferences={preferencesData}
      connectedAccounts={connectedAccounts}
    />
  );
}
