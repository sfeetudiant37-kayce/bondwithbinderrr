'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Star, MessageSquare, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/dashboard', icon: Home, labelKey: 'home' },
  { href: '/discover', icon: Compass, labelKey: 'discover' },
  { href: '/matches', icon: Star, labelKey: 'matches' },
  { href: '/messages', icon: MessageSquare, labelKey: 'messages' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 md:hidden safe-bottom">
      <div className="max-w-2xl mx-auto flex">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                isActive ? 'text-blue-800' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
