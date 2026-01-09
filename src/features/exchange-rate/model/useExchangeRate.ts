/**
 * Exchange Rate Hooks
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { exchangeApi } from '../api/exchangeApi';
import type { ExchangeRate } from '@shared/types';
import { STALE_TIME, CACHE_TIME } from '@shared/api';

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

  const rate = error ? 1400 : (data?.rate || 1400);

  return {
    rate,
    isLoading,
    error
  };
};
