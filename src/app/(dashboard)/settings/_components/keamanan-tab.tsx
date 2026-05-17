"use client";

import { PasswordSection } from "./password-section";
import { ActiveSessionsSection } from "./active-sessions-section";
import { LogoutSection } from "./logout-section";
import { DeleteAccountSection } from "./delete-account-section";

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
};

export function KeamananTab({ profile }: Props) {
  return (
    <div className="space-y-6 max-w-3xl">
      <PasswordSection profile={profile} />
      <ActiveSessionsSection />
      <LogoutSection />
      <DeleteAccountSection />
    </div>
  );
}
