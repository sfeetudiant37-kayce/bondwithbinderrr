'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setActiveRole: (role: UserRole) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setActiveRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, active_role: role } : null,
        })),
      clearUser: () => set({ user: null }),
    }),
    { name: 'binder-user' }
  )
);
