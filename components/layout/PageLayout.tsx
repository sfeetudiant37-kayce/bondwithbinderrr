'use client';

import { ReactNode } from 'react';
import { OfflineBar } from './OfflineBar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface PageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
}

export function PageLayout({ children, showHeader = true, showNav = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <OfflineBar />
      {showHeader && <Header />}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20 md:pb-6">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
