"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  type UserPreferenceUpdate,
  type UserPreferences,
} from "@/lib/user-preferences";
import {
  formatNumber as formatNumberValue,
  formatRupiah as formatRupiahValue,
  formatTanggal as formatTanggalValue,
  formatWaktu as formatWaktuValue,
} from "@/lib/utils";

type SystemPreferenceContextValue = {
  preferences: UserPreferences;
  setPreferences: (preferences: UserPreferences) => void;
  updatePreferences: (values: UserPreferenceUpdate) => void;
  formatRupiah: (value: number, compact?: boolean) => string;
  formatNumber: (value: number) => string;
  formatTanggal: (date: string, fmt?: string) => string;
  formatWaktu: (value?: string | null) => string;
};

const fallbackContext: SystemPreferenceContextValue = {
  preferences: DEFAULT_USER_PREFERENCES,
  setPreferences: () => {},
  updatePreferences: () => {},
  formatRupiah: (value, compact = false) =>
    formatRupiahValue(value, compact, DEFAULT_USER_PREFERENCES),
  formatNumber: (value) => formatNumberValue(value, DEFAULT_USER_PREFERENCES),
  formatTanggal: (date, fmt) =>
    formatTanggalValue(date, fmt, DEFAULT_USER_PREFERENCES),
  formatWaktu: (value) => formatWaktuValue(value, DEFAULT_USER_PREFERENCES),
};

const SystemPreferenceContext =
  createContext<SystemPreferenceContextValue | null>(null);

export function SystemPreferenceProvider({
  initialPreferences,
  children,
}: {
  initialPreferences?: Partial<UserPreferences> | null;
  children: ReactNode;
}) {
  const [preferences, setPreferencesState] = useState<UserPreferences>(() =>
    normalizeUserPreferences(initialPreferences),
  );

  const setPreferences = useCallback((nextPreferences: UserPreferences) => {
    setPreferencesState(normalizeUserPreferences(nextPreferences));
  }, []);

  const updatePreferences = useCallback((values: UserPreferenceUpdate) => {
    setPreferencesState((current) => normalizeUserPreferences({ ...current, ...values }));
  }, []);

  const value = useMemo<SystemPreferenceContextValue>(
    () => ({
      preferences,
      setPreferences,
      updatePreferences,
      formatRupiah: (amount, compact = false) =>
        formatRupiahValue(amount, compact, preferences),
      formatNumber: (amount) => formatNumberValue(amount, preferences),
      formatTanggal: (date, fmt) => formatTanggalValue(date, fmt, preferences),
      formatWaktu: (time) => formatWaktuValue(time, preferences),
    }),
    [preferences, setPreferences, updatePreferences],
  );

  return (
    <SystemPreferenceContext.Provider value={value}>
      {children}
    </SystemPreferenceContext.Provider>
  );
}

export function useSystemPreferences() {
  return useContext(SystemPreferenceContext) ?? fallbackContext;
}
