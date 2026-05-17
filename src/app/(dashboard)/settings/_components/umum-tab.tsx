"use client";

import { ProfileSection } from "./profile-section";
import { SystemPreferenceSection } from "./system-preference-section";
import { ConnectedAccountSection } from "./connected-account-section";
import { ExportSection } from "./export-section";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
};

type Props = {
  profile: Profile | null;
};

export function UmumTab({ profile }: Props) {
  return (
    <div className="space-y-6 max-w-3xl">
      <ProfileSection profile={profile} />
      <SystemPreferenceSection />
      <ConnectedAccountSection />
      <ExportSection />
    </div>
  );
}
