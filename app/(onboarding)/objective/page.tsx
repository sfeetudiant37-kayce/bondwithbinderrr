'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useUserStore } from '@/lib/stores/userStore';
import { cn } from '@/lib/utils/cn';

type Objective = 'client' | 'provider';

export default function ObjectivePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<Objective | null>(null);
  const { setActiveRole } = useUserStore();

  const handleContinue = () => {
    if (!selected) return;
    setActiveRole(selected);
    // Store selection in sessionStorage for next steps
    sessionStorage.setItem('onboarding_role', selected);
    router.push('/preferences');
  };

  const cards = [
    {
      id: 'client' as Objective,
      icon: Search,
      title: t('iNeedService'),
      desc: t('findTrustedPros'),
    },
    {
      id: 'provider' as Objective,
      icon: Wrench,
      title: t('iOfferServices'),
      desc: t('connectWithClients'),
    },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 py-10">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn('h-1 flex-1 rounded-full', step === 1 ? 'bg-blue-800' : 'bg-slate-200')}
          />
        ))}
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('whatBringsYou')}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t('choosePrimaryRole')}</p>
      </div>

      <div className="space-y-4 flex-1">
        {cards.map(({ id, icon: Icon, title, desc }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={cn(
              'w-full p-5 rounded-2xl border-2 text-left transition-all duration-150 bg-white',
              selected === id
                ? 'border-blue-800 shadow-md'
                : 'border-slate-200 hover:border-blue-200'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                selected === id ? 'bg-blue-800' : 'bg-slate-100'
              )}>
                <Icon size={20} className={selected === id ? 'text-white' : 'text-slate-600'} />
              </div>
              <div>
                <p className={cn('font-semibold', selected === id ? 'text-blue-800' : 'text-slate-900')}>
                  {title}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        fullWidth
        size="lg"
        disabled={!selected}
        onClick={handleContinue}
        className="mt-8"
      >
        {t('continue')}
      </Button>
    </div>
  );
}
