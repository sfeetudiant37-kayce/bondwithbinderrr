'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Info, Star, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FitScoreBadge } from '@/components/features/FitScoreBadge';
import { FitScoreBreakdownModal } from '@/components/features/FitScoreBreakdown';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { computeFitScore, adjustWeights } from '@/lib/algorithms/fitscore';
import { showToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/formatters';
import type {
  User, ProviderProfile, ClientProfile, ServiceRequest,
  Weights, FitScoreBreakdown, ProviderCardData, RequestCardData
} from '@/types';
import { SkeletonList } from '@/components/ui/Skeleton';

type CardData = ProviderCardData | RequestCardData;

function isProviderCard(card: CardData): card is ProviderCardData {
  return 'provider_profile' in card;
}

const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  card: CardData;
  isTop: boolean;
  onSwipe: (direction: 'left' | 'right', card: CardData) => void;
  onInfo: (card: CardData) => void;
  t: (key: string) => string;
}

function SwipeCard({ card, isTop, onSwipe, onInfo, t }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);
  const interestedOpacity = useTransform(x, [50, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -50], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!isTop) return;
    const { offset } = info;
    if (offset.x > SWIPE_THRESHOLD) {
      onSwipe('right', card);
    } else if (offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left', card);
    }
  };

  const isProvider = isProviderCard(card);

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 swipe-card cursor-grab active:cursor-grabbing"
      animate={isTop ? {} : { scale: 0.95, y: 8 }}
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 h-full overflow-hidden flex flex-col">
        {/* Swipe overlays */}
        <motion.div
          style={{ opacity: interestedOpacity }}
          className="absolute top-6 left-6 bg-blue-800 text-white text-lg font-black px-4 py-2 rounded-xl rotate-[-12deg] z-10 pointer-events-none border-2 border-blue-600"
        >
          {t('interested')}
        </motion.div>
        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-6 right-6 bg-red-600 text-white text-lg font-black px-4 py-2 rounded-xl rotate-[12deg] z-10 pointer-events-none border-2 border-red-400"
        >
          {t('pass')}
        </motion.div>

        {/* Card content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isProvider ? (
            <ProviderCardContent card={card as ProviderCardData} t={t} />
          ) : (
            <RequestCardContent card={card as RequestCardData} t={t} />
          )}
        </div>

        {/* FitScore at bottom */}
        <div className="px-5 pb-3 pt-2 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('fitScore')}</span>
            <FitScoreBadge score={card.fit_score} size="md" />
          </div>
          <button
            onClick={() => onInfo(card)}
            className="text-xs text-blue-700 flex items-center gap-1 hover:underline"
          >
            <Info size={12} />
            {t('infoBtn')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProviderCardContent({ card, t }: { card: ProviderCardData; t: (k: string) => string }) {
  const pp = card.provider_profile;
  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <Avatar name={card.name} color={card.avatar_color} size="xl" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">{card.name}</h2>
          <p className="text-slate-500 text-sm">{pp.skills[0]}</p>
          <p className="text-xs text-slate-400">{pp.location}{pp.quartier ? `, ${pp.quartier}` : ''}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-bold text-blue-800">{formatPrice(pp.price)}</span>
        <Badge variant={pp.availability === 'immediate' ? 'success' : pp.availability === 'busy' ? 'error' : 'info'}>
          {t(pp.availability)}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold">{pp.rating.toFixed(1)}</span>
        </div>
        <span className="text-slate-400 text-xs">({pp.review_count} reviews)</span>
        <span className="text-slate-400 text-xs">•</span>
        <span className="text-xs text-slate-500">{pp.experience} {t('years')}</span>
      </div>

      {pp.bio && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-3">{pp.bio}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {pp.skills.map((skill) => (
          <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs rounded-full font-medium">
            {skill}
          </span>
        ))}
      </div>
    </>
  );
}

function RequestCardContent({ card, t }: { card: RequestCardData; t: (k: string) => string }) {
  const req = card;
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={card.client.name || card.client.email} color={card.client.avatar_color} size="md" />
        <div>
          <p className="text-sm font-medium text-slate-700">{card.client.name}</p>
          <p className="text-xs text-slate-400">{req.location}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">{req.title}</h2>

      <p className="text-sm text-slate-600 mb-4 line-clamp-3">{req.description}</p>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-bold text-blue-800">{formatPrice(req.budget)}</span>
        <Badge variant={req.urgency === 'urgent' ? 'error' : req.urgency === 'this_week' ? 'info' : 'default'}>
          {t(req.urgency)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {req.required_skills.map((skill) => (
          <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs rounded-full font-medium">
            {skill}
          </span>
        ))}
      </div>
    </>
  );
}

export default function DiscoverPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoCard, setInfoCard] = useState<CardData | null>(null);
  const [weights, setWeights] = useState<Weights | null>(null);
  const [lastSwipedCard, setLastSwipedCard] = useState<CardData | null>(null);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    loadCards();
  }, [user?.active_role]);

  const loadCards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();
      const role = user.active_role;

      // Get weights
      const w = await db.weights
        .where('user_id').equals(user.id)
        .and((ww) => ww.role === role)
        .first();
      setWeights(w || null);

      if (role === 'client') {
        // Check for active requests
        const activeReqs = await db.service_requests
          .where('client_id').equals(user.id)
          .and((r) => r.status === 'open' || r.status === 'in_progress')
          .toArray();

        if (activeReqs.length === 0) {
          setHasActiveRequest(false);
          setLoading(false);
          return;
        }
        setHasActiveRequest(true);

        const clientProfile = await db.client_profiles.where('user_id').equals(user.id).first();
        if (!clientProfile || !w) {
          setLoading(false);
          return;
        }

        // Get already swiped target IDs
        const swipedIds = new Set(
          (await db.swipes.where('swiper_id').equals(user.id).toArray())
            .filter((s) => !s.is_undone)
            .map((s) => s.target_id)
        );

        // Load providers
        const providers = await db.provider_profiles.toArray();
        const users = await db.users.toArray();
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        const reqSkills = activeReqs.flatMap((r) => r.required_skills);

        const cardData: ProviderCardData[] = providers
          .filter((pp) => {
            const pu = userMap[pp.user_id];
            if (!pu || pu.is_deleted || swipedIds.has(pp.user_id)) return false;
            // Filter by matching skills
            const hasMatchingSkill = pp.skills.some((s) =>
              reqSkills.some((rs) => rs.toLowerCase() === s.toLowerCase())
            );
            return hasMatchingSkill;
          })
          .map((pp) => {
            const pu = userMap[pp.user_id];
            const result = computeFitScore(
              clientProfile.preferences,
              pp.skills,
              clientProfile.location,
              pp.location,
              clientProfile.budget_value,
              pp.price,
              pp.rating,
              pp.availability,
              pp.profile_completion,
              pp.experience,
              w as Weights
            );
            return {
              ...pu,
              provider_profile: pp,
              fit_score: result.score,
              fit_score_breakdown: result.breakdown,
            } as ProviderCardData;
          })
          .sort(() => Math.random() - 0.5);

        setCards(cardData);
      } else {
        // Provider: show client requests
        const providerProfile = await db.provider_profiles.where('user_id').equals(user.id).first();
        if (!providerProfile || !w) {
          setLoading(false);
          return;
        }

        const swipedIds = new Set(
          (await db.swipes.where('swiper_id').equals(user.id).toArray())
            .filter((s) => !s.is_undone)
            .map((s) => s.target_id)
        );

        const requests = await db.service_requests.where('status').equals('open').toArray();
        const users = await db.users.toArray();
        const clientProfiles = await db.client_profiles.toArray();
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
        const clientProfileMap = Object.fromEntries(clientProfiles.map((cp) => [cp.user_id, cp]));

        const cardData: RequestCardData[] = requests
          .filter((req) => {
            const hasMatchingSkill = providerProfile.skills.some((s) =>
              req.required_skills.some((rs) => rs.toLowerCase() === s.toLowerCase())
            );
            return !swipedIds.has(req.id) && hasMatchingSkill && req.client_id !== user.id;
          })
          .map((req) => {
            const client = userMap[req.client_id];
            const cp = clientProfileMap[req.client_id];
            if (!client) return null;
            const result = computeFitScore(
              providerProfile.skills,
              req.required_skills,
              providerProfile.location,
              req.location,
              providerProfile.price,
              req.budget,
              0,
              req.urgency,
              cp?.profile_completion || 50,
              0,
              w as Weights
            );
            return {
              ...req,
              client,
              client_profile: cp || null,
              fit_score: result.score,
              fit_score_breakdown: result.breakdown,
            } as RequestCardData;
          })
          .filter(Boolean)
          .sort(() => Math.random() - 0.5) as RequestCardData[];

        setCards(cardData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = useCallback(async (direction: 'left' | 'right', card: CardData) => {
    if (!user || !weights) return;

    const isProvider = isProviderCard(card);
    const targetId = isProvider ? card.id : (card as RequestCardData).id;
    const targetType = isProvider ? 'user' : 'request';

    // Remove card from deck
    setCards((prev) => prev.filter((c) => {
      const cId = isProviderCard(c) ? c.id : (c as RequestCardData).id;
      return cId !== targetId;
    }));

    const db = getDB();
    const now = new Date().toISOString();
    const swipeId = crypto.randomUUID();

    const swipe = {
      id: swipeId,
      swiper_id: user.id,
      target_id: targetId,
      target_type: targetType as 'user' | 'request',
      swiper_role: user.active_role,
      direction,
      fit_score: card.fit_score,
      is_synced: false,
      is_undone: false,
      created_at: now,
    };

    await db.swipes.add(swipe);

    // Show undo toast
    setLastSwipedCard(card);
    if (undoTimer.current) clearTimeout(undoTimer.current);

    showToast(
      direction === 'right' ? t('interested') : t('pass'),
      direction === 'right' ? 'success' : 'info',
      {
        label: t('undo'),
        onClick: () => handleUndo(swipeId, card),
      }
    );

    undoTimer.current = setTimeout(async () => {
      setLastSwipedCard(null);
      // Commit: adjust weights and process match logic
      await commitSwipe(swipeId, direction, card);
    }, 5000);
  }, [user, weights]);

  const handleUndo = async (swipeId: string, card: CardData) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const db = getDB();
    await db.swipes.update(swipeId, { is_undone: true });
    setCards((prev) => [card, ...prev]);
    setLastSwipedCard(null);
    showToast(t('undoSwipe'), 'info');
  };

  const commitSwipe = async (swipeId: string, direction: 'left' | 'right', card: CardData) => {
    if (!user || !weights) return;
    const db = getDB();
    const now = new Date().toISOString();

    // Mark as synced
    await db.swipes.update(swipeId, { is_synced: true });
    await supabase.from('swipes').upsert({
      id: swipeId,
      swiper_id: user.id,
      target_id: isProviderCard(card) ? card.id : (card as RequestCardData).id,
      target_type: isProviderCard(card) ? 'user' : 'request',
      swiper_role: user.active_role,
      direction,
      fit_score: card.fit_score,
      is_synced: true,
      is_undone: false,
      created_at: now,
    });

    // Adjust weights
    const newWeightValues = adjustWeights(weights, card.fit_score_breakdown, direction);
    const updatedWeights = { ...weights, ...newWeightValues, updated_at: now };
    await db.weights.update(weights.id, { ...newWeightValues, updated_at: now });
    await supabase.from('weights').update({ ...newWeightValues, updated_at: now }).eq('id', weights.id);
    setWeights(updatedWeights as Weights);

    if (direction === 'right') {
      await createMatchOrNotification(card, now);
    }
  };

  const createMatchOrNotification = async (card: CardData, now: string) => {
    if (!user) return;
    const db = getDB();
    const matchId = crypto.randomUUID();

    if (user.active_role === 'provider' && !isProviderCard(card)) {
      // Provider swiped right on client request
      const reqCard = card as RequestCardData;
      const match = {
        id: matchId,
        client_id: reqCard.client_id,
        provider_id: user.id,
        request_id: reqCard.id,
        initiated_by: 'provider' as const,
        client_fit_score: 0,
        provider_fit_score: reqCard.fit_score,
        status: 'provider_interested' as const,
        contact_revealed: true,
        created_at: now,
        updated_at: now,
      };

      await db.matches.add(match);
      await supabase.from('matches').insert(match);

      // Notify client
      const notifId = crypto.randomUUID();
      const notif = {
        id: notifId,
        user_id: reqCard.client_id,
        type: 'new_match' as const,
        title: 'New provider interested',
        body: `A provider is interested in your request: ${reqCard.title}`,
        is_read: false,
        reference_id: matchId,
        created_at: now,
      };
      await db.notifications.add(notif);
      await supabase.from('notifications').insert(notif);

    } else if (user.active_role === 'client' && isProviderCard(card)) {
      // Client swiped right on provider — notify provider
      const provCard = card as ProviderCardData;
      const notifId = crypto.randomUUID();
      const notif = {
        id: notifId,
        user_id: provCard.id,
        type: 'request_response' as const,
        title: 'A client wants more info',
        body: `${user.name || 'A client'} is interested in your services`,
        is_read: false,
        reference_id: user.id,
        created_at: now,
      };
      await db.notifications.add(notif);
      await supabase.from('notifications').insert(notif);

      // Create match with client_interested status
      const cp = await db.client_profiles.where('user_id').equals(user.id).first();
      const activeReqs = await db.service_requests
        .where('client_id').equals(user.id)
        .and((r) => r.status === 'open')
        .first();

      const match = {
        id: matchId,
        client_id: user.id,
        provider_id: provCard.id,
        request_id: activeReqs?.id || null,
        initiated_by: 'client' as const,
        client_fit_score: card.fit_score,
        provider_fit_score: 0,
        status: 'client_interested' as const,
        contact_revealed: false,
        created_at: now,
        updated_at: now,
      };
      await db.matches.add(match);
      await supabase.from('matches').insert(match);
    }
  };

  if (!user) return null;

  if (user.active_role === 'client' && !hasActiveRequest && !loading) {
    return (
      <div className="p-4">
        <EmptyState
          title={t('postFirstRequest')}
          description={t('swipeRightToConnect')}
          action={
            <Button onClick={() => window.location.href = '/requests/new'}>
              {t('createRequest')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-lg font-bold text-slate-900 mb-4">{t('discover')}</h1>

      {loading ? (
        <SkeletonList count={1} />
      ) : cards.length === 0 ? (
        <EmptyState
          title={t('noDiscoverResults')}
          description={t('swipeRightToConnect')}
          action={<Button variant="secondary" onClick={loadCards}>{t('retry')}</Button>}
        />
      ) : (
        <>
          {/* Swipe area */}
          <div className="relative flex-1 mb-4" style={{ minHeight: 0 }}>
            {cards.slice(0, 2).reverse().map((card, idx) => {
              const cardId = isProviderCard(card) ? card.id : (card as RequestCardData).id;
              const isTop = idx === cards.slice(0, 2).length - 1;
              return (
                <SwipeCard
                  key={cardId}
                  card={card}
                  isTop={isTop}
                  onSwipe={handleSwipe}
                  onInfo={setInfoCard}
                  t={t}
                />
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4 pb-2">
            <button
              onClick={() => cards[0] && handleSwipe('left', cards[0])}
              className="w-14 h-14 rounded-full bg-white border-2 border-red-200 flex items-center justify-center shadow-md hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              <X size={22} className="text-red-500" />
            </button>
            <button
              onClick={() => cards[0] && setInfoCard(cards[0])}
              className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Info size={18} className="text-slate-500" />
            </button>
            <button
              className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
            >
              <Star size={18} className="text-slate-400" />
            </button>
            <button
              onClick={() => cards[0] && handleSwipe('right', cards[0])}
              className="w-14 h-14 rounded-full bg-blue-800 flex items-center justify-center shadow-md hover:bg-blue-900 transition-colors"
            >
              <Check size={22} className="text-white" />
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-2">{cards.length} {t('discover')}</p>
        </>
      )}

      {/* FitScore modal */}
      {infoCard && weights && (
        <FitScoreBreakdownModal
          open={!!infoCard}
          onClose={() => setInfoCard(null)}
          targetName={isProviderCard(infoCard) ? infoCard.name : (infoCard as RequestCardData).title}
          score={infoCard.fit_score}
          breakdown={infoCard.fit_score_breakdown}
          weights={weights}
        />
      )}
    </div>
  );
}
