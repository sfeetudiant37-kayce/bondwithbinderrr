'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useSyncStore } from '@/lib/stores/syncStore';
import { getDB } from '@/lib/db/dexie';
import { processQueue } from '@/lib/sync/syncEngine';
import { showToast } from '@/components/ui/Toast';
import { formatTimestamp } from '@/lib/utils/formatters';
import type { SyncQueueItem } from '@/types';

export default function SyncPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const { isOnline, isSyncing, pendingCount, lastSyncAt, setPendingCount } = useSyncStore();
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([]);
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([]);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    const db = getDB();

    const queue = await db.sync_queue.where('user_id').equals(user.id).toArray();
    setPendingItems(queue.filter((q) => q.status === 'pending'));
    setFailedItems(queue.filter((q) => q.status === 'failed'));
    setPendingCount(queue.filter((q) => q.status === 'pending').length);

    const stats = {
      users: await db.users.count(),
      client_profiles: await db.client_profiles.count(),
      provider_profiles: await db.provider_profiles.count(),
      service_requests: await db.service_requests.count(),
      swipes: await db.swipes.count(),
      matches: await db.matches.count(),
      conversations: await db.conversations.count(),
      messages: await db.messages.count(),
      notifications: await db.notifications.count(),
    };
    setDbStats(stats);
  };

  const handleSync = async () => {
    if (!user || !isOnline) return;
    await processQueue(user.id);
    await loadData();
    showToast(t('allSynced'), 'success');
  };

  const clearFailed = async () => {
    if (!user) return;
    const db = getDB();
    const failed = await db.sync_queue
      .where('user_id').equals(user.id)
      .and((q) => q.status === 'failed')
      .toArray();
    for (const item of failed) {
      await db.sync_queue.delete(item.id);
    }
    setFailedItems([]);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900">{t('syncStatus')}</h1>

      {/* Network status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi size={20} className="text-green-600" />
            ) : (
              <WifiOff size={20} className="text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">{t('networkStatus')}</p>
              <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Connected' : 'Offline'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            disabled={!isOnline}
            loading={isSyncing}
          >
            <RefreshCw size={14} />
            {t('syncNow')}
          </Button>
        </div>
        {lastSyncAt && (
          <p className="text-xs text-slate-400 mt-2">
            {t('lastSync')}: {formatTimestamp(lastSyncAt)}
          </p>
        )}
      </Card>

      {/* Pending items */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">{t('pendingItems')}</h3>
          <span className="text-sm font-bold text-slate-900">{pendingItems.length}</span>
        </div>
        {pendingItems.length === 0 ? (
          <p className="text-xs text-green-600">{t('allSynced')}</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingItems.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <div>
                  <p className="text-xs font-medium text-slate-700">{item.table_name}</p>
                  <p className="text-xs text-slate-400">{item.action_type}</p>
                </div>
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                  pending
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Failed items */}
      {failedItems.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">{t('failedItems')}</h3>
            <Button variant="danger-outline" size="sm" onClick={clearFailed}>
              {t('clearFailed')}
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {failedItems.map((item) => (
              <div key={item.id} className="py-1.5 border-b border-slate-50">
                <p className="text-xs font-medium text-slate-700">{item.table_name} — {item.action_type}</p>
                {item.error_message && <p className="text-xs text-red-500">{item.error_message}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* DB Stats */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('localDBStats')}</h3>
        <div className="space-y-2">
          {Object.entries(dbStats).map(([table, count]) => (
            <div key={table} className="flex items-center justify-between">
              <span className="text-xs text-slate-600 capitalize">{table.replace('_', ' ')}</span>
              <span className="text-xs font-semibold text-slate-900">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
