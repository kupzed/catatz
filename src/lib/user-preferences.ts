export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export const CURRENCY_PREFERENCES = ["IDR"] as const;
export const DATE_FORMAT_PREFERENCES = ["id-ID", "en-US"] as const;
export const NUMBER_FORMAT_PREFERENCES = ["id-ID", "en-US"] as const;
export const TIME_FORMAT_PREFERENCES = ["24h", "12h"] as const;
export const LANGUAGE_PREFERENCES = ["id", "en"] as const;
export const LANDING_PAGE_PREFERENCES = [
  "/transactions",
  "/wallets",
  "/reports",
  "/debts",
  "/categories",
] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type CurrencyPreference = (typeof CURRENCY_PREFERENCES)[number];
export type DateFormatPreference = (typeof DATE_FORMAT_PREFERENCES)[number];
export type NumberFormatPreference = (typeof NUMBER_FORMAT_PREFERENCES)[number];
export type TimeFormatPreference = (typeof TIME_FORMAT_PREFERENCES)[number];
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];
export type LandingPagePreference = (typeof LANDING_PAGE_PREFERENCES)[number];

export type UserPreferences = {
  theme: ThemePreference;
  currency: CurrencyPreference;
  date_format: DateFormatPreference;
  number_format: NumberFormatPreference;
  default_landing_page: LandingPagePreference;
  show_decimal_places: boolean;
  time_format: TimeFormatPreference;
  cutoff_day: number;
  akumulasi_saldo: boolean;
  language: LanguagePreference;
};

export type UserPreferenceUpdate = Partial<UserPreferences>;

export const USER_PREFERENCE_SELECT =
  "theme, currency, date_format, number_format, default_landing_page, show_decimal_places, time_format, cutoff_day, akumulasi_saldo, language";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
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
};

const PREFERENCE_OPTIONS = {
  theme: THEME_PREFERENCES,
  currency: CURRENCY_PREFERENCES,
  date_format: DATE_FORMAT_PREFERENCES,
  number_format: NUMBER_FORMAT_PREFERENCES,
  default_landing_page: LANDING_PAGE_PREFERENCES,
  time_format: TIME_FORMAT_PREFERENCES,
  language: LANGUAGE_PREFERENCES,
} as const;

function isOneOf<T extends readonly string[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

export function normalizeUserPreferences(
  input?: Partial<Record<keyof UserPreferences, unknown>> | null,
): UserPreferences {
  return {
    theme: isOneOf(input?.theme, THEME_PREFERENCES)
      ? input.theme
      : DEFAULT_USER_PREFERENCES.theme,
    currency: isOneOf(input?.currency, CURRENCY_PREFERENCES)
      ? input.currency
      : DEFAULT_USER_PREFERENCES.currency,
    date_format: isOneOf(input?.date_format, DATE_FORMAT_PREFERENCES)
      ? input.date_format
      : DEFAULT_USER_PREFERENCES.date_format,
    number_format: isOneOf(input?.number_format, NUMBER_FORMAT_PREFERENCES)
      ? input.number_format
      : DEFAULT_USER_PREFERENCES.number_format,
    default_landing_page: isOneOf(
      input?.default_landing_page,
      LANDING_PAGE_PREFERENCES,
    )
      ? input.default_landing_page
      : DEFAULT_USER_PREFERENCES.default_landing_page,
    show_decimal_places:
      typeof input?.show_decimal_places === "boolean"
        ? input.show_decimal_places
        : DEFAULT_USER_PREFERENCES.show_decimal_places,
    time_format: isOneOf(input?.time_format, TIME_FORMAT_PREFERENCES)
      ? input.time_format
      : DEFAULT_USER_PREFERENCES.time_format,
    cutoff_day:
      typeof input?.cutoff_day === "number" &&
      Number.isInteger(input.cutoff_day) &&
      input.cutoff_day >= 1 &&
      input.cutoff_day <= 31
        ? input.cutoff_day
        : DEFAULT_USER_PREFERENCES.cutoff_day,
    akumulasi_saldo:
      typeof input?.akumulasi_saldo === "boolean"
        ? input.akumulasi_saldo
        : DEFAULT_USER_PREFERENCES.akumulasi_saldo,
    language: isOneOf(input?.language, LANGUAGE_PREFERENCES)
      ? input.language
      : DEFAULT_USER_PREFERENCES.language,
  };
}

import type { Dictionary } from "@/i18n/types";

export function validateUserPreferenceUpdate(
  values: Record<string, unknown>,
  dict?: Dictionary,
): { success: true; data: UserPreferenceUpdate } | { success: false; error: string } {
  const allowedKeys = new Set<keyof UserPreferences>([
    "theme",
    "currency",
    "date_format",
    "number_format",
    "default_landing_page",
    "show_decimal_places",
    "time_format",
    "cutoff_day",
    "akumulasi_saldo",
    "language",
  ]);
  const data: UserPreferenceUpdate = {};

  for (const [rawKey, value] of Object.entries(values)) {
    const key = rawKey as keyof UserPreferences;

    if (!allowedKeys.has(key)) {
      return {
        success: false,
        error: dict
          ? `${dict.actions.preference.invalidPreference}: ${rawKey}`
          : `Preferensi ${rawKey} tidak valid`,
      };
    }

    if (key === "show_decimal_places") {
      if (typeof value !== "boolean") {
        return {
          success: false,
          error:
            dict?.actions.preference.invalidDecimal ??
            "Preferensi angka desimal tidak valid",
        };
      }

      data.show_decimal_places = value;
      continue;
    }

    if (key === "akumulasi_saldo") {
      if (typeof value !== "boolean") {
        return {
          success: false,
          error:
            dict?.actions.preference.invalidAccumulation ??
            "Preferensi akumulasi saldo tidak valid",
        };
      }

      data.akumulasi_saldo = value;
      continue;
    }

    if (key === "cutoff_day") {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 31
      ) {
        return {
          success: false,
          error:
            dict?.actions.preference.invalidCutoff ??
            "Tanggal cut-off siklus harus antara 1 dan 31",
        };
      }

      data.cutoff_day = value;
      continue;
    }

    const options = PREFERENCE_OPTIONS[key as keyof typeof PREFERENCE_OPTIONS];
    if (options && !isOneOf(value, options)) {
      return {
        success: false,
        error: dict
          ? `${dict.actions.preference.invalidOption}: ${rawKey}`
          : `Nilai preferensi ${rawKey} tidak valid`,
      };
    }

    data[key] = value as never;
  }

  if (Object.keys(data).length === 0) {
    return {
      success: false,
      error:
        dict?.actions.preference.noPreferencesToUpdate ??
        "Tidak ada preferensi yang diperbarui",
    };
  }

  return { success: true, data };
}
