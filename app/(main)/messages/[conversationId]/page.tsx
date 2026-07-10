'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Trash2, MoreVertical, Star } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RatingModal } from '@/components/features/RatingModal';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { formatTimestamp } from '@/lib/utils/formatters';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';
import type { Message, User, Conversation, Match, ProviderProfile } from '@/types';

const AUTO_REPLY_MAP: Record<string, string> = {
  hello: "Hello! How can I help you?",
  bonjour: "Bonjour! Comment puis-je vous aider?",
  available: "I am available immediately",
  disponible: "Je suis disponible immédiatement",
  price: "My rate is mentioned in my profile (FCFA)",
  prix: "Mon tarif est mentionné dans mon profil (FCFA)",
  location: "I am in the location mentioned in my profile",
  located: "I am in the location mentioned in my profile",
  where: "I am in the location mentioned in my profile",
};

function getAutoReply(message: string, targetProfile?: ProviderProfile): string {
  const lower = message.toLowerCase();
  for (const [key, reply] of Object.entries(AUTO_REPLY_MAP)) {
    if (lower.includes(key)) {
      if ((key === 'price' || key === 'prix') && targetProfile?.price) {
        return `My rate is ${targetProfile.price.toLocaleString()} FCFA`;
      }
      if ((key === 'location' || key === 'located' || key === 'where') && targetProfile?.location) {
        return `I am in ${targetProfile.location}${targetProfile.quartier ? `, ${targetProfile.quartier}` : ''}`;
      }
      return reply;
    }
  }
  return "Thank you for your message. I will respond shortly.";
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const { decrementUnread } = useNotificationStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherProviderProfile, setOtherProviderProfile] = useState<ProviderProfile | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteForEveryoneId, setDeleteForEveryoneId] = useState<string | null>(null);
  const [deleteForMeId, setDeleteForMeId] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !conversationId) return;
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();

      const conversation = await db.conversations.get(conversationId);
      if (!conversation) { router.back(); return; }
      setConv(conversation);

      const m = await db.matches.get(conversation.match_id);
      if (!m) { router.back(); return; }
      setMatch(m);

      const otherId = m.client_id === user.id ? m.provider_id : m.client_id;
      const other = await db.users.get(otherId);
      setOtherUser(other || null);

      if (other) {
        const pp = await db.provider_profiles.where('user_id').equals(other.id).first();
        setOtherProviderProfile(pp || null);
      }

      const msgs = await db.messages
        .where('conversation_id').equals(conversationId)
        .sortBy('sent_at');

      const visibleMsgs = msgs.filter((msg) => {
        if (msg.is_deleted_for_everyone) return false;
        if (msg.is_deleted_for_sender && msg.sender_id === user.id) return false;
        return true;
      });
      setMessages(visibleMsgs);

      // Mark all as read
      const unreadIds = msgs
        .filter((msg) => !msg.is_read && msg.sender_id !== user.id)
        .map((msg) => msg.id);

      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map((id) => db.messages.update(id, { is_read: true })));
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        decrementUnread(unreadIds.length);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user || !conversationId) return;
    setInput('');

    const db = getDB();
    const msgId = crypto.randomUUID();
    const now = new Date().toISOString();

    const msg: Message = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      is_read: false,
      is_synced: false,
      is_deleted_for_sender: false,
      is_deleted_for_everyone: false,
      deleted_at: null,
      sent_at: now,
    };

    await db.messages.add(msg);
    await db.conversations.update(conversationId, { last_message_at: now });
    setMessages((prev) => [...prev, msg]);

    // Sync to Supabase
    await supabase.from('messages').insert({ ...msg, is_synced: true });
    await supabase.from('conversations').update({ last_message_at: now }).eq('id', conversationId);

    // Auto-reply for dummy users
    if (otherUser?.is_dummy) {
      setTimeout(async () => {
        const replyContent = getAutoReply(content, otherProviderProfile || undefined);
        const replyId = crypto.randomUUID();
        const replyNow = new Date().toISOString();
        const reply: Message = {
          id: replyId,
          conversation_id: conversationId,
          sender_id: otherUser.id,
          content: replyContent,
          is_read: false,
          is_synced: false,
          is_deleted_for_sender: false,
          is_deleted_for_everyone: false,
          deleted_at: null,
          sent_at: replyNow,
        };
        await db.messages.add(reply);
        await db.conversations.update(conversationId, { last_message_at: replyNow });
        setMessages((prev) => [...prev, reply]);
        await supabase.from('messages').insert({ ...reply, is_synced: true });
      }, 1500);
    }
  };

  const deleteForMe = async (msgId: string) => {
    const db = getDB();
    await db.messages.update(msgId, { is_deleted_for_sender: true });
    await supabase.from('messages').update({ is_deleted_for_sender: true }).eq('id', msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeleteForMeId(null);
    showToast(t('deleteForMe'), 'success');
  };

  const deleteForEveryone = async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || msg.sender_id !== user?.id) return;
    const sentAt = new Date(msg.sent_at).getTime();
    const hoursOld = (Date.now() - sentAt) / 3600000;
    if (hoursOld > 24) {
      showToast('Can only delete within 24 hours', 'error');
      return;
    }
    const db = getDB();
    const now = new Date().toISOString();
    await db.messages.update(msgId, { is_deleted_for_everyone: true, deleted_at: now });
    await supabase.from('messages').update({ is_deleted_for_everyone: true, deleted_at: now }).eq('id', msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeleteForEveryoneId(null);
    showToast(t('deleteForEveryone'), 'success');
  };

  const QUICK_REPLIES = [
    t('helloQuick'),
    t('whenAvailableQuick'),
    t('whatPriceQuick'),
    t('whereLocatedQuick'),
  ];

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          <ArrowLeft size={20} />
        </button>
        {otherUser && (
          <>
            <Avatar name={otherUser.name || otherUser.email} color={otherUser.avatar_color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate">
                {otherUser.name || t('deletedUser')}
              </p>
              <p className="text-xs text-green-500">{t('online')}</p>
            </div>
          </>
        )}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30">
              <button
                onClick={() => { setShowRating(true); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Star size={14} />
                {t('rateUser')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Start the conversation!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'group max-w-[75%] rounded-2xl px-4 py-2.5 relative',
                    isMine ? 'bg-blue-800 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={cn('flex items-center justify-between gap-2 mt-1')}>
                    <span className={cn('text-[10px]', isMine ? 'text-blue-200' : 'text-slate-400')}>
                      {formatTimestamp(msg.sent_at)}
                    </span>
                    <button
                      onClick={() => isMine ? setDeleteForEveryoneId(msg.id) : setDeleteForMeId(msg.id)}
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        isMine ? 'text-blue-300 hover:text-red-300' : 'text-slate-300 hover:text-red-400'
                      )}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 pb-2 overflow-x-auto flex gap-2 no-scrollbar">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            onClick={() => sendMessage(reply)}
            className="flex-shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={t('typeMessage')}
            className="flex-1 h-10 px-4 text-sm border border-slate-200 rounded-full outline-none focus:border-blue-500"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-900 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Delete modals */}
      <ConfirmDialog
        open={!!deleteForMeId}
        title={t('deleteMessage')}
        confirmLabel={t('deleteForMe')}
        cancelLabel={t('cancel')}
        onConfirm={() => deleteForMeId && deleteForMe(deleteForMeId)}
        onCancel={() => setDeleteForMeId(null)}
      />

      <ConfirmDialog
        open={!!deleteForEveryoneId}
        title={t('deleteMessage')}
        description="This will remove the message for all participants."
        cancelLabel={t('cancel')}
        onConfirm={() => deleteForEveryoneId && deleteForEveryone(deleteForEveryoneId)}
        onCancel={() => setDeleteForEveryoneId(null)}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={() => deleteForEveryoneId && deleteForMe(deleteForEveryoneId)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {t('deleteForMe')}
          </button>
          <button
            onClick={() => deleteForEveryoneId && deleteForEveryone(deleteForEveryoneId)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            {t('deleteForEveryone')}
          </button>
        </div>
      </ConfirmDialog>

      {/* Rating modal */}
      {otherUser && match && (
        <RatingModal
          open={showRating}
          onClose={() => setShowRating(false)}
          matchId={match.id}
          reviewerId={user.id}
          revieweeId={otherUser.id}
          revieweeName={otherUser.name || t('deletedUser')}
          revieweeProviderProfileId={otherProviderProfile?.id}
          currentRating={otherProviderProfile?.rating || 0}
          currentReviewCount={otherProviderProfile?.review_count || 0}
        />
      )}
    </div>
  );
}
