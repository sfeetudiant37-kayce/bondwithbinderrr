'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { getInitials, AVATAR_COLORS } from '@/lib/utils/formatters';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ name, color = 'blue', size = 'md', className, ...props }: AvatarProps) {
  const colorConfig = AVATAR_COLORS[color] || AVATAR_COLORS.blue;

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        colorConfig.bg,
        colorConfig.text,
        sizes[size],
        className
      )}
      {...props}
    >
      {getInitials(name || '?')}
    </div>
  );
}
