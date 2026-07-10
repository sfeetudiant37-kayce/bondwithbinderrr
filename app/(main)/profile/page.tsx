'use client';

import { useEffect, useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/formatters';
import { calculateClientProfileCompletion, calculateProviderProfileCompletion, budgetRangeToValue } from '@/lib/algorithms/profileCompletion';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';
import type { ClientProfile, ProviderProfile, Weights } from '@/types';

const AVATAR_COLORS = ['blue', 'green', 'purple', 'orange', 'pink'];
const AVATAR_BG: Record<string, string> = {
  blue: 'bg-blue-600', green: 'bg-green-600',
  purple: 'bg-purple-600', orange: 'bg-orange-500', pink: 'bg-pink-500',
};

export default function ProfilePage() {
  const { user, updateUser } = useUserStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [weights, setWeights] = useState<Weights | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user?.active_role]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getDB();
      const [cp, pp, w, matches] = await Promise.all([
        db.client_profiles.where('user_id').equals(user.id).first(),
        db.provider_profiles.where('user_id').equals(user.id).first(),
        db.weights.where('user_id').equals(user.id).and((ww) => ww.role === user.active_role).first(),
        db.matches.where('client_id').equals(user.id).or('provider_id').equals(user.id).count(),
      ]);
      setClientProfile(cp || null);
      setProviderProfile(pp || null);
      setWeights(w || null);
      setMatchCount(matches);

      // Initialize edit form
      if (user.active_role === 'client' && cp) {
        setEditForm({
          location: cp.location,
          quartier: cp.quartier,
          budget_range: cp.budget_range,
          description: cp.description,
          avatar_color: user.avatar_color,
        });
      } else if (user.active_role === 'provider' && pp) {
        setEditForm({
          location: pp.location,
          quartier: pp.quartier,
          bio: pp.bio,
          price: String(pp.price),
          availability: pp.availability,
          experience: String(pp.experience),
          phone: pp.phone,
          whatsapp: pp.whatsapp,
          avatar_color: user.avatar_color,
          skills: pp.skills,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const db = getDB();
      const now = new Date().toISOString();

      if (user.active_role === 'client' && clientProfile) {
        const updates = {
          location: editForm.location as string,
          quartier: editForm.quartier as string,
          budget_range: editForm.budget_range as string,
          budget_value: budgetRangeToValue(editForm.budget_range as string),
          description: editForm.description as string,
          profile_completion: calculateClientProfileCompletion({
            location: editForm.location as string,
            quartier: editForm.quartier as string,
            budget_range: editForm.budget_range as string,
            description: editForm.description as string,
            avatar_color: editForm.avatar_color as string,
            preferences: clientProfile.preferences,
            has_priorities: true,
          }),
          updated_at: now,
        };
        await db.client_profiles.update(clientProfile.id, updates as Partial<ClientProfile>);
        await supabase.from('client_profiles').update(updates).eq('id', clientProfile.id);
      } else if (user.active_role === 'provider' && providerProfile) {
        const updates = {
          location: editForm.location as string,
          quartier: editForm.quartier as string,
          bio: editForm.bio as string,
          price: Number(editForm.price) || 0,
          availability: editForm.availability as string,
          experience: Number(editForm.experience) || 0,
          phone: editForm.phone as string,
          whatsapp: editForm.whatsapp as string,
          skills: editForm.skills as string[],
          profile_completion: calculateProviderProfileCompletion({
            location: editForm.location as string,
            quartier: editForm.quartier as string,
            skills: editForm.skills as string[],
            price: Number(editForm.price) || 0,
            availability: editForm.availability as string,
            experience: Number(editForm.experience) || 0,
            bio: editForm.bio as string,
            phone: editForm.phone as string,
            whatsapp: editForm.whatsapp as string,
            avatar_color: editForm.avatar_color as string,
          }),
          updated_at: now,
        };
        await db.provider_profiles.update(providerProfile.id, updates as Partial<ProviderProfile>);
        await supabase.from('provider_profiles').update(updates).eq('id', providerProfile.id);
      }

      // Update avatar color
      const avatarColor = editForm.avatar_color as 'blue' | 'green' | 'purple' | 'orange' | 'pink';
      await db.users.update(user.id, { avatar_color: avatarColor, updated_at: now });
      await supabase.from('users').update({ avatar_color: avatarColor, updated_at: now }).eq('id', user.id);
      updateUser({ avatar_color: avatarColor });

      showToast(t('profileUpdated'), 'success');
      setEditOpen(false);
      await loadProfile();
    } catch (err) {
      showToast(t('errorOccurred'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeProfile = user?.active_role === 'client' ? clientProfile : providerProfile;
  const completion = activeProfile?.profile_completion || 0;

  if (!user) return null;

  const WEIGHT_FACTORS = weights ? [
    { key: 'preferences', label: t('preferences'), value: Math.round(weights.preferences * 100) },
    { key: 'location', label: t('locationFactor'), value: Math.round(weights.location * 100) },
    { key: 'price', label: t('priceFactor'), value: Math.round(weights.price * 100) },
    { key: 'rating', label: t('ratingFactor'), value: Math.round(weights.rating * 100) },
    { key: 'availability', label: t('availabilityFactor'), value: Math.round(weights.availability * 100) },
    { key: 'completeness', label: t('profileCompleteness'), value: Math.round(weights.profile_completeness * 100) },
    { key: 'experience', label: t('experienceFactor'), value: Math.round(weights.experience * 100) },
  ] : [];

  return (
    <div className="p-4 space-y-4">
      {/* Profile header */}
      <Card>
        <div className="flex items-start gap-4">
          <Avatar name={user.name || user.email} color={user.avatar_color} size="xl" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-blue-700 mt-1 font-medium">
              {user.active_role === 'client' ? t('activeAsClient') : t('activeAsProvider')}
            </p>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-800 hover:bg-blue-100 transition-colors"
          >
            <Edit2 size={15} />
          </button>
        </div>

        {/* Profile info */}
        {user.active_role === 'client' && clientProfile && (
          <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
            {clientProfile.location && <p className="text-sm text-slate-600">{clientProfile.location}{clientProfile.quartier && `, ${clientProfile.quartier}`}</p>}
            {clientProfile.description && <p className="text-sm text-slate-500 line-clamp-2">{clientProfile.description}</p>}
            {clientProfile.preferences.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {clientProfile.preferences.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-800 text-xs rounded-full">{p}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {user.active_role === 'provider' && providerProfile && (
          <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
            {providerProfile.location && <p className="text-sm text-slate-600">{providerProfile.location}{providerProfile.quartier && `, ${providerProfile.quartier}`}</p>}
            {providerProfile.bio && <p className="text-sm text-slate-500 line-clamp-2">{providerProfile.bio}</p>}
            <p className="text-sm font-semibold text-blue-800">{formatPrice(providerProfile.price)}</p>
            {providerProfile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {providerProfile.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-800 text-xs rounded-full">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Profile completion */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{t('profileCompletion')}</span>
          <span className="text-sm font-bold text-blue-800">{completion}%</span>
        </div>
        <ProgressBar value={completion} color={completion >= 70 ? 'green' : 'blue'} showLabel={false} />
      </Card>

      {/* Stats */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('statistics')}</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-800">{matchCount}</p>
            <p className="text-xs text-slate-500">{t('matchesCount')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-800">
              {providerProfile?.rating?.toFixed(1) || '—'}
            </p>
            <p className="text-xs text-slate-500">{t('rating')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-800">
              {providerProfile?.review_count || 0}
            </p>
            <p className="text-xs text-slate-500">{t('reviews')}</p>
          </div>
        </div>
      </Card>

      {/* Matching weights */}
      {weights && WEIGHT_FACTORS.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('matchingWeights')}</h3>
          <div className="space-y-2.5">
            {WEIGHT_FACTORS.map(({ key, label, value }) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className="text-xs font-semibold text-slate-700">{value}%</span>
                </div>
                <ProgressBar value={value} max={35} height="xs" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('editProfile')}>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('avatarColor')}</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditForm((f) => ({ ...f, avatar_color: c }))}
                  className={cn(
                    'w-8 h-8 rounded-full transition-transform',
                    AVATAR_BG[c],
                    editForm.avatar_color === c && 'ring-2 ring-offset-2 ring-blue-800 scale-110'
                  )}
                />
              ))}
            </div>
          </div>

          <Input
            label={t('location')}
            value={editForm.location as string || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
          />
          <Input
            label={t('quartier')}
            value={editForm.quartier as string || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, quartier: e.target.value }))}
          />

          {user.active_role === 'client' ? (
            <>
              <Select
                label={t('budgetRange')}
                value={editForm.budget_range as string}
                onChange={(e) => setEditForm((f) => ({ ...f, budget_range: e.target.value }))}
                options={[
                  { value: 'under_10k', label: t('under10k') },
                  { value: '10k_30k', label: t('10k30k') },
                  { value: '30k_100k', label: t('30k100k') },
                  { value: 'above_100k', label: t('above100k') },
                ]}
              />
              <Textarea
                label={t('description')}
                value={editForm.description as string || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </>
          ) : (
            <>
              <Input
                label={t('price')}
                type="number"
                value={editForm.price as string || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              />
              <Select
                label={t('availability')}
                value={editForm.availability as string}
                onChange={(e) => setEditForm((f) => ({ ...f, availability: e.target.value }))}
                options={[
                  { value: 'immediate', label: t('immediate') },
                  { value: 'this_week', label: t('thisWeek') },
                  { value: 'flexible', label: t('flexible') },
                  { value: 'busy', label: t('busy') },
                ]}
              />
              <Input
                label={t('experience')}
                type="number"
                value={editForm.experience as string || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, experience: e.target.value }))}
              />
              <Textarea
                label={t('bio')}
                value={editForm.bio as string || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
              />
              <Input
                label={t('phone')}
                value={editForm.phone as string || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label={t('whatsapp')}
                value={editForm.whatsapp as string || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setEditOpen(false)}>
              {t('cancel')}
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
