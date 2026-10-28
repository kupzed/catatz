import { describe, it, expect } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  normalizeUserPreferences,
  validateUserPreferenceUpdate,
  DEFAULT_USER_PREFERENCES,
} from "@/lib/user-preferences";
import idDict from "@/i18n/dictionaries/id";
import enDict from "@/i18n/dictionaries/en";

describe("i18n infrastructure", () => {
  it("loads id and en dictionaries successfully", async () => {
    const id = await getDictionary("id");
    const en = await getDictionary("en");

    expect(id).toBeDefined();
    expect(en).toBeDefined();
    expect(id).toBe(idDict);
    expect(en).toBe(enDict);
  });

  it("falls back to id dictionary for unknown locale", async () => {
    // @ts-expect-error test fallback with invalid locale
    const fallback = await getDictionary("fr");
    expect(fallback).toBe(idDict);
  });

  it("ensures id and en dictionaries share identical recursive keys and non-empty values", () => {
    function getLeafEntries(obj: Record<string, unknown>, prefix = ""): [string, unknown][] {
      return Object.entries(obj).flatMap(([key, value]) => {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return getLeafEntries(value as Record<string, unknown>, fullPath);
        }
        return [[fullPath, value]];
      });
    }

    const idEntries = getLeafEntries(idDict as unknown as Record<string, unknown>);
    const enEntries = getLeafEntries(enDict as unknown as Record<string, unknown>);

    const idKeys = idEntries.map(([k]) => k).sort();
    const enKeys = enEntries.map(([k]) => k).sort();

    expect(idKeys).toEqual(enKeys);
    expect(idKeys.length).toBeGreaterThan(100);

    for (const [key, value] of idEntries) {
      expect(typeof value, `id.${key} should be a string`).toBe("string");
      expect((value as string).trim().length, `id.${key} should not be empty`).toBeGreaterThan(0);
    }

    for (const [key, value] of enEntries) {
      expect(typeof value, `en.${key} should be a string`).toBe("string");
      expect((value as string).trim().length, `en.${key} should not be empty`).toBeGreaterThan(0);
    }
  });

  it("normalizes user preferences language correctly", () => {
    expect(normalizeUserPreferences({}).language).toBe(DEFAULT_USER_PREFERENCES.language);
    expect(normalizeUserPreferences({ language: "en" }).language).toBe("en");
    expect(normalizeUserPreferences({ language: "id" }).language).toBe("id");
    expect(normalizeUserPreferences({ language: "es" as never }).language).toBe("id");
  });

  it("validates user preference update with language", () => {
    const validEn = validateUserPreferenceUpdate({ language: "en" });
    expect(validEn.success).toBe(true);
    if (validEn.success) {
      expect(validEn.data.language).toBe("en");
    }

    const validId = validateUserPreferenceUpdate({ language: "id" });
    expect(validId.success).toBe(true);
    if (validId.success) {
      expect(validId.data.language).toBe("id");
    }

    const invalid = validateUserPreferenceUpdate({ language: "de" });
    expect(invalid.success).toBe(false);
  });
});
