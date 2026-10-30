import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DictionaryProvider } from "@/i18n/client-provider";
import id from "@/i18n/dictionaries/id";
import en from "@/i18n/dictionaries/en";
import SettingsPageClient from "@/app/(dashboard)/settings/_components/settings-page-client";
import { SystemPreferenceSection } from "@/app/(dashboard)/settings/_components/system-preference-section";
import { PasswordSection } from "@/app/(dashboard)/settings/_components/password-section";
import { LogoutSection } from "@/app/(dashboard)/settings/_components/logout-section";
import { DeleteAccountSection } from "@/app/(dashboard)/settings/_components/delete-account-section";
import { DEFAULT_USER_PREFERENCES } from "@/lib/user-preferences";
import { SystemPreferenceProvider } from "@/providers/system-preference-provider";

// Mocks
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/actions/preference-action", () => ({
  updateUserPreferences: vi.fn().mockResolvedValue({
    success: true,
    data: {
      theme: "system",
      currency: "IDR",
      date_format: "id-ID",
      number_format: "id-ID",
      default_landing_page: "/transactions",
      show_decimal_places: false,
      time_format: "24h",
      cutoff_day: 1,
      akumulasi_saldo: false,
      language: "id",
    },
  }),
}));

vi.mock("@/actions/profile-action", () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  uploadAvatar: vi.fn().mockResolvedValue({ success: true, data: { avatar_url: "https://example.com/avatar.png" } }),
  removeAvatar: vi.fn().mockResolvedValue({ success: true }),
  changePassword: vi.fn().mockResolvedValue({ success: true, message: "Password updated" }),
  deleteAccount: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/actions/session-action", () => ({
  getActiveSessions: vi.fn().mockResolvedValue({
    success: true,
    data: {
      sessions: [
        {
          id: "session-1",
          device_id: "dev-1",
          device_name: "MacBook Pro",
          browser: "Chrome",
          os: "macOS",
          location: "Jakarta, Indonesia",
          last_active_at: new Date().toISOString(),
        },
      ],
      current_device_id: "dev-1",
    },
  }),
  revokeSession: vi.fn().mockResolvedValue({ success: true, message: "Session revoked" }),
  revokeAllOtherSessions: vi.fn().mockResolvedValue({ success: true, message: "All other sessions revoked" }),
}));

vi.mock("@/actions/export-action", () => ({
  getExportCount: vi.fn().mockResolvedValue({ success: true, data: { count: 42 } }),
  getExportData: vi.fn().mockResolvedValue({
    success: true,
    data: {
      transaksi: [],
      summary: { totalPemasukan: 0, totalPengeluaran: 0, selisih: 0 },
      userName: "Test User",
      preferences: {
        theme: "system",
        currency: "IDR",
        date_format: "id-ID",
        number_format: "id-ID",
        default_landing_page: "/transactions",
        show_decimal_places: false,
        time_format: "24h",
        cutoff_day: 1,
        akumulasi_saldo: false,
        language: "id",
      },
    },
  }),
}));

vi.mock("@/actions/auth-action", () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  linkGoogleIdentity: vi.fn().mockResolvedValue({ success: true }),
  unlinkGoogleIdentity: vi.fn().mockResolvedValue({ success: true }),
}));

const mockProfile = {
  id: "user-123",
  email: "user@example.com",
  name: "John Doe",
  avatar_url: null,
  created_at: "2026-01-15T08:00:00Z",
  providers: ["email"],
};

describe("settings-i18n", () => {
  afterEach(() => {
    cleanup();
  });

  describe("SettingsPageClient", () => {
    it("renders page header and tabs in Indonesian", () => {
      render(
        <SystemPreferenceProvider initialPreferences={DEFAULT_USER_PREFERENCES}>
          <DictionaryProvider locale="id" dict={id}>
            <SettingsPageClient
              profile={mockProfile}
              preferences={DEFAULT_USER_PREFERENCES}
              connectedAccounts={[]}
            />
          </DictionaryProvider>
        </SystemPreferenceProvider>,
      );

      expect(screen.getByText(id.settings.title)).toBeInTheDocument();
      expect(screen.getByText(id.settings.subtitle)).toBeInTheDocument();
      expect(screen.getAllByText(id.settings.tabs.general).length).toBeGreaterThan(0);
      expect(screen.getAllByText(id.settings.tabs.security).length).toBeGreaterThan(0);
    });

    it("renders page header and tabs in English", () => {
      render(
        <SystemPreferenceProvider initialPreferences={{ ...DEFAULT_USER_PREFERENCES, language: "en" }}>
          <DictionaryProvider locale="en" dict={en}>
            <SettingsPageClient
              profile={mockProfile}
              preferences={{ ...DEFAULT_USER_PREFERENCES, language: "en" }}
              connectedAccounts={[]}
            />
          </DictionaryProvider>
        </SystemPreferenceProvider>,
      );

      expect(screen.getByText(en.settings.title)).toBeInTheDocument();
      expect(screen.getByText(en.settings.subtitle)).toBeInTheDocument();
      expect(screen.getAllByText(en.settings.tabs.general).length).toBeGreaterThan(0);
      expect(screen.getAllByText(en.settings.tabs.security).length).toBeGreaterThan(0);
    });
  });

  describe("SystemPreferenceSection", () => {
    it("renders language preference selector and localized labels in Indonesian", () => {
      render(
        <SystemPreferenceProvider initialPreferences={DEFAULT_USER_PREFERENCES}>
          <DictionaryProvider locale="id" dict={id}>
            <SystemPreferenceSection preferences={DEFAULT_USER_PREFERENCES} />
          </DictionaryProvider>
        </SystemPreferenceProvider>,
      );

      expect(screen.getByText(id.settings.preferences.title)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.themeLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.languageLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.currencyLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.dateFormatLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.numberFormatLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.timeFormatLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.previewTitle)).toBeInTheDocument();
      expect(screen.getByText(id.settings.preferences.landingPageLabel)).toBeInTheDocument();
    });

    it("renders language preference selector and localized labels in English", () => {
      render(
        <SystemPreferenceProvider initialPreferences={{ ...DEFAULT_USER_PREFERENCES, language: "en" }}>
          <DictionaryProvider locale="en" dict={en}>
            <SystemPreferenceSection preferences={{ ...DEFAULT_USER_PREFERENCES, language: "en" }} />
          </DictionaryProvider>
        </SystemPreferenceProvider>,
      );

      expect(screen.getByText(en.settings.preferences.title)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.themeLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.languageLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.currencyLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.dateFormatLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.numberFormatLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.timeFormatLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.previewTitle)).toBeInTheDocument();
      expect(screen.getByText(en.settings.preferences.landingPageLabel)).toBeInTheDocument();
    });
  });

  describe("PasswordSection", () => {
    it("renders localized labels in Indonesian", () => {
      render(
        <DictionaryProvider locale="id" dict={id}>
          <PasswordSection profile={mockProfile} />
        </DictionaryProvider>,
      );

      expect(screen.getByText(id.settings.password.title)).toBeInTheDocument();
      expect(screen.getByText(id.settings.password.registeredEmailLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.password.activeMethodsLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.password.emailPasswordBadge)).toBeInTheDocument();
      expect(screen.getByText(id.settings.password.currentPasswordLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.password.newPasswordLabel)).toBeInTheDocument();
      expect(screen.getByText(id.settings.password.confirmPasswordLabel)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: id.settings.password.saveButton })).toBeInTheDocument();
    });

    it("renders localized labels in English", () => {
      render(
        <DictionaryProvider locale="en" dict={en}>
          <PasswordSection profile={mockProfile} />
        </DictionaryProvider>,
      );

      expect(screen.getByText(en.settings.password.title)).toBeInTheDocument();
      expect(screen.getByText(en.settings.password.registeredEmailLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.password.activeMethodsLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.password.emailPasswordBadge)).toBeInTheDocument();
      expect(screen.getByText(en.settings.password.currentPasswordLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.password.newPasswordLabel)).toBeInTheDocument();
      expect(screen.getByText(en.settings.password.confirmPasswordLabel)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: en.settings.password.saveButton })).toBeInTheDocument();
    });
  });

  describe("Logout and Delete sections", () => {
    it("renders LogoutSection with localized content in English", () => {
      render(
        <DictionaryProvider locale="en" dict={en}>
          <LogoutSection />
        </DictionaryProvider>,
      );

      expect(screen.getByText(en.settings.logout.title)).toBeInTheDocument();
      expect(screen.getByText(en.settings.logout.description)).toBeInTheDocument();
      expect(screen.getByText(en.settings.logout.infoText)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: en.settings.logout.button })).toBeInTheDocument();
    });

    it("renders DeleteAccountSection with localized content in English", () => {
      render(
        <DictionaryProvider locale="en" dict={en}>
          <DeleteAccountSection />
        </DictionaryProvider>,
      );

      expect(screen.getByText(en.settings.deleteAccount.dangerZoneTitle)).toBeInTheDocument();
      expect(screen.getByText(en.settings.deleteAccount.dangerZoneDesc)).toBeInTheDocument();
      expect(screen.getAllByText(en.settings.deleteAccount.title).length).toBeGreaterThan(0);
      expect(screen.getByText(en.settings.deleteAccount.rowDesc)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: en.settings.deleteAccount.deleteButton })).toBeInTheDocument();
    });
  });
});
