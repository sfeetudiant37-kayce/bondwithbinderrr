'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  height?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'blue',
  height = 'sm',
  showLabel = false,
  className,
  ...props
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    blue: 'bg-blue-800',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const heights = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
  };

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className={cn('w-full rounded-full bg-slate-100 overflow-hidden', heights[height])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 mt-1 block text-right">{Math.round(percent)}%</span>
      )}
    </div>
  );
}
