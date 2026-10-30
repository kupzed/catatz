"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/use-translation";
import { RekapSettingsDialog } from "./rekap-settings-dialog";
import { RekapRealtimeTab } from "./rekap-realtime-tab";
import { RekapBulananTab } from "./rekap-bulanan-tab";
import { RekapCustomTab } from "./rekap-custom-tab";
import type { RekapSettings } from "@/types/rekap";
import { DEFAULT_REKAP_SETTINGS } from "@/validations/rekap-validation";
import type {
  BudgetWithUsage,
  RekapDetailBulanan,
  RekapBulanan,
} from "@/actions/rekap-action";

const emptySubscribe = () => () => {};

export type RekapPageClientProps = {
  initialSettings?: RekapSettings;
  // Props lama dipertahankan untuk backward compatibility (tidak dirender di fase ini)
  initialBulanan?: RekapBulanan[];
  initialDetail?: RekapDetailBulanan;
  initialBudget?: BudgetWithUsage[];
  currentBulan?: number;
  currentTahun?: number;
};

type TabValue = "realtime" | "bulanan" | "custom";

export default function RekapPageClient({
  initialSettings = DEFAULT_REKAP_SETTINGS,
}: RekapPageClientProps) {
  const { dict } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<RekapSettings>(initialSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Tab aktif disinkronkan dengan URL query `?tab=` (default: realtime)
  const tabParam = searchParams.get("tab")?.toLowerCase();
  const resolvedTab: TabValue =
    tabParam === "bulanan" || tabParam === "custom" ? tabParam : "realtime";

  const [activeTab, setActiveTab] = useState<TabValue>(resolvedTab);
  const [prevResolvedTab, setPrevResolvedTab] = useState<TabValue>(resolvedTab);

  if (prevResolvedTab !== resolvedTab) {
    setPrevResolvedTab(resolvedTab);
    setActiveTab(resolvedTab);
  }

  const handleTabChange = (nextTab: string) => {
    const validTab: TabValue =
      nextTab === "bulanan" || nextTab === "custom" ? nextTab : "realtime";
    setActiveTab(validTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", validTab);
    const nextUrl = `${pathname}?${params.toString()}`;
    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <div
      data-hydrated={isHydrated ? "true" : undefined}
      className="mx-auto w-full max-w-5xl space-y-6"
    >
      {/* Header dengan tombol pengaturan 44px di pojok kanan atas */}
      <PageHeader
        title={dict.reports.title}
        subtitle={dict.reports.subtitle}
        action={
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={dict.reports.settings.title}
            className="size-11 min-h-11 min-w-11 rounded-full border-hairline hover:bg-surface-strong"
          >
            <SlidersHorizontal className="size-5 text-foreground" />
          </Button>
        }
      />

      {/* Tabs Realtime | Bulanan | Custom */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
          <TabsTrigger value="realtime">{dict.reports.tabs.realtime}</TabsTrigger>
          <TabsTrigger value="bulanan">{dict.reports.tabs.monthly}</TabsTrigger>
          <TabsTrigger value="custom">{dict.reports.tabs.custom}</TabsTrigger>
        </TabsList>

        {/* Tab Realtime */}
        <TabsContent value="realtime" className="mt-0">
          <RekapRealtimeTab settings={settings} />
        </TabsContent>

        {/* Tab Bulanan */}
        <TabsContent value="bulanan" className="mt-0">
          <RekapBulananTab settings={settings} />
        </TabsContent>

        {/* Tab Custom */}
        <TabsContent value="custom" className="mt-0">
          <RekapCustomTab settings={settings} />
        </TabsContent>
      </Tabs>

      {/* Modal Dialog Pengaturan Rekap */}
      <RekapSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsSaved={setSettings}
      />
    </div>
  );
}
