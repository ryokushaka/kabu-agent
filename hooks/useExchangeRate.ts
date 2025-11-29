/**
 * Exchange Rate Hook
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { exchangeApi } from '../services/api';
import type { ExchangeRate } from '../types';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

export const useExchangeRate = (
  baseCurrency: string = 'USD',
  targetCurrency: string = 'KRW',
  options?: Omit<UseQueryOptions<ExchangeRate>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['exchange', 'rate', baseCurrency, targetCurrency],
    queryFn: () => exchangeApi.getRate(baseCurrency, targetCurrency),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};

export const useMajorExchangeRates = (
  options?: Omit<UseQueryOptions<Record<string, number>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['exchange', 'major-rates'],
    queryFn: exchangeApi.getMajorRates,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};

/**
 * Utility hook to get USD to KRW rate with fallback
 */
export const useUSDToKRW = () => {
  const { data, isLoading, error } = useExchangeRate('USD', 'KRW');

  // Return rate with fallback to 1400 if error
  const rate = error ? 1400 : (data?.rate || 1400);

  return {
    rate,
    isLoading,
    error
  };
};
