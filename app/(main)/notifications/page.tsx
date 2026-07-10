'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { formatTimestamp } from '@/lib/utils/formatters';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const { clearUnread } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();
      const notifs = await db.notifications
        .where('user_id').equals(user.id)
        .reverse()
        .sortBy('created_at');
      setNotifications(notifs);

      // Mark all as read
      const unreadIds = notifs.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map((id) => db.notifications.update(id, { is_read: true })));
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        clearUnread();
      }
    } finally {
      setLoading(false);
    }
  };

  const TYPE_ICON: Record<string, string> = {
    new_match: 'match',
    new_message: 'message',
    review_received: 'review',
    request_response: 'request',
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">{t('notifications')}</h1>

      {loading ? (
        <SkeletonList count={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} />}
          title="No notifications"
          description="You'll see notifications here when you get matches, messages, or reviews."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-xl border flex items-start gap-3 ${notif.is_read ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-100'}`}
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bell size={14} className="text-blue-800" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{notif.body}</p>
                <p className="text-xs text-slate-400 mt-1">{formatTimestamp(notif.created_at)}</p>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-800 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
