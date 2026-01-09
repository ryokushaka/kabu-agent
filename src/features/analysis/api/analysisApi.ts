/**
 * Analysis API endpoints
 */
import { apiClient } from '@shared/api';
import type { AnalysisData, RiskMetrics } from '@shared/types';

export const analysisApi = {
  getPortfolioAnalysis: () =>
    apiClient.get<AnalysisData>('/api/analysis/portfolio'),
};
