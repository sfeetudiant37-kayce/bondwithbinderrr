'use client';

import { useEffect, useState } from 'react';
import { Phone, MessageSquare, Star, Check, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FitScoreBadge } from '@/components/features/FitScoreBadge';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/formatters';
import { showToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import type { Match, User, ProviderProfile, ClientProfile, ServiceRequest } from '@/types';

interface MatchWithDetails {
  match: Match;
  otherUser: User;
  providerProfile?: ProviderProfile;
  clientProfile?: ClientProfile;
  request?: ServiceRequest;
}

export default function MatchesPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [filter, setFilter] = useState<'all' | 'mutual' | 'recent'>('all');

  useEffect(() => {
    if (!user) return;
    loadMatches();
  }, [user?.active_role]);

  const loadMatches = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();
      const role = user.active_role;

      let rawMatches: Match[];
      if (role === 'client') {
        rawMatches = await db.matches.where('client_id').equals(user.id).toArray();
      } else {
        rawMatches = await db.matches.where('provider_id').equals(user.id).toArray();
      }

      rawMatches = rawMatches.filter((m) => m.status !== 'archived');

      const users = await db.users.toArray();
      const providerProfiles = await db.provider_profiles.toArray();
      const clientProfiles = await db.client_profiles.toArray();
      const requests = await db.service_requests.toArray();

      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      const ppMap = Object.fromEntries(providerProfiles.map((p) => [p.user_id, p]));
      const cpMap = Object.fromEntries(clientProfiles.map((c) => [c.user_id, c]));
      const reqMap = Object.fromEntries(requests.map((r) => [r.id, r]));

      const details: MatchWithDetails[] = rawMatches
        .map((m) => {
          const otherId = role === 'client' ? m.provider_id : m.client_id;
          const otherUser = userMap[otherId];
          if (!otherUser) return null;
          return {
            match: m,
            otherUser,
            providerProfile: ppMap[m.provider_id],
            clientProfile: cpMap[m.client_id],
            request: m.request_id ? reqMap[m.request_id] : undefined,
          };
        })
        .filter(Boolean) as MatchWithDetails[];

      // Sort by fit score
      details.sort((a, b) => {
        const aScore = role === 'client' ? a.match.provider_fit_score || a.match.client_fit_score : a.match.provider_fit_score;
        const bScore = role === 'client' ? b.match.provider_fit_score || b.match.client_fit_score : b.match.provider_fit_score;
        return bScore - aScore;
      });

      setMatches(details);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInfo = async (matchId: string) => {
    if (!user) return;
    try {
      const db = getDB();
      const now = new Date().toISOString();
      await db.matches.update(matchId, { status: 'mutual', contact_revealed: true, updated_at: now });
      await supabase.from('matches').update({ status: 'mutual', contact_revealed: true, updated_at: now }).eq('id', matchId);

      // Create conversation if not exists
      const conv = await db.conversations.where('match_id').equals(matchId).first();
      if (!conv) {
        const convId = crypto.randomUUID();
        const newConv = { id: convId, match_id: matchId, created_at: now, last_message_at: now };
        await db.conversations.add(newConv);
        await supabase.from('conversations').insert(newConv);
      }

      showToast(t('sendMyInfo'), 'success');
      loadMatches();
    } catch (err) {
      showToast(t('errorOccurred'), 'error');
    }
  };

  const handleNotInterested = async (matchId: string) => {
    if (!user) return;
    try {
      const db = getDB();
      const now = new Date().toISOString();
      await db.matches.update(matchId, { status: 'archived', updated_at: now });
      await supabase.from('matches').update({ status: 'archived', updated_at: now }).eq('id', matchId);
      setMatches((prev) => prev.filter((m) => m.match.id !== matchId));
    } catch (err) {
      showToast(t('errorOccurred'), 'error');
    }
  };

  const startConversation = async (matchId: string, otherUserId: string) => {
    const db = getDB();
    let conv = await db.conversations.where('match_id').equals(matchId).first();
    if (!conv) {
      const convId = crypto.randomUUID();
      const now = new Date().toISOString();
      const newConv = { id: convId, match_id: matchId, created_at: now, last_message_at: now };
      await db.conversations.add(newConv);
      await supabase.from('conversations').insert(newConv);
      conv = newConv;
    }
    router.push(`/messages/${conv.id}`);
  };

  const filtered = matches.filter((m) => {
    if (filter === 'mutual') return m.match.status === 'mutual';
    if (filter === 'recent') {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      return m.match.created_at > twoDaysAgo;
    }
    return true;
  });

  if (!user) return null;

  const isClient = user.active_role === 'client';

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">
          {isClient ? t('interestedProvidersTitle') : t('clientNotificationsTitle')}
        </h1>
        <p className="text-sm text-slate-500">
          {matches.length} {isClient ? t('interestedProviders') : t('clientsWantInfo')}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'mutual', 'recent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-blue-800 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {f === 'all' ? 'All' : f === 'mutual' ? t('mutualMatch') : 'Recent'}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('noMatchesYet')} description={t('swipeRightToConnect')} />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ match, otherUser, providerProfile, request }) => (
            <div key={match.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar name={otherUser.name || otherUser.email} color={otherUser.avatar_color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{otherUser.name || t('deletedUser')}</p>
                    {match.status === 'mutual' && (
                      <Badge variant="success" size="sm">{t('mutualMatch')}</Badge>
                    )}
                  </div>
                  {isClient && providerProfile && (
                    <p className="text-xs text-slate-500">
                      {providerProfile.skills[0]} • {formatPrice(providerProfile.price)}
                    </p>
                  )}
                  {!isClient && request && (
                    <p className="text-xs text-slate-500">
                      {request.title} • {formatPrice(request.budget)}
                    </p>
                  )}
                </div>
                <FitScoreBadge score={isClient ? match.provider_fit_score : match.provider_fit_score} />
              </div>

              {/* Contact info for client when matched */}
              {isClient && match.contact_revealed && providerProfile?.phone && (
                <div className="mb-3 p-2.5 bg-blue-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">{t('contactInfo')}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-800">{providerProfile.phone}</p>
                    {providerProfile.whatsapp && (
                      <a
                        href={`https://wa.me/${providerProfile.whatsapp.replace('+', '')}`}
                        className="text-xs text-green-600 font-medium hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}

              {!isClient && match.status === 'client_interested' && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleSendInfo(match.id)}
                  >
                    {t('sendMyInfo')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => handleNotInterested(match.id)}
                  >
                    {t('notInterested')}
                  </Button>
                </div>
              )}

              {(match.status === 'mutual' || match.status === 'contacted') && (
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => startConversation(match.id, otherUser.id)}
                >
                  <MessageSquare size={14} />
                  {t('message')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
