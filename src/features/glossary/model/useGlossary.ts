/**
 * Glossary Hooks
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { glossaryApi } from '../api/glossaryApi';
import type { GlossaryTerm, GlossaryTermsParams } from '@shared/types';
import { STALE_TIME, CACHE_TIME } from '@shared/api';

export const useGlossaryTerms = (
  params?: GlossaryTermsParams,
  options?: Omit<UseQueryOptions<GlossaryTerm[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['glossary', 'terms', params],
    queryFn: () => glossaryApi.getTerms(params),
    staleTime: STALE_TIME * 2,
    gcTime: CACHE_TIME * 2,
    ...options
  });
};

export const useGlossaryTermDetail = (
  termId: string,
  options?: Omit<UseQueryOptions<GlossaryTerm>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['glossary', 'term', termId],
    queryFn: () => glossaryApi.getTermDetail(termId),
    staleTime: STALE_TIME * 2,
    gcTime: CACHE_TIME * 2,
    enabled: !!termId,
    ...options
  });
};

export const usePopularGlossaryTerms = (
  limit: number = 10,
  options?: Omit<UseQueryOptions<GlossaryTerm[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['glossary', 'popular', limit],
    queryFn: () => glossaryApi.getPopularTerms(limit),
    staleTime: STALE_TIME * 2,
    gcTime: CACHE_TIME * 2,
    ...options
  });
};
