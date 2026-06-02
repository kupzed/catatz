import { ReactNode } from "react";
import AppSidebar from "@/components/common/app-sidebar";
import { DarkmodeToggle } from "@/components/common/darkmode-toggle";
import { IOSInstallHeaderButton } from "@/components/pwa/ios-install-header-button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardBreadcrumb from "./_components/dashboard-breadcrumb";
import { createClient } from "@/configs/supabase/server";
import { redirect } from "next/navigation";
import { SystemPreferenceProvider } from "@/providers/system-preference-provider";
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCE_SELECT,
  normalizeUserPreferences,
} from "@/lib/user-preferences";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select(USER_PREFERENCE_SELECT)
    .eq("user_id", user.id)
    .single();

  const systemPreferences = preferences
    ? normalizeUserPreferences(preferences)
    : DEFAULT_USER_PREFERENCES;
  const themePreference = systemPreferences.theme;

  const sidebarUser = {
    name: profile?.name ?? null,
    email: user.email ?? "",
    avatar_url: profile?.avatar_url ?? null,
  };

  return (
    <SystemPreferenceProvider initialPreferences={systemPreferences}>
      <SidebarProvider>
        <AppSidebar user={sidebarUser} />
        <SidebarInset className="overflow-x-clip">
          <header className="sticky top-0 z-40 flex min-h-[64px] shrink-0 select-none items-center justify-between gap-2 border-b border-hairline bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {/* Tombol buka sidebar - hanya tampil di mobile */}
              <SidebarTrigger className="cursor-pointer md:hidden" />
              <DashboardBreadcrumb />
            </div>
            <div className="flex items-center gap-2">
              <IOSInstallHeaderButton />
              <DarkmodeToggle initialTheme={themePreference} />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-6 md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SystemPreferenceProvider>
  );
}
