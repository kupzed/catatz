"use client";

import { PasswordSection } from "./password-section";
import { ActiveSessionsSection } from "./active-sessions-section";
import { LogoutSection } from "./logout-section";
import { DeleteAccountSection } from "./delete-account-section";

export function KeamananTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PasswordSection />
      <ActiveSessionsSection />
      <LogoutSection />
      <DeleteAccountSection />
    </div>
  );
}
