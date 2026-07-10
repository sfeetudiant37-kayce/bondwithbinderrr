'use client';

import { useEffect, useState } from 'react';
import { X, Share2, Download } from 'lucide-react';
import { isIOS, isStandalone } from '@/lib/utils/deviceDetection';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function PWAInstallPrompt() {
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // iOS detection
    if (isIOS() && !isStandalone()) {
      const dismissed = localStorage.getItem('binder-ios-banner-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowIOSBanner(true), 3000);
      }
    }

    // Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void });
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const dismissIOS = () => {
    setShowIOSBanner(false);
    localStorage.setItem('binder-ios-banner-dismissed', '1');
  };

  if (showIOSBanner) {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-50 px-4 md:bottom-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 max-w-sm mx-auto">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="font-semibold text-slate-900 text-sm">{t('installBinder')}</span>
            </div>
            <button onClick={dismissIOS} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <Share2 size={12} className="flex-shrink-0 text-blue-600" />
            {t('installApp')}
          </p>
        </div>
      </div>
    );
  }

  if (showInstallBtn) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          <Download size={16} />
          {t('installBinder')}
        </button>
      </div>
    );
  }

  return null;
}
