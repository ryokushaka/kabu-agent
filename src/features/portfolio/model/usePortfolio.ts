/**
 * Portfolio Data Hooks
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { portfolioApi } from '../api/portfolioApi';
import type {
  PortfolioBalance,
  PortfolioSummary,
  HistoryData,
  SectorAllocation,
  ReturnAnalysis
} from '@shared/types';
import { STALE_TIME, CACHE_TIME } from '@shared/api';

export const usePortfolioSummary = (
  options?: Omit<UseQueryOptions<PortfolioSummary>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: portfolioApi.getSummary,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};

export const usePortfolioBalance = (
  options?: Omit<UseQueryOptions<PortfolioBalance>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['portfolio', 'balance'],
    queryFn: portfolioApi.getBalance,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};

export const usePortfolioHistory = (
  days: number = 30,
  options?: Omit<UseQueryOptions<HistoryData[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['portfolio', 'history', days],
    queryFn: () => portfolioApi.getHistory(days),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};

export const useSectorAnalysis = (
  options?: Omit<UseQueryOptions<{ sectors: SectorAllocation[] }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['portfolio', 'sector-analysis'],
    queryFn: portfolioApi.getSectorAnalysis,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};

export const useReturnsAnalysis = (
  options?: Omit<UseQueryOptions<ReturnAnalysis>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['portfolio', 'returns-analysis'],
    queryFn: portfolioApi.getReturnsAnalysis,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};
