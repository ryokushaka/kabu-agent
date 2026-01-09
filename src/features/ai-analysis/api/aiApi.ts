/**
 * AI Analysis API endpoints
 */
import { apiClient } from '@shared/api';
import type { AINewsResponse } from '@entities/news';

export interface AIAnalysisResponse {
  analysis: string;
}

export const aiApi = {
  getAnalysis: () =>
    apiClient.post<AIAnalysisResponse>('/api/ai/analyze'),

  getNews: (query: string = '미국 주식 시장') =>
    apiClient.post<AINewsResponse>('/api/ai/news', { query }),
};
