'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: (by?: number) => void;
  decrementUnread: (by?: number) => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
      incrementUnread: (by = 1) =>
        set((state) => ({ unreadCount: state.unreadCount + by })),
      decrementUnread: (by = 1) =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    { name: 'binder-notifications' }
  )
);
