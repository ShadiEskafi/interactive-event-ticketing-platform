import { useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageContext } from './languageContextInstance';
import { getTranslation } from '../i18n';

export const LANGUAGE_STORAGE_KEY = 'ticketcraft_lang';

function getInitialLanguage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'en';
  }
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'ar' || stored === 'en' ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children, initialLanguage }) {
  const [language, setLanguageState] = useState(() => {
    if (initialLanguage === 'ar' || initialLanguage === 'en') {
      return initialLanguage;
    }
    return getInitialLanguage();
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = language === 'ar';

  // Synchronize document attributes and localStorage
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        // Storage quota fallback
      }
    }
  }, [language, dir]);

  const setLanguage = useCallback((newLang) => {
    if (newLang === 'ar' || newLang === 'en') {
      setLanguageState(newLang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const t = useCallback(
    (key, fallback) => {
      return getTranslation(language, key, fallback);
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      dir,
      isRtl,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, dir, isRtl, setLanguage, toggleLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}
