/**
 * Application Constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PORTFOLIO: '/portfolio',
  ANALYSIS: '/analysis',
  NEWS: '/news',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  STOCK_DETAIL: '/stock/:ticker',
  CONTACT: '/contact',
} as const;

export const QUERY_KEYS = {
  PORTFOLIO: {
    BALANCE: ['portfolio', 'balance'],
    SUMMARY: ['portfolio', 'summary'],
    HISTORY: (days: number) => ['portfolio', 'history', days],
  },
  ANALYSIS: {
    SECTOR: ['analysis', 'sector'],
    RETURNS: ['analysis', 'returns'],
    PORTFOLIO: ['analysis', 'portfolio'],
  },
  EXCHANGE: {
    RATE: (base: string, target: string) => ['exchange', 'rate', base, target],
    MAJOR_RATES: ['exchange', 'rates'],
  },
  GLOSSARY: {
    TERMS: (params?: Record<string, unknown>) => ['glossary', 'terms', params],
    TERM_DETAIL: (id: string) => ['glossary', 'term', id],
    POPULAR: ['glossary', 'popular'],
  },
  STOCK: {
    INFO: (ticker: string) => ['stock', ticker, 'info'],
    CHART: (ticker: string, period: string) => ['stock', ticker, 'chart', period],
    NEWS: (ticker: string) => ['stock', ticker, 'news'],
    ANALYSIS: (ticker: string) => ['stock', ticker, 'analysis'],
    POSITION: (ticker: string) => ['stock', ticker, 'position'],
  },
  AI: {
    ANALYSIS: ['ai', 'analysis'],
    NEWS: (query: string) => ['ai', 'news', query],
  },
} as const;

export const CHART_PERIODS = [
  { value: '1W', label: '1주' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '6M', label: '6개월' },
  { value: '1Y', label: '1년' },
  { value: 'ALL', label: '전체' },
] as const;
