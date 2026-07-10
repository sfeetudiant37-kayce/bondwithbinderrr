'use client';

import { cn } from '@/lib/utils/cn';
import { getFitScoreColor } from '@/lib/utils/formatters';

interface FitScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function FitScoreBadge({ score, size = 'sm' }: FitScoreBadgeProps) {
  const colorClass = getFitScoreColor(score);

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full border',
        colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {score}%
    </span>
  );
}
