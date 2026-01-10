/**
 * Formatting utilities for currency, percentages, dates, and numbers
 * Locale-aware using i18n configuration
 */
import { i18n, LOCALE_MAP, type SupportedLanguage } from '@shared/i18n';

/**
 * Get the current locale string based on i18n language
 */
const getLocale = (): string => {
  const lang = (i18n.language?.split('-')[0] || 'ko') as SupportedLanguage;
  return LOCALE_MAP[lang] || LOCALE_MAP.ko;
};

/**
 * Format currency with locale awareness
 * @param value - The numeric value to format
 * @param currency - Currency code (USD, KRW, JPY)
 */
export const formatCurrency = (
  value: number,
  currency: 'USD' | 'KRW' | 'JPY' = 'USD'
): string => {
  const locale = getLocale();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(value);
};

/**
 * Format percentage with optional sign
 * @param value - The percentage value
 * @param decimals - Number of decimal places
 */
export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

/**
 * Format number with locale awareness
 * @param value - The numeric value
 * @param decimals - Number of decimal places
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  const locale = getLocale();
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format date with locale awareness (short format)
 * @param date - Date string or Date object
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocale();
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

/**
 * Format date and time with locale awareness
 * @param date - Date string or Date object
 */
export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocale();
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

/**
 * Format relative time (e.g., "3 hours ago")
 * @param date - Date string or Date object
 */
export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffInSeconds = (d.getTime() - Date.now()) / 1000;

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(Math.round(diffInSeconds), 'second');
  }
  if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(Math.round(diffInSeconds / 60), 'minute');
  }
  if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
  }
  return rtf.format(Math.round(diffInSeconds / 86400), 'day');
};

/**
 * Format date for display (long format)
 * @param date - Date string or Date object
 */
export const formatDateLong = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocale();
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

/**
 * Format compact number (e.g., 1.2K, 3.4M)
 * @param value - The numeric value
 */
export const formatCompactNumber = (value: number): string => {
  const locale = getLocale();
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};
