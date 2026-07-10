'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-slate-100 rounded-lg', className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1.5" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
