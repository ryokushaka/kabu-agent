import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import type { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, LOCALE_MAP } from '../config';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = (i18n.language?.split('-')[0] ||
    'ko') as SupportedLanguage;

  const changeLanguage = useCallback(
    async (lng: SupportedLanguage) => {
      await i18n.changeLanguage(lng);
      localStorage.setItem('language', lng);
      document.documentElement.lang = lng;
    },
    [i18n]
  );

  const isJapanese = currentLanguage === 'ja';

  const getLocale = useCallback(() => {
    return LOCALE_MAP[currentLanguage] || LOCALE_MAP.ko;
  }, [currentLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageLabels: LANGUAGE_LABELS,
    isJapanese,
    getLocale,
  };
};
