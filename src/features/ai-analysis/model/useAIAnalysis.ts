/**
 * AI Analysis Hooks
 */
import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import { aiApi, AIAnalysisResponse } from '../api/aiApi';
import type { AINewsResponse } from '@entities/news';
import { STALE_TIME, CACHE_TIME } from '@shared/api';

export const useAIAnalysis = (
  options?: Omit<UseQueryOptions<AIAnalysisResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['ai', 'analysis'],
    queryFn: aiApi.getAnalysis,
    staleTime: STALE_TIME * 2, // AI analysis can be cached longer
    gcTime: CACHE_TIME * 2,
    retry: 2,
    ...options
  });
};

export const useAINews = (
  query: string = '미국 주식 시장',
  options?: Omit<UseQueryOptions<AINewsResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['ai', 'news', query],
    queryFn: () => aiApi.getNews(query),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
    ...options
  });
};

export const useAIAnalysisMutation = () => {
  return useMutation({
    mutationFn: aiApi.getAnalysis,
  });
};
