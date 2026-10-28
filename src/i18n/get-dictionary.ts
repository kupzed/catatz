import type { Dictionary, Locale } from "./types";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  id: () => import("./dictionaries/id").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
};

export async function getDictionary(locale: Locale = "id"): Promise<Dictionary> {
  const loadDictionary = dictionaries[locale] ?? dictionaries.id;
  return loadDictionary();
}
