'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncStore {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  setPendingCount: (count: number) => void;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (time: string) => void;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      pendingCount: 0,
      isOnline: true,
      isSyncing: false,
      lastSyncAt: null,
      setPendingCount: (count) => set({ pendingCount: count }),
      setOnline: (online) => set({ isOnline: online }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSyncAt: (time) => set({ lastSyncAt: time }),
    }),
    { name: 'binder-sync' }
  )
);
