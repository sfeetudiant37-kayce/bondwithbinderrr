'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getDB } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/Toast';

const SKILLS = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning',
  'Cooking', 'Tiling', 'Welding', 'Auto Repair', 'Photography',
  'Masonry', 'Moto taxi', 'Hair dresser', 'Nail tech', 'Tailor',
  'Graphic design', 'Other',
];

const CATEGORIES = [
  { value: 'moto_taxi', label: 'Moto taxi' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'other', label: 'Other' },
];

export default function NewRequestPage() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    urgency: 'flexible',
    location: '',
    required_skills: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSkill = (skill: string) => {
    const current = form.required_skills;
    if (current.includes(skill)) {
      update('required_skills', current.filter((s) => s !== skill));
    } else {
      update('required_skills', [...current, skill]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.budget || Number(form.budget) <= 0) newErrors.budget = 'Valid budget is required';
    if (form.required_skills.length === 0) newErrors.skills = 'Select at least one skill';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setLoading(true);
    try {
      const db = getDB();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const cp = await db.client_profiles.where('user_id').equals(user.id).first();

      const request = {
        id,
        client_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location || cp?.location || '',
        budget: Number(form.budget),
        urgency: form.urgency as 'urgent' | 'this_week' | 'flexible',
        required_skills: form.required_skills,
        status: 'open' as const,
        accepted_provider_id: null,
        created_at: now,
        updated_at: now,
        completed_at: null,
      };

      await db.service_requests.add(request);
      await supabase.from('service_requests').insert(request);

      showToast(t('requestPosted'), 'success');
      router.replace('/requests');
    } catch (err) {
      showToast(t('errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{t('newRequest')}</h1>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <Input
          label={t('requestTitle')}
          placeholder="Fix bathroom sink"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          error={errors.title}
        />

        <Textarea
          label={t('requestDescription')}
          placeholder="Describe what you need..."
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          error={errors.description}
        />

        <Select
          label={t('category')}
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          options={[{ value: '', label: 'Select category...' }, ...CATEGORIES]}
          error={errors.category}
        />

        <Input
          label={t('budget')}
          type="number"
          placeholder="15000"
          value={form.budget}
          onChange={(e) => update('budget', e.target.value)}
          error={errors.budget}
        />

        <Select
          label={t('urgency')}
          value={form.urgency}
          onChange={(e) => update('urgency', e.target.value)}
          options={[
            { value: 'urgent', label: t('urgent') },
            { value: 'this_week', label: t('thisWeek') },
            { value: 'flexible', label: t('flexible') },
          ]}
        />

        <Input
          label={t('location')}
          placeholder="Douala"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('requiredSkills')}
          </label>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                selected={form.required_skills.includes(skill)}
                onClick={() => toggleSkill(skill)}
              />
            ))}
          </div>
          {errors.skills && <p className="text-xs text-red-600 mt-1.5">{errors.skills}</p>}
        </div>

        <Button fullWidth size="lg" loading={loading} onClick={handleSubmit}>
          {t('postRequest')}
        </Button>
      </div>
    </div>
  );
}
