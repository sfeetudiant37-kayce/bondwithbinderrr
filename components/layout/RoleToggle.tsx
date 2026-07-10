'use client';

import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils/cn';

export function RoleToggle() {
  const { user, setActiveRole } = useUserStore();
  const { t } = useTranslation();

  if (!user?.has_client_profile || !user?.has_provider_profile) return null;

  const handleToggle = async (role: UserRole) => {
    setActiveRole(role);
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { getDB } = await import('@/lib/db/dexie');
      const now = new Date().toISOString();
      await supabase.from('users').update({ active_role: role, updated_at: now }).eq('id', user.id);
      await getDB().users.update(user.id, { active_role: role, updated_at: now });
    } catch (err) {
      console.error('Error updating active role:', err);
    }
  };

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
      {(['client', 'provider'] as UserRole[]).map((role) => (
        <button
          key={role}
          onClick={() => handleToggle(role)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-all duration-150',
            user.active_role === role
              ? 'bg-blue-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          {role === 'client' ? t('client') : t('provider')}
        </button>
      ))}
    </div>
  );
}
