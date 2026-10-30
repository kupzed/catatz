"use client";

import { useContext } from "react";
import { DictionaryContext, type DictionaryContextValue } from "./client-provider";
import idDict from "./dictionaries/id";

const fallbackContext: DictionaryContextValue = {
  locale: "id",
  dict: idDict,
};

export function useTranslation(): DictionaryContextValue {
  const context = useContext(DictionaryContext);
  return context ?? fallbackContext;
}
