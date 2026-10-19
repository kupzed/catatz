"use client";

import { create } from "zustand";

type BreadcrumbStore = {
  customTitle: string | null;
  path: string | null;
  setBreadcrumbTitle: (title: string | null, path: string) => void;
};

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  customTitle: null,
  path: null,
  setBreadcrumbTitle: (customTitle, path) =>
    set((state) => {
      if (state.customTitle === customTitle && state.path === path) {
        return state;
      }
      return { customTitle, path };
    }),
}));
