'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingStars({ value, onChange, readonly = false, size = 'md' }: RatingStarsProps) {
  const sizes = { sm: 14, md: 18, lg: 24 };
  const starSize = sizes[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-transform',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          <Star
            size={starSize}
            className={cn(
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}
