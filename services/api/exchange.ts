/**
 * Exchange Rate API endpoints
 */
import { apiClient } from './client';
import type { ExchangeRate } from '../../types';

export const exchangeApi = {
  getRate: (
    baseCurrency: string = 'USD',
    targetCurrency: string = 'KRW'
  ) =>
    apiClient.get<ExchangeRate>(
      `/api/exchange/rate/${baseCurrency}/${targetCurrency}`
    ),

  getMajorRates: () =>
    apiClient.get<Record<string, number>>('/api/exchange/rates')
};
