'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/features/RatingStars';
import { FitScoreBadge } from '@/components/features/FitScoreBadge';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { formatPrice } from '@/lib/utils/formatters';
import type { User, ProviderProfile, ClientProfile, Match, Conversation } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useRouter as useNavRouter } from 'next/navigation';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const db = getDB();
      const pu = await db.users.get(userId);
      if (!pu) { router.back(); return; }
      setProfileUser(pu);

      const [pp, cp] = await Promise.all([
        db.provider_profiles.where('user_id').equals(userId).first(),
        db.client_profiles.where('user_id').equals(userId).first(),
      ]);
      setProviderProfile(pp || null);
      setClientProfile(cp || null);

      if (user) {
        const matches = await db.matches
          .where('client_id').equals(user.id)
          .or('provider_id').equals(user.id)
          .toArray();
        const found = matches.find((m) =>
          (m.client_id === user.id && m.provider_id === userId) ||
          (m.provider_id === user.id && m.client_id === userId)
        );
        setMatch(found || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async () => {
    if (!match) return;
    const db = getDB();
    let conv = await db.conversations.where('match_id').equals(match.id).first();
    if (!conv) {
      const convId = crypto.randomUUID();
      const now = new Date().toISOString();
      const newConv = { id: convId, match_id: match.id, created_at: now, last_message_at: now };
      await db.conversations.add(newConv);
      await supabase.from('conversations').insert(newConv);
      conv = newConv;
    }
    router.push(`/messages/${conv.id}`);
  };

  if (!profileUser) return null;
  const isProvider = !!providerProfile;
  const hasMatch = match && match.status !== 'archived';

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 mb-4">
        <ArrowLeft size={18} />
        <span className="text-sm">{t('back')}</span>
      </button>

      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <Avatar name={profileUser.name || profileUser.email} color={profileUser.avatar_color} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">{profileUser.name}</h1>
            {isProvider && providerProfile && (
              <>
                <p className="text-slate-500 text-sm">{providerProfile.skills[0]}</p>
                <p className="text-xs text-slate-400">{providerProfile.location}{providerProfile.quartier && `, ${providerProfile.quartier}`}</p>
              </>
            )}
          </div>
        </div>

        {isProvider && providerProfile && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-blue-800">{formatPrice(providerProfile.price)}</span>
              <Badge variant={providerProfile.availability === 'immediate' ? 'success' : 'info'}>
                {t(providerProfile.availability)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <RatingStars value={providerProfile.rating} readonly size="sm" />
              <span className="text-sm text-slate-500">({providerProfile.review_count} {t('reviews')})</span>
            </div>
            {providerProfile.bio && <p className="text-sm text-slate-600">{providerProfile.bio}</p>}
            <div className="flex flex-wrap gap-1.5">
              {providerProfile.skills.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-800 text-xs rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Contact info */}
      {isProvider && providerProfile && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('contactInfo')}</h3>
          {hasMatch && match?.contact_revealed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span className="text-sm">{providerProfile.phone}</span>
              </div>
              {providerProfile.whatsapp && (
                <a
                  href={`https://wa.me/${providerProfile.whatsapp.replace('+', '')}`}
                  className="text-sm text-green-600 font-medium hover:underline block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: {providerProfile.whatsapp}
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{t('contactAfterMatch')}</p>
          )}
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {hasMatch && (
          <Button variant="secondary" fullWidth onClick={startConversation}>
            <MessageSquare size={16} />
            {t('message')}
          </Button>
        )}
      </div>
    </div>
  );
}
