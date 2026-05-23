"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Settings, ShieldCheck } from "lucide-react";
import { UmumTab } from "./umum-tab";
import { KeamananTab } from "./keamanan-tab";
import type { ConnectedAccount } from "./connected-account-section";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  connectedAccounts: ConnectedAccount[];
};

// ─── Nav config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "umum", label: "General", icon: Settings },
  { id: "keamanan", label: "Security", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPageClient({
  profile,
  preferences,
  connectedAccounts,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("umum");

  function renderContent() {
    switch (activeTab) {
      case "umum":
        return (
          <UmumTab
            profile={profile}
            preferences={preferences}
            connectedAccounts={connectedAccounts}
          />
        );
      case "keamanan":
        return <KeamananTab profile={profile} />;
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-[32px] font-normal tracking-[-0.4px] text-foreground leading-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Kelola akun, preferensi, dan keamanan aplikasi CatatZ.
        </p>
      </div>

      {/* Layout: sidebar on md+, tab buttons on mobile */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* ── Sidebar nav (md+) ── */}
        <nav
          aria-label="Pengaturan navigasi"
          className="hidden md:flex md:flex-col md:w-48 md:shrink-0 gap-0.5"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`settings-nav-${id}`}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-left transition-all",
                activeTab === id
                  ? "text-foreground font-semibold border-l-2 border-primary pl-[calc(0.75rem-2px)]"
                  : "text-muted-foreground hover:text-foreground pl-3",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* ── Mobile tab strip ── */}
        <div className="md:hidden">
          <div
            role="tablist"
            className="flex items-center gap-1 rounded-[8px] bg-surface-strong p-1 w-full"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                id={`settings-tab-${id}`}
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 text-xs font-medium transition-all",
                  activeTab === id
                    ? "bg-card text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </div>
  );
}
