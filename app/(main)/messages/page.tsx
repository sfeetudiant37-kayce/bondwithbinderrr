'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { formatTimestamp, truncate } from '@/lib/utils/formatters';
import { showToast } from '@/components/ui/Toast';
import type { Conversation, Message, User, Match } from '@/types';
import { useNotificationStore } from '@/lib/stores/notificationStore';

interface ConvItem {
  conv: Conversation;
  otherUser: User;
  lastMsg: Message | null;
  unreadCount: number;
  match: Match;
}

export default function MessagesPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const { decrementUnread } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();

      const allMatches = await db.matches
        .where('client_id').equals(user.id)
        .or('provider_id').equals(user.id)
        .toArray();

      const matchIds = allMatches.map((m) => m.id);
      const allConvs = await db.conversations.toArray();
      const relevantConvs = allConvs.filter((c) => matchIds.includes(c.match_id));

      const users = await db.users.toArray();
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      const matchMap = Object.fromEntries(allMatches.map((m) => [m.id, m]));

      const rawItems: (ConvItem | null)[] = await Promise.all(
        relevantConvs.map(async (conv) => {
          const match = matchMap[conv.match_id];
          if (!match) return null;

          const otherId = match.client_id === user.id ? match.provider_id : match.client_id;
          const otherUser = userMap[otherId];
          if (!otherUser) return null;

          const messages = await db.messages
            .where('conversation_id').equals(conv.id)
            .and((m) => !m.is_deleted_for_everyone)
            .sortBy('sent_at');

          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

          const unreadCount = messages.filter(
            (m) => !m.is_read && m.sender_id !== user.id
          ).length;

          return { conv, otherUser, lastMsg, unreadCount, match };
        })
      );

      const filtered = rawItems
        .filter(Boolean)
        .sort((a, b) => {
          const aTime = a!.conv.last_message_at;
          const bTime = b!.conv.last_message_at;
          return bTime.localeCompare(aTime);
        }) as ConvItem[];

      setConversations(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (convId: string) => {
    const db = getDB();
    try {
      await db.messages.where('conversation_id').equals(convId).delete();
      await db.conversations.delete(convId);
      await supabase.from('messages').delete().eq('conversation_id', convId);
      await supabase.from('conversations').delete().eq('id', convId);
      setConversations((prev) => prev.filter((c) => c.conv.id !== convId));
      showToast('Conversation deleted', 'success');
    } catch (err) {
      showToast(t('errorOccurred'), 'error');
    }
    setDeleteId(null);
  };

  const searchFiltered = conversations.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.otherUser.name?.toLowerCase().includes(q) ||
      item.lastMsg?.content.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (!user) return null;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">{t('messages')}</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t('searchConversations')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : searchFiltered.length === 0 ? (
        <EmptyState
          title={t('noMessages')}
          description={search ? 'No results found' : undefined}
        />
      ) : (
        <div className="space-y-1">
          {searchFiltered.map(({ conv, otherUser, lastMsg, unreadCount }) => (
            <div key={conv.id} className="relative group">
              <button
                onClick={() => router.push(`/messages/${conv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors text-left"
              >
                <div className="relative">
                  <Avatar name={otherUser.name || otherUser.email} color={otherUser.avatar_color} size="md" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-800 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${unreadCount > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {otherUser.name || t('deletedUser')}
                    </p>
                    {lastMsg && (
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {formatTimestamp(lastMsg.sent_at)}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className={`text-xs mt-0.5 truncate ${unreadCount > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                      {truncate(lastMsg.content, 50)}
                    </p>
                  )}
                </div>
              </button>

              <button
                onClick={() => setDeleteId(conv.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('deleteConversation')}
        description={t('deleteConversationConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
