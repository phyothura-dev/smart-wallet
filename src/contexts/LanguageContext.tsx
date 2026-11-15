import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type Language, type Translations } from '../i18n/translations';

const LANG_STORAGE_KEY = 'smartwallet-lang';

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'mm' || stored === 'en') return stored;
  } catch {
    // ignore storage errors
  }
  return 'mm';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language === 'mm' ? 'my' : 'en';
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'mm' ? 'en' : 'mm'));
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
