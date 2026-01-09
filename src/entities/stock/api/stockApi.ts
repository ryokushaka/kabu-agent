import { apiClient } from '@shared/api';
import type { StockInfo, ChartDataPoint, StockAnalysis, UserPosition } from '../model/types';
import type { StockNews } from '@entities/news';

export const stockApi = {
  getInfo: async (ticker: string): Promise<StockInfo> => {
    return apiClient.get<StockInfo>(`/api/stock/${ticker}`);
  },

  getChart: async (ticker: string, period: string = '1M'): Promise<ChartDataPoint[]> => {
    return apiClient.get<ChartDataPoint[]>(`/api/stock/${ticker}/chart?period=${period}`);
  },

  getNews: async (ticker: string, limit: number = 10): Promise<StockNews[]> => {
    return apiClient.get<StockNews[]>(`/api/stock/${ticker}/news?limit=${limit}`);
  },

  getAnalysis: async (ticker: string): Promise<StockAnalysis> => {
    return apiClient.get<StockAnalysis>(`/api/stock/${ticker}/analysis`);
  },

  getUserPosition: async (ticker: string): Promise<UserPosition | null> => {
    try {
      return await apiClient.get<UserPosition>(`/api/stock/${ticker}/position`);
    } catch {
      return null;
    }
  },
};
