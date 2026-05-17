"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Settings, ShieldCheck } from "lucide-react";
import { UmumTab } from "./umum-tab";
import { KeamananTab } from "./keamanan-tab";

// ─── Types ───────────────────────────────────────────────────────────────────

import type { UserPreferences } from "@/actions/preference-action";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

type Props = {
  profile: Profile | null;
  preferences: UserPreferences;
};

// ─── Nav config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "umum", label: "General", icon: Settings },
  { id: "keamanan", label: "Security", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPageClient({ profile, preferences }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("umum");

  function renderContent() {
    switch (activeTab) {
      case "umum":
        return <UmumTab profile={profile} preferences={preferences} />;
      case "keamanan":
        return <KeamananTab />;
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
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
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-left transition-all",
                activeTab === id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
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
            className="flex items-center gap-1 rounded-xl bg-muted p-1 w-full"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                id={`settings-tab-${id}`}
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                  activeTab === id
                    ? "bg-background text-foreground shadow-sm"
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
