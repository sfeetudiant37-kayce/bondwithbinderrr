'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/types';
import en from './en.json';
import fr from './fr.json';

const translations: Record<Language, Record<string, string>> = { en, fr };

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: string) => {
        const { language } = get();
        return translations[language][key] || translations['en'][key] || key;
      },
    }),
    { name: 'binder-language' }
  )
);

export function useTranslation() {
  const { t, language, setLanguage } = useLanguageStore();
  return { t, language, setLanguage };
}
