'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function OfflineBar() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div className="w-full bg-red-600 text-white text-center text-xs font-medium py-2 px-4 z-50 flex-shrink-0">
      {t('offlineMode')}
    </div>
  );
}
