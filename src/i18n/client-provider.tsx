"use client";

import { createContext, type ReactNode } from "react";
import type { Dictionary, Locale } from "./types";

export type DictionaryContextValue = {
  locale: Locale;
  dict: Dictionary;
};

export const DictionaryContext = createContext<DictionaryContextValue | null>(null);

export function DictionaryProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={{ locale, dict }}>
      {children}
    </DictionaryContext.Provider>
  );
}
