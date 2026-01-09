/**
 * Portfolio API endpoints
 */
import { apiClient } from '@shared/api';
import type {
  PortfolioBalance,
  PortfolioSummary,
  SectorAllocation,
  ReturnAnalysis,
  HistoryData,
} from '@shared/types';

export const portfolioApi = {
  getBalance: () =>
    apiClient.get<PortfolioBalance>('/api/portfolio/balance'),

  getSummary: () =>
    apiClient.get<PortfolioSummary>('/api/portfolio/summary'),

  getHistory: (days: number = 30) =>
    apiClient.get<HistoryData[]>(`/api/portfolio/history?days=${days}`),

  getSectorAnalysis: () =>
    apiClient.get<{ sectors: SectorAllocation[] }>('/api/analysis/sector'),

  getReturnsAnalysis: () =>
    apiClient.get<ReturnAnalysis>('/api/analysis/returns'),
};
