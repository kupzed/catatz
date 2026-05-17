"use client";

import { ProfileSection } from "./profile-section";
import { SystemPreferenceSection } from "./system-preference-section";
import { ConnectedAccountSection } from "./connected-account-section";
import { ExportSection } from "./export-section";

import type { UserPreferences } from "@/actions/preference-action";

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
};

export function UmumTab({ profile, preferences }: Props) {
  return (
    <div className="space-y-6 max-w-3xl">
      <ProfileSection profile={profile} />
      <SystemPreferenceSection preferences={preferences} />
      <ConnectedAccountSection providers={profile?.providers || []} />
      <ExportSection />
    </div>
  );
}
