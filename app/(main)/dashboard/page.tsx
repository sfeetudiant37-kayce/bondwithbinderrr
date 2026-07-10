'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronRight, Star, Users, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonList } from '@/components/ui/Skeleton';
import { FitScoreBadge } from '@/components/features/FitScoreBadge';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { computeFitScore } from '@/lib/algorithms/fitscore';
import { formatPrice } from '@/lib/utils/formatters';
import type { User, ProviderProfile, ClientProfile, ServiceRequest, Weights } from '@/types';

interface ProviderWithProfile {
  user: User;
  profile: ProviderProfile;
  fitScore: number;
}

interface RequestWithClient {
  request: ServiceRequest;
  client: User;
  fitScore: number;
}

export default function DashboardPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [hasRequests, setHasRequests] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [mySwipesCount, setMySwipesCount] = useState(0);
  const [recommendedProviders, setRecommendedProviders] = useState<ProviderWithProfile[]>([]);
  const [nearbyRequests, setNearbyRequests] = useState<RequestWithClient[]>([]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user?.active_role]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();

      const [cp, pp] = await Promise.all([
        db.client_profiles.where('user_id').equals(user.id).first(),
        db.provider_profiles.where('user_id').equals(user.id).first(),
      ]);

      setClientProfile(cp || null);
      setProviderProfile(pp || null);

      if (user.active_role === 'client') {
        // Check for active requests
        const activeReqs = await db.service_requests
          .where('client_id')
          .equals(user.id)
          .and((r) => r.status === 'open' || r.status === 'in_progress')
          .count();
        setHasRequests(activeReqs > 0);

        // Count interested providers (matches)
        const matchCount = await db.matches
          .where('client_id')
          .equals(user.id)
          .and((m) => m.status !== 'archived')
          .count();
        setInterestedCount(matchCount);

        // Load recommended providers (random 3)
        if (activeReqs > 0 && cp) {
          const weights = await db.weights
            .where('user_id').equals(user.id)
            .and((w) => w.role === 'client')
            .first();

          const allProviders = await db.provider_profiles.toArray();
          const allUsers = await db.users.toArray();
          const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u]));

          // Shuffle and take 3
          const shuffled = allProviders
            .filter((p) => p.user_id !== user.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const withScores: ProviderWithProfile[] = shuffled.map((pp) => {
            const pUser = userMap[pp.user_id];
            if (!pUser || !weights) return { user: pUser, profile: pp, fitScore: 0 };
            const result = computeFitScore(
              cp.preferences,
              pp.skills,
              cp.location,
              pp.location,
              cp.budget_value,
              pp.price,
              pp.rating,
              pp.availability,
              pp.profile_completion,
              pp.experience,
              weights as Weights
            );
            return { user: pUser, profile: pp, fitScore: result.score };
          }).filter((x) => x.user);

          setRecommendedProviders(withScores);
        }
      } else {
        // Provider: load nearby requests
        const swipeCount = await db.swipes.where('swiper_id').equals(user.id).count();
        const matchCount = await db.matches
          .where('provider_id').equals(user.id)
          .and((m) => m.status !== 'archived')
          .count();
        setMySwipesCount(swipeCount);
        setInterestedCount(matchCount);

        if (pp) {
          const weights = await db.weights
            .where('user_id').equals(user.id)
            .and((w) => w.role === 'provider')
            .first();

          const allRequests = await db.service_requests
            .where('status').equals('open')
            .toArray();
          const allUsers = await db.users.toArray();
          const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u]));

          const shuffled = allRequests
            .filter((r) => r.client_id !== user.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const withScores: RequestWithClient[] = shuffled.map((req) => {
            const client = userMap[req.client_id];
            if (!client || !weights) return { request: req, client, fitScore: 0 };
            const result = computeFitScore(
              pp.skills,
              req.required_skills,
              pp.location,
              req.location,
              pp.price,
              req.budget,
              0,
              req.urgency,
              pp.profile_completion,
              pp.experience,
              weights as Weights
            );
            return { request: req, client, fitScore: result.score };
          }).filter((x) => x.client);

          setNearbyRequests(withScores);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const profile = user.active_role === 'client' ? clientProfile : providerProfile;
  const completion = profile?.profile_completion || 0;

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {t('hi')}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user.active_role === 'client' ? t('activeAsClient') : t('activeAsProvider')}
          </p>
        </div>
        <Avatar name={user.name || user.email} color={user.avatar_color} size="lg" />
      </div>

      {/* Profile completion */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{t('profileCompletion')}</span>
          <span className="text-sm font-bold text-blue-800">{completion}%</span>
        </div>
        <ProgressBar value={completion} color={completion >= 70 ? 'green' : 'blue'} />
        {completion < 70 && (
          <Link href="/profile" className="text-xs text-blue-700 hover:underline mt-2 block">
            {t('editProfile')} →
          </Link>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-800">{interestedCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
              {user.active_role === 'client' ? t('interestedProviders') : t('clientInterests')}
            </p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-800">
              {user.active_role === 'provider' ? (providerProfile?.rating?.toFixed(1) || '0.0') : (providerProfile?.rating?.toFixed(1) || '—')}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t('rating')}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-800">
              {user.active_role === 'provider' ? mySwipesCount : (providerProfile?.review_count || 0)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {user.active_role === 'provider' ? t('mySwipes') : t('reviews')}
            </p>
          </div>
        </Card>
      </div>

      {/* Main content section */}
      {user.active_role === 'client' ? (
        <>
          {!hasRequests ? (
            <Card>
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Plus size={22} className="text-blue-800" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">{t('postFirstRequest')}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push('/requests/new')}
                >
                  {t('postMyFirstRequest')}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">{t('recommendedForYou')}</h2>
                <Link href="/discover" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                  {t('viewAll')} <ChevronRight size={12} />
                </Link>
              </div>

              {loading ? <SkeletonList count={3} /> : (
                <div className="space-y-3">
                  {recommendedProviders.map(({ user: pUser, profile: pp, fitScore }) => (
                    <Card key={pUser.id} padding="sm" className="flex items-center gap-3">
                      <Avatar name={pUser.name} color={pUser.avatar_color} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{pUser.name}</p>
                        <p className="text-xs text-slate-500">{pp.skills[0]} • {pp.location}</p>
                        <p className="text-xs font-semibold text-blue-800">{formatPrice(pp.price)}</p>
                      </div>
                      <FitScoreBadge score={fitScore} />
                    </Card>
                  ))}
                  {recommendedProviders.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">{t('noDiscoverResults')}</p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{t('clientRequestsNearYou')}</h2>
            <Link href="/discover" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
              {t('viewAll')} <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? <SkeletonList count={3} /> : (
            <div className="space-y-3">
              {nearbyRequests.map(({ request, client, fitScore }) => (
                <Card key={request.id} padding="sm">
                  <div className="flex items-start gap-3">
                    <Avatar name={client.name || client.email} color={client.avatar_color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{request.title}</p>
                      <p className="text-xs text-slate-500">{client.name} • {request.location}</p>
                      <p className="text-xs font-semibold text-blue-800 mt-0.5">{formatPrice(request.budget)}</p>
                    </div>
                    <FitScoreBadge score={fitScore} />
                  </div>
                </Card>
              ))}
              {nearbyRequests.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">{t('noDiscoverResults')}</p>
              )}
            </div>
          )}
        </>
      )}

      <Button
        variant="secondary"
        fullWidth
        onClick={() => router.push('/discover')}
        className="mt-2"
      >
        {t('discoverMore')}
      </Button>
    </div>
  );
}
