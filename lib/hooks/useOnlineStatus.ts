'use client';

import { useState, useEffect } from 'react';
import { useSyncStore } from '@/lib/stores/syncStore';

export function useOnlineStatus() {
  const { isOnline, setOnline } = useSyncStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const online = navigator.onLine;
    setOnline(online);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  if (!mounted) return true;
  return isOnline;
}
