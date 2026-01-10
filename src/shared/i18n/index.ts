export { default as i18n } from './config';
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  LOCALE_MAP,
  type SupportedLanguage,
} from './config';
export { useLanguage } from './hooks/useLanguage';
export { I18nProvider } from './providers/I18nProvider';
export { LANGUAGE_OPTIONS, type LanguageOption } from './types';
