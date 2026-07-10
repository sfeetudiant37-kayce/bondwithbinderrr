'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { RoleToggle } from './RoleToggle';
import { Avatar } from '@/components/ui/Avatar';
import { useUserStore } from '@/lib/stores/userStore';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const { user } = useUserStore();
  const { unreadCount } = useNotificationStore();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link href="/dashboard" className="text-xl font-bold text-blue-800 flex-shrink-0">
          {t('binder')}
        </Link>

        <RoleToggle />

        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link href="/profile" className="ml-1">
            {user && (
              <Avatar
                name={user.name || user.email}
                color={user.avatar_color}
                size="sm"
              />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
