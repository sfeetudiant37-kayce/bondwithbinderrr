'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useUserStore } from '@/lib/stores/userStore';
import { supabase } from '@/lib/supabase/client';
import { getDB } from '@/lib/db/dexie';
import { buildInitialWeights } from '@/lib/algorithms/fitscore';
import { calculateClientProfileCompletion, calculateProviderProfileCompletion, budgetRangeToValue } from '@/lib/algorithms/profileCompletion';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';
import type { Priority, ClientProfile, ProviderProfile, Weights, UserPriorities } from '@/types';

const AVATAR_COLORS = ['blue', 'green', 'purple', 'orange', 'pink'];
const AVATAR_BG: Record<string, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
};

const CITIES = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Other'];
const AVAILABILITY_OPTIONS = ['immediate', 'this_week', 'flexible', 'busy'];

export default function ProfileSetupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, updateUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  const role = (typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_role') : null) || user?.active_role || 'client';
  const rawPrefs = typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_preferences') : null;
  const preferences: string[] = rawPrefs ? JSON.parse(rawPrefs) : [];
  const rawPriorities = typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_priorities') : null;
  const priorities: Record<string, Priority> = rawPriorities ? JSON.parse(rawPriorities) : {};

  const [form, setForm] = useState({
    location: '',
    quartier: '',
    budget_range: 'under_10k',
    description: '',
    bio: '',
    skills: preferences,
    price: '',
    availability: 'flexible',
    experience: '',
    phone: user?.phone || '',
    whatsapp: '',
    avatar_color: 'blue',
  });

  const update = (key: string, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSkillToggle = (skill: string) => {
    const current = form.skills;
    if (current.includes(skill)) {
      update('skills', current.filter((s) => s !== skill));
    } else {
      update('skills', [...current, skill]);
    }
  };

  const saveProfile = async (skipMode = false) => {
    if (!user) return;
    setLoading(true);

    try {
      const db = getDB();
      const now = new Date().toISOString();

      // Build weights from priorities
      const weightValues = buildInitialWeights({
        location: (priorities.location || 'medium') as Priority,
        price: (priorities.price || 'medium') as Priority,
        rating: (priorities.rating || 'medium') as Priority,
        availability: (priorities.availability || 'medium') as Priority,
        experience: (priorities.experience || 'medium') as Priority,
      });

      const hasPriorities = Object.keys(priorities).length > 0;

      // Save weights
      const weightsId = crypto.randomUUID();
      const weightsRecord = {
        id: weightsId,
        user_id: user.id,
        role,
        preferences: weightValues.preferences,
        location: weightValues.location,
        price: weightValues.price,
        rating: weightValues.rating,
        availability: weightValues.availability,
        profile_completeness: weightValues.profile_completeness,
        experience: weightValues.experience,
        updated_at: now,
      };

      // Save user priorities
      const prioritiesId = crypto.randomUUID();
      const prioritiesRecord = {
        id: prioritiesId,
        user_id: user.id,
        role,
        location_priority: (priorities.location || 'medium') as Priority,
        price_priority: (priorities.price || 'medium') as Priority,
        rating_priority: (priorities.rating || 'medium') as Priority,
        availability_priority: (priorities.availability || 'medium') as Priority,
        experience_priority: (priorities.experience || 'medium') as Priority,
        created_at: now,
      };

      if (role === 'client') {
        const avatarColor = form.avatar_color as 'blue' | 'green' | 'purple' | 'orange' | 'pink';
        const profileData = {
          location: form.location,
          quartier: form.quartier,
          budget_range: form.budget_range,
          description: form.description,
          preferences,
          avatar_color: avatarColor,
          has_priorities: hasPriorities,
        };

        const completion = skipMode ? 40 : calculateClientProfileCompletion(profileData);
        const clientProfileId = crypto.randomUUID();

        const clientProfile = {
          id: clientProfileId,
          user_id: user.id,
          location: form.location,
          quartier: form.quartier,
          budget_range: form.budget_range,
          budget_value: budgetRangeToValue(form.budget_range),
          description: form.description,
          preferences,
          profile_completion: completion,
          created_at: now,
          updated_at: now,
        };

        await db.client_profiles.put(clientProfile as ClientProfile);
        await supabase.from('client_profiles').upsert(clientProfile);

        const userUpdates = {
          has_client_profile: true,
          active_role: 'client' as const,
          avatar_color: avatarColor,
          updated_at: now,
        };
        await db.users.update(user.id, userUpdates);
        await supabase.from('users').update(userUpdates).eq('id', user.id);
        updateUser({ ...userUpdates });

      } else {
        const avatarColor = form.avatar_color as 'blue' | 'green' | 'purple' | 'orange' | 'pink';
        const profileData = {
          location: form.location,
          quartier: form.quartier,
          skills: form.skills,
          price: Number(form.price) || 0,
          availability: form.availability,
          experience: Number(form.experience) || 0,
          bio: form.bio,
          phone: form.phone,
          whatsapp: form.whatsapp,
          avatar_color: avatarColor,
        };

        const completion = skipMode ? 40 : calculateProviderProfileCompletion(profileData);
        const providerProfileId = crypto.randomUUID();

        const providerProfile = {
          id: providerProfileId,
          user_id: user.id,
          location: form.location,
          quartier: form.quartier,
          skills: form.skills,
          price: Number(form.price) || 0,
          availability: form.availability,
          experience: Number(form.experience) || 0,
          bio: form.bio,
          phone: form.phone,
          whatsapp: form.whatsapp,
          rating: 0,
          review_count: 0,
          profile_completion: completion,
          created_at: now,
          updated_at: now,
        };

        await db.provider_profiles.put(providerProfile as unknown as ProviderProfile);
        await supabase.from('provider_profiles').upsert(providerProfile);

        const userUpdates = {
          has_provider_profile: true,
          active_role: 'provider' as const,
          avatar_color: avatarColor,
          updated_at: now,
        };
        await db.users.update(user.id, userUpdates);
        await supabase.from('users').update(userUpdates).eq('id', user.id);
        updateUser({ ...userUpdates });
      }

      // Save weights and priorities
      await db.weights.put(weightsRecord as unknown as Weights);
      await db.user_priorities.put(prioritiesRecord as unknown as UserPriorities);
      await supabase.from('weights').upsert(weightsRecord);
      await supabase.from('user_priorities').upsert(prioritiesRecord);

      // Clear session storage
      sessionStorage.removeItem('onboarding_role');
      sessionStorage.removeItem('onboarding_preferences');
      sessionStorage.removeItem('onboarding_priorities');

      router.replace('/dashboard');
    } catch (err) {
      console.error('Profile setup error:', err);
      showToast(t('errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const cityOptions = CITIES.map((c) => ({ value: c.toLowerCase(), label: c }));
  const budgetOptions = [
    { value: 'under_10k', label: t('under10k') },
    { value: '10k_30k', label: t('10k30k') },
    { value: '30k_100k', label: t('30k100k') },
    { value: 'above_100k', label: t('above100k') },
  ];
  const availabilityOptions = AVAILABILITY_OPTIONS.map((a) => ({
    value: a,
    label: t(a),
  }));

  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 py-10">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn('h-1 flex-1 rounded-full', 'bg-blue-800')}
          />
        ))}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('setupProfile')}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t('letsGetStarted')}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <Select
          label={t('location')}
          options={[{ value: '', label: 'Select city...' }, ...cityOptions]}
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
        />

        <Input
          label={t('quartier')}
          placeholder="e.g. Bastos"
          value={form.quartier}
          onChange={(e) => update('quartier', e.target.value)}
        />

        {/* Avatar color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t('avatarColor')}</label>
          <div className="flex gap-3">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => update('avatar_color', color)}
                className={cn(
                  'w-9 h-9 rounded-full transition-transform',
                  AVATAR_BG[color],
                  form.avatar_color === color && 'ring-2 ring-offset-2 ring-blue-800 scale-110'
                )}
              />
            ))}
          </div>
        </div>

        {role === 'client' ? (
          <>
            <Select
              label={t('budgetRange')}
              options={budgetOptions}
              value={form.budget_range}
              onChange={(e) => update('budget_range', e.target.value)}
            />
            <Textarea
              label={t('description')}
              placeholder="Tell providers about yourself and your needs..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
            />
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('skills')}</label>
              <div className="flex flex-wrap gap-2">
                {preferences.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    selected={form.skills.includes(skill)}
                    onClick={() => handleSkillToggle(skill)}
                  />
                ))}
              </div>
            </div>
            <Input
              label={t('price')}
              type="number"
              placeholder="15000"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
            <Select
              label={t('availability')}
              options={availabilityOptions}
              value={form.availability}
              onChange={(e) => update('availability', e.target.value)}
            />
            <Input
              label={t('experience')}
              type="number"
              placeholder="3"
              value={form.experience}
              onChange={(e) => update('experience', e.target.value)}
            />
            <Textarea
              label={t('bio')}
              placeholder="Describe your services..."
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
            />
            <Input
              label={t('phone') + ' *'}
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
            <Input
              label={t('whatsapp')}
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={form.whatsapp}
              onChange={(e) => update('whatsapp', e.target.value)}
            />
          </>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <Button fullWidth size="lg" loading={loading} onClick={() => saveProfile(false)}>
          {t('completeProfile')}
        </Button>
        <button
          onClick={() => saveProfile(true)}
          className="w-full text-center text-sm text-slate-500 hover:text-blue-800 py-2"
        >
          {t('skipForNow')}
        </button>
      </div>
    </div>
  );
}
