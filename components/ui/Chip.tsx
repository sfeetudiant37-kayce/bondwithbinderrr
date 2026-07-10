'use client';

import { cn } from '@/lib/utils/cn';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({ label, selected, onClick, disabled, className }: ChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none',
        selected
          ? 'bg-blue-800 border-blue-800 text-white'
          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {label}
    </button>
  );
}
