import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import type { SyncQueueItem } from '@/types';
import { useSyncStore } from '@/lib/stores/syncStore';

const SUPABASE_TABLE_MAP: Record<string, string> = {
  users: 'users',
  client_profiles: 'client_profiles',
  provider_profiles: 'provider_profiles',
  service_requests: 'service_requests',
  swipes: 'swipes',
  matches: 'matches',
  conversations: 'conversations',
  messages: 'messages',
  reviews: 'reviews',
  notifications: 'notifications',
  weights: 'weights',
  user_priorities: 'user_priorities',
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processItem(item: SyncQueueItem): Promise<boolean> {
  try {
    const tableName = SUPABASE_TABLE_MAP[item.table_name];
    if (!tableName) {
      return false;
    }

    if (item.action_type === 'create' || item.action_type === 'update') {
      const { error } = await supabase
        .from(tableName)
        .upsert(item.payload as Record<string, unknown>);
      if (error) throw error;
    } else if (item.action_type === 'delete') {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', item.record_id);
      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error(`Sync failed for ${item.table_name}/${item.record_id}:`, err);
    return false;
  }
}

export async function processQueue(userId: string): Promise<void> {
  if (!navigator.onLine) return;

  const db = getDB();
  const syncStore = useSyncStore.getState();
  syncStore.setSyncing(true);

  try {
    const pending = await db.sync_queue
      .where('user_id')
      .equals(userId)
      .and((item) => item.status === 'pending')
      .sortBy('created_at');

    for (const item of pending) {
      if (item.retry_count >= 5) {
        await db.sync_queue.update(item.id, { status: 'failed' });
        continue;
      }

      const success = await processItem(item);

      if (success) {
        await db.sync_queue.update(item.id, {
          status: 'synced',
          synced_at: new Date().toISOString(),
        });
      } else {
        const retryCount = item.retry_count + 1;
        const backoff = Math.pow(2, retryCount) * 1000;
        await db.sync_queue.update(item.id, {
          retry_count: retryCount,
          error_message: `Failed after ${retryCount} attempts`,
        });
        await sleep(backoff);
      }
    }

    const stillPending = await db.sync_queue
      .where('user_id')
      .equals(userId)
      .and((item) => item.status === 'pending')
      .count();

    syncStore.setPendingCount(stillPending);
    syncStore.setLastSyncAt(new Date().toISOString());
  } finally {
    syncStore.setSyncing(false);
  }
}

export async function addToSyncQueue(
  userId: string,
  actionType: 'create' | 'update' | 'delete',
  tableName: string,
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const db = getDB();
  const id = crypto.randomUUID();

  await db.sync_queue.add({
    id,
    user_id: userId,
    action_type: actionType,
    table_name: tableName,
    record_id: recordId,
    payload,
    status: 'pending',
    retry_count: 0,
    error_message: null,
    created_at: new Date().toISOString(),
    synced_at: null,
  });

  const pendingCount = await db.sync_queue
    .where('user_id')
    .equals(userId)
    .and((item) => item.status === 'pending')
    .count();

  useSyncStore.getState().setPendingCount(pendingCount);
}

export async function pullUserDataFromSupabase(userId: string): Promise<void> {
  if (!navigator.onLine) return;

  const db = getDB();

  try {
    const [
      userRes,
      clientProfileRes,
      providerProfileRes,
      requestsRes,
      swipesRes,
      matchesRes,
      convsRes,
      msgsRes,
      notifRes,
      weightsRes,
      prioritiesRes,
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('client_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('provider_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('service_requests').select('*').eq('client_id', userId),
      supabase.from('swipes').select('*').eq('swiper_id', userId),
      supabase.from('matches').select('*').or(`client_id.eq.${userId},provider_id.eq.${userId}`),
      supabase.from('conversations').select('*'),
      supabase.from('messages').select('*').eq('sender_id', userId),
      supabase.from('notifications').select('*').eq('user_id', userId),
      supabase.from('weights').select('*').eq('user_id', userId),
      supabase.from('user_priorities').select('*').eq('user_id', userId),
    ]);

    if (userRes.data) await db.users.put(userRes.data);
    if (clientProfileRes.data) await db.client_profiles.put(clientProfileRes.data);
    if (providerProfileRes.data) await db.provider_profiles.put(providerProfileRes.data);
    if (requestsRes.data) await db.service_requests.bulkPut(requestsRes.data);
    if (swipesRes.data) await db.swipes.bulkPut(swipesRes.data);
    if (matchesRes.data) {
      await db.matches.bulkPut(matchesRes.data);
      const matchIds = matchesRes.data.map((m) => m.id);
      if (matchIds.length > 0 && convsRes.data) {
        const relevantConvs = convsRes.data.filter((c) => matchIds.includes(c.match_id));
        await db.conversations.bulkPut(relevantConvs);
        const convIds = relevantConvs.map((c) => c.id);
        if (convIds.length > 0 && msgsRes.data) {
          const relevantMsgs = msgsRes.data.filter((m) => convIds.includes(m.conversation_id));
          await db.messages.bulkPut(relevantMsgs);
        }
      }
    }
    if (notifRes.data) await db.notifications.bulkPut(notifRes.data);
    if (weightsRes.data) await db.weights.bulkPut(weightsRes.data);
    if (prioritiesRes.data) await db.user_priorities.bulkPut(prioritiesRes.data);
  } catch (err) {
    console.error('Error pulling user data from Supabase:', err);
  }
}
