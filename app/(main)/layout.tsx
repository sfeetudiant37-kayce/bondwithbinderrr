'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt';
import { useUserStore } from '@/lib/stores/userStore';
import { supabase } from '@/lib/supabase/client';
import { getDB } from '@/lib/db/dexie';
import { processQueue } from '@/lib/sync/syncEngine';
import { useSyncStore } from '@/lib/stores/syncStore';
import { useNotificationStore } from '@/lib/stores/notificationStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { setOnline } = useSyncStore();
  const { setUnreadCount } = useNotificationStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/landing');
        return;
      }

      // Load user if not in store
      if (!user) {
        const db = getDB();
        const localUser = await db.users.get(session.user.id);
        if (localUser) {
          setUser(localUser);
        } else {
          router.replace('/landing');
          return;
        }
      }

      // Load unread notification count
      if (user) {
        const db = getDB();
        const count = await db.notifications
          .where('user_id')
          .equals(user.id)
          .and((n) => !n.is_read)
          .count();
        setUnreadCount(count);
      }
    };

    init().catch(console.error);

    // Online/offline sync
    const handleOnline = () => {
      setOnline(true);
      const uid = useUserStore.getState().user?.id;
      if (uid) {
        processQueue(uid).catch(console.error);
      }
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Watch for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT') {
          useUserStore.getState().clearUser();
          router.replace('/landing');
        }
      })();
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <PageLayout>
      {children}
      <PWAInstallPrompt />
    </PageLayout>
  );
}
