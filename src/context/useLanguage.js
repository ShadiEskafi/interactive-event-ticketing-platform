import { useContext } from 'react';
import { LanguageContext } from './languageContextInstance';
import { getTranslation } from '../i18n';

/**
 * Hook to consume LanguageContext.
 * Returns graceful fallback if invoked outside of LanguageProvider for test resilience.
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      dir: 'ltr',
      isRtl: false,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key, fallback) => getTranslation('en', key, fallback),
    };
  }
  return context;
}
