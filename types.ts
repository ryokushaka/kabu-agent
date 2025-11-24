export interface StockPosition {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number; // USD
  currentPrice: number; // USD
  currency: 'USD';
  sector: string;
}

export interface PortfolioSummary {
  totalAssetUsd: number;
  totalAssetKrw: number;
  totalInvestedUsd: number;
  dailyProfitLoss: number;
  dailyProfitLossPercent: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  cashBalanceUsd: number;
}

export interface SectorData {
  name: string;
  value: number; // Percentage or Amount
  color: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  apiKeySet: boolean;
}

export interface HistoryData {
  date: string;
  value: number;
  invested: number;
  [key: string]: any;
}