'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Language } from '@/types';

export default function LandingPage() {
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Language Toggle */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleLanguage}
          className="text-sm font-medium text-slate-500 hover:text-blue-800 transition-colors border border-slate-200 rounded-lg px-3 py-1.5"
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <div className="mb-2">
            <div className="w-16 h-16 rounded-2xl bg-blue-800 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-black text-white">B</span>
            </div>
            <h1 className="text-5xl md:text-5xl font-black text-blue-800 tracking-tight">
              {t('binder')}
            </h1>
          </div>

          {/* Slogan */}
          <p className="text-lg text-slate-500 mt-3 mb-10 leading-relaxed">
            {t('slogan')}
          </p>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              href="/signup"
              className="block w-full h-14 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-base rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]"
            >
              {t('getStarted')}
            </Link>

            <Link
              href="/login"
              className="block text-sm text-slate-500 hover:text-blue-800 transition-colors"
            >
              {t('alreadyHaveAccount')} <span className="font-semibold text-blue-800">{t('signIn')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-slate-400">{t('allRightsReserved')}</p>
      </div>
    </div>
  );
}
