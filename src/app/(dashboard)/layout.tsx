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

  // Fetch display name & avatar from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  const sidebarUser = {
    name: profile?.name ?? null,
    email: user.email ?? "",
    avatar_url: profile?.avatar_url ?? null,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset className="overflow-x-clip">
        <header className="sticky top-0 z-40 flex min-h-12 shrink-0 select-none items-center justify-between gap-2 bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {/* Tombol buka sidebar — hanya tampil di mobile */}
            <SidebarTrigger className="cursor-pointer md:hidden" />
            <DashboardBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <IOSInstallHeaderButton />
            <DarkmodeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-6 md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
