/**
 * Analysis Hooks
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { analysisApi } from '../api/analysisApi';
import type { AnalysisData } from '@shared/types';
import { STALE_TIME, CACHE_TIME } from '@shared/api';

export const usePortfolioAnalysis = (
  options?: Omit<UseQueryOptions<AnalysisData>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['analysis', 'portfolio'],
    queryFn: analysisApi.getPortfolioAnalysis,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    ...options
  });
};
