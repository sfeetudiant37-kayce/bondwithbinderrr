'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  border?: boolean;
}

export function Card({ padding = 'md', shadow = true, border = true, className, children, ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl',
        paddings[padding],
        shadow && 'shadow-sm',
        border && 'border border-slate-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
