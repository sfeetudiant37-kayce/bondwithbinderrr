'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils/cn';
import type { Priority } from '@/types';

interface Question {
  id: string;
  questionKey: string;
  options: { label: string; value: Priority }[];
  priorityKey: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'location',
    questionKey: 'howClose',
    priorityKey: 'location_priority',
    options: [
      { label: 'sameQuartier', value: 'high' },
      { label: 'sameCity', value: 'medium' },
      { label: 'anywhere', value: 'low' },
    ],
  },
  {
    id: 'price',
    questionKey: 'howImportantBudget',
    priorityKey: 'price_priority',
    options: [
      { label: 'veryImportant', value: 'high' },
      { label: 'somewhatImportant', value: 'medium' },
      { label: 'flexible', value: 'low' },
    ],
  },
  {
    id: 'rating',
    questionKey: 'howImportantRating',
    priorityKey: 'rating_priority',
    options: [
      { label: 'veryImportant', value: 'high' },
      { label: 'somewhatImportant', value: 'medium' },
      { label: 'notMuch', value: 'low' },
    ],
  },
  {
    id: 'availability',
    questionKey: 'whenDoYouNeed',
    priorityKey: 'availability_priority',
    options: [
      { label: 'rightNow', value: 'high' },
      { label: 'thisWeek', value: 'medium' },
      { label: 'anytime', value: 'low' },
    ],
  },
  {
    id: 'experience',
    questionKey: 'preferExperienced',
    priorityKey: 'experience_priority',
    options: [
      { label: 'veryExperienced', value: 'high' },
      { label: 'someExperience', value: 'medium' },
      { label: 'anyone', value: 'low' },
    ],
  },
];

export default function PrioritiesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Priority>>({});

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);

  const handleContinue = () => {
    if (!allAnswered) return;
    sessionStorage.setItem('onboarding_priorities', JSON.stringify(answers));
    router.push('/profile-setup');
  };

  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 py-10">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn('h-1 flex-1 rounded-full', step <= 3 ? 'bg-blue-800' : 'bg-slate-200')}
          />
        ))}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('whatMattersMost')}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t('helpsShowBestMatches')}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-800 mb-3">
              {idx + 1}. {t(q.questionKey)}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium border transition-all',
                    answers[q.id] === opt.value
                      ? 'bg-blue-800 border-blue-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-200'
                  )}
                >
                  {t(opt.label)}
                </button>
              ))}
            </div>
          </div>
        ))}

        {!allAnswered && (
          <p className="text-xs text-slate-400 text-center">{t('pleaseAnswerAll')}</p>
        )}
      </div>

      <Button
        fullWidth
        size="lg"
        disabled={!allAnswered}
        onClick={handleContinue}
        className="mt-6"
      >
        {t('continue')}
      </Button>
    </div>
  );
}
