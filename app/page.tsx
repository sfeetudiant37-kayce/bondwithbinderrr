'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/userStore';
import { getDB } from '@/lib/db/dexie';

export default function RootPage() {
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Zustand store first (instant)
        if (user) {
          router.replace('/dashboard');
          return;
        }

        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Pull user from Dexie
          const db = getDB();
          const localUser = await db.users.get(session.user.id);
          if (localUser) {
            useUserStore.getState().setUser(localUser);
            router.replace('/dashboard');
            return;
          }
        }
      } catch (err) {
        // Offline or error - go to landing
      }
      router.replace('/landing');
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
