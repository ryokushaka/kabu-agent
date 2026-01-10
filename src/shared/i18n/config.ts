import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const SUPPORTED_LANGUAGES = ['ko', 'ja', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ko';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ko: '한국어',
  ja: '日本語',
  en: 'English',
};

export const LOCALE_MAP: Record<SupportedLanguage, string> = {
  ko: 'ko-KR',
  ja: 'ja-JP',
  en: 'en-US',
};

// Import translation files directly for bundling
import commonKo from '../../../public/locales/ko/common.json';
import authKo from '../../../public/locales/ko/auth.json';
import landingKo from '../../../public/locales/ko/landing.json';
import glossaryKo from '../../../public/locales/ko/glossary.json';
import settingsKo from '../../../public/locales/ko/settings.json';
import nisaKo from '../../../public/locales/ko/nisa.json';

import commonJa from '../../../public/locales/ja/common.json';
import authJa from '../../../public/locales/ja/auth.json';
import landingJa from '../../../public/locales/ja/landing.json';
import glossaryJa from '../../../public/locales/ja/glossary.json';
import settingsJa from '../../../public/locales/ja/settings.json';
import nisaJa from '../../../public/locales/ja/nisa.json';

import commonEn from '../../../public/locales/en/common.json';
import authEn from '../../../public/locales/en/auth.json';
import landingEn from '../../../public/locales/en/landing.json';
import glossaryEn from '../../../public/locales/en/glossary.json';
import settingsEn from '../../../public/locales/en/settings.json';
import nisaEn from '../../../public/locales/en/nisa.json';

const resources = {
  ko: {
    common: commonKo,
    auth: authKo,
    landing: landingKo,
    glossary: glossaryKo,
    settings: settingsKo,
    nisa: nisaKo,
  },
  ja: {
    common: commonJa,
    auth: authJa,
    landing: landingJa,
    glossary: glossaryJa,
    settings: settingsJa,
    nisa: nisaJa,
  },
  en: {
    common: commonEn,
    auth: authEn,
    landing: landingEn,
    glossary: glossaryEn,
    settings: settingsEn,
    nisa: nisaEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: ['common', 'auth', 'landing', 'glossary', 'settings', 'nisa'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
