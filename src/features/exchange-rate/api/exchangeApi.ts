/**
 * Exchange Rate API endpoints
 */
import { apiClient } from '@shared/api';
import type { ExchangeRate } from '@shared/types';

export const exchangeApi = {
  getRate: (baseCurrency: string = 'USD', targetCurrency: string = 'KRW') =>
    apiClient.get<ExchangeRate>(
      `/api/exchange/rate/${baseCurrency}/${targetCurrency}`
    ),

  getMajorRates: () =>
    apiClient.get<Record<string, number>>('/api/exchange/rates'),
};
