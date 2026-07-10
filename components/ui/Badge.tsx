'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'default', size = 'sm', className, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    outline: 'border border-slate-200 text-slate-600',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
