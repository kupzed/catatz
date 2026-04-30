'use client';

import { createClient } from '@/configs/supabase/client';
import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
