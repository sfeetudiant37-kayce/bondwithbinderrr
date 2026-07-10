'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary: 'bg-blue-800 hover:bg-blue-900 text-white focus:ring-blue-700 active:scale-[0.98]',
      secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-800 focus:ring-blue-300',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus:ring-slate-300',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-200',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 active:scale-[0.98]',
      'danger-outline': 'border border-red-300 text-red-600 hover:bg-red-50 focus:ring-red-300',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
