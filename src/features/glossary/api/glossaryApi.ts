/**
 * Glossary API endpoints
 */
import { apiClient } from '@shared/api';
import type { GlossaryTerm, GlossaryTermsParams } from '@shared/types';

export const glossaryApi = {
  getTerms: (params?: GlossaryTermsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/glossary/terms?${queryString}` : '/api/glossary/terms';

    return apiClient.get<GlossaryTerm[]>(endpoint, { requiresAuth: false });
  },

  getTermDetail: (termId: string) =>
    apiClient.get<GlossaryTerm>(`/api/glossary/terms/${termId}`, { requiresAuth: false }),

  searchTerms: (keyword: string, limit: number = 20) => {
    const queryParams = new URLSearchParams();
    queryParams.append('keyword', keyword);
    queryParams.append('limit', limit.toString());

    return apiClient.get<GlossaryTerm[]>(`/api/glossary/search?${queryParams}`, { requiresAuth: false });
  },

  getPopularTerms: (limit: number = 10) =>
    apiClient.get<GlossaryTerm[]>(`/api/glossary/terms/popular?limit=${limit}`, { requiresAuth: false }),

  getTermsByCategory: (category: string, limit: number = 20) =>
    apiClient.get<GlossaryTerm[]>(`/api/glossary/terms/category/${category}?limit=${limit}`, { requiresAuth: false }),
};
