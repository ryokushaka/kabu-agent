import type { SUPPORTED_LANGUAGES } from './config';

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ko', label: 'Korean', nativeName: '한국어' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語' },
  { code: 'en', label: 'English', nativeName: 'English' },
];
