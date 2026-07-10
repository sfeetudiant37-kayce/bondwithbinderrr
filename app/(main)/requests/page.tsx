'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, formatTimestamp } from '@/lib/utils/formatters';
import { showToast } from '@/components/ui/Toast';
import type { ServiceRequest } from '@/types';

export default function RequestsPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadRequests();
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();
      const reqs = await db.service_requests.where('client_id').equals(user.id).sortBy('created_at');
      setRequests(reqs.reverse());
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'in_progress' | 'completed') => {
    const db = getDB();
    const now = new Date().toISOString();
    const updates: Partial<ServiceRequest> = { status, updated_at: now };
    if (status === 'completed') updates.completed_at = now;
    await db.service_requests.update(id, updates);
    await supabase.from('service_requests').update(updates).eq('id', id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
    showToast('Status updated', 'success');
  };

  const deleteRequest = async (id: string) => {
    const db = getDB();
    const now = new Date().toISOString();
    const updates = { status: 'archived' as const, updated_at: now };
    await db.service_requests.update(id, updates);
    await supabase.from('service_requests').update(updates).eq('id', id);
    // Archive related matches
    const matches = await db.matches.where('request_id').equals(id).toArray();
    for (const m of matches) {
      await db.matches.update(m.id, { status: 'archived', updated_at: now });
      await supabase.from('matches').update({ status: 'archived', updated_at: now }).eq('id', m.id);
    }
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'archived' } : r));
    setDeleteId(null);
    showToast('Request archived', 'success');
  };

  const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
    open: 'info',
    in_progress: 'warning',
    completed: 'success',
    archived: 'default',
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">{t('myRequests')}</h1>
        <button
          onClick={() => router.push('/requests/new')}
          className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white hover:bg-blue-900 shadow-md"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : requests.length === 0 ? (
        <EmptyState
          title={t('noRequestsFound')}
          action={
            <Button onClick={() => router.push('/requests/new')}>
              {t('newRequest')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{req.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatPrice(req.budget)} • {formatTimestamp(req.created_at)}
                  </p>
                </div>
                <Badge variant={statusVariant[req.status]} size="sm">
                  {t(req.status === 'in_progress' ? 'inProgress' : req.status)}
                </Badge>
              </div>

              <div className="flex gap-1.5 flex-wrap mb-2">
                <Badge variant={req.urgency === 'urgent' ? 'error' : req.urgency === 'this_week' ? 'info' : 'default'} size="sm">
                  {t(req.urgency)}
                </Badge>
                {req.required_skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{s}</span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                {req.status === 'open' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus(req.id, 'in_progress')}
                    >
                      <Clock size={12} />
                      {t('markInProgress')}
                    </Button>
                    <button
                      onClick={() => setDeleteId(req.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                {req.status === 'in_progress' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus(req.id, 'completed')}
                  >
                    <CheckCircle size={12} />
                    {t('markCompleted')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('deleteRequest')}
        description="This will archive the request."
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={() => deleteId && deleteRequest(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
