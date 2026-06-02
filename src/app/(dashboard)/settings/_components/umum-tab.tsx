"use client";

import { ProfileSection } from "./profile-section";
import { SystemPreferenceSection } from "./system-preference-section";
import {
  ConnectedAccountSection,
  type ConnectedAccount,
} from "./connected-account-section";
import { ExportSection } from "./export-section";

import type { UserPreferences } from "@/lib/user-preferences";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  providers?: string[];
};

type Props = {
  profile: Profile | null;
  preferences: UserPreferences;
  connectedAccounts: ConnectedAccount[];
};

export function UmumTab({ profile, preferences, connectedAccounts }: Props) {
  return (
    <div className="space-y-6 max-w-3xl">
      <ProfileSection profile={profile} />
      <SystemPreferenceSection
        key={`${preferences.theme}-${preferences.currency}-${preferences.date_format}-${preferences.number_format}-${preferences.show_decimal_places}-${preferences.time_format}-${preferences.default_landing_page}`}
        preferences={preferences}
      />
      <ConnectedAccountSection
        accounts={connectedAccounts}
        primaryEmail={profile?.email || ""}
        providers={profile?.providers}
      />
      <ExportSection />
    </div>
  );
}
