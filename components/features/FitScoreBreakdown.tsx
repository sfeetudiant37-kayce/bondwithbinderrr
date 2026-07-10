'use client';

import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FitScoreBadge } from './FitScoreBadge';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { FitScoreBreakdown, Weights } from '@/types';

interface FitScoreBreakdownProps {
  open: boolean;
  onClose: () => void;
  targetName: string;
  score: number;
  breakdown: FitScoreBreakdown;
  weights: Weights;
}

const FACTORS: { key: keyof FitScoreBreakdown; labelKey: string; weightKey: keyof Weights }[] = [
  { key: 'preferences', labelKey: 'preferences', weightKey: 'preferences' },
  { key: 'location', labelKey: 'locationFactor', weightKey: 'location' },
  { key: 'price', labelKey: 'priceFactor', weightKey: 'price' },
  { key: 'rating', labelKey: 'ratingFactor', weightKey: 'rating' },
  { key: 'availability', labelKey: 'availabilityFactor', weightKey: 'availability' },
  { key: 'profileCompleteness', labelKey: 'profileCompleteness', weightKey: 'profile_completeness' },
  { key: 'experience', labelKey: 'experienceFactor', weightKey: 'experience' },
];

export function FitScoreBreakdownModal({
  open,
  onClose,
  targetName,
  score,
  breakdown,
  weights,
}: FitScoreBreakdownProps) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={t('fitScoreAnalysis')}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">{targetName}</p>
          </div>
          <FitScoreBadge score={score} size="md" />
        </div>

        <div className="space-y-3 mb-4">
          {FACTORS.map(({ key, labelKey, weightKey }) => {
            const factorScore = breakdown[key];
            const weight = weights[weightKey] as number;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">{t(labelKey)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {t('weight')}: {Math.round(weight * 100)}%
                    </span>
                    <span className="text-xs font-bold text-slate-700 w-8 text-right">
                      {factorScore}
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={factorScore}
                  max={100}
                  height="xs"
                  color={factorScore >= 70 ? 'green' : factorScore >= 45 ? 'yellow' : 'red'}
                />
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 text-center font-mono">{t('fitScoreFormula')}</p>
        </div>
      </div>
    </Modal>
  );
}
