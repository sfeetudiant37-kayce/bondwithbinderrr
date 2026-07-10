'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils/cn';

const CATEGORIES = [
  'hairdresser', 'nailTech', 'tailor', 'graphicDesign',
  'plumbing', 'electrical', 'carpentry', 'painting',
  'cleaning', 'cooking', 'tailoring', 'tiling',
  'welding', 'autoRepair', 'photography', 'masonry',
  'motoTaxi',
];

const MAX_SELECTIONS = 4;

export default function PreferencesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customItems, setCustomItems] = useState<string[]>([]);

  const allItems = [...CATEGORIES, ...customItems.map((item) => `custom:${item}`)];

  const toggleItem = (key: string) => {
    if (selected.includes(key)) {
      setSelected(selected.filter((s) => s !== key));
    } else if (selected.length < MAX_SELECTIONS) {
      setSelected([...selected, key]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const key = `custom:${trimmed}`;
    if (!customItems.includes(trimmed) && selected.length < MAX_SELECTIONS) {
      setCustomItems([...customItems, trimmed]);
      setSelected([...selected, key]);
    }
    setCustomInput('');
  };

  const getLabel = (key: string) => {
    if (key.startsWith('custom:')) return key.replace('custom:', '');
    return t(key);
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    const prefs = selected.map((k) => k.startsWith('custom:') ? k.replace('custom:', '') : t(k));
    sessionStorage.setItem('onboarding_preferences', JSON.stringify(prefs));
    router.push('/priorities');
  };

  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 py-10">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn('h-1 flex-1 rounded-full', step <= 2 ? 'bg-blue-800' : 'bg-slate-200')}
          />
        ))}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('selectInterests')}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t('chooseUpTo4')}</p>
        <div className="mt-2">
          <span className={cn(
            'text-sm font-medium',
            selected.length === 0 ? 'text-slate-400' : 'text-blue-800'
          )}>
            {selected.length} / {MAX_SELECTIONS} {t('selected')}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {allItems.map((key) => (
            <Chip
              key={key}
              label={getLabel(key)}
              selected={selected.includes(key)}
              onClick={() => toggleItem(key)}
              disabled={!selected.includes(key) && selected.length >= MAX_SELECTIONS}
            />
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder={t('addCustom')}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={addCustom}
            disabled={!customInput.trim() || selected.length >= MAX_SELECTIONS}
          >
            <Plus size={16} />
          </Button>
        </div>

        {selected.length === 0 && (
          <p className="text-xs text-red-600 mt-2">{t('pleaseSelectOne')}</p>
        )}
      </div>

      <Button
        fullWidth
        size="lg"
        disabled={selected.length === 0}
        onClick={handleContinue}
        className="mt-6"
      >
        {t('continue')}
      </Button>
    </div>
  );
}
