// src/contexts/LanguageContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '../lib/translations';

type LangPref = 'it' | 'en' | 'auto';

interface LanguageContextValue {
  lang: Language;          // resolved: 'it' | 'en'
  langPref: LangPref;      // stored: 'it' | 'en' | 'auto'
  setLangPref: (l: LangPref) => void;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectSystem(): Language {
  const code = (navigator.language || 'it').split('-')[0].toLowerCase();
  return code === 'en' ? 'en' : 'it';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [langPref, setLangPrefState] = useState<LangPref>(() => {
    const s = localStorage.getItem('app_language');
    return (s === 'it' || s === 'en' || s === 'auto') ? s : 'auto';
  });

  const lang: Language = langPref === 'auto' ? detectSystem() : langPref;

  useEffect(() => {
    localStorage.setItem('app_language', langPref);
    document.documentElement.setAttribute('lang', lang);
  }, [langPref, lang]);

  const setLangPref = (l: LangPref) => {
    setLangPrefState(l);
  };

  const t = (key: TranslationKey, replacements?: Record<string, string>): string => {
    const dict = translations[lang] as Record<string, string>;
    let str = dict[key] ?? (translations['it'] as Record<string, string>)[key] ?? key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, langPref, setLangPref, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
