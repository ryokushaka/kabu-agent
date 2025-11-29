import { SECTOR_COLORS } from '../constants';
import { PortfolioSummary, SectorData, StockPosition } from '../types';

export const calculatePortfolioSummary = (positions: StockPosition[], exchangeRate?: number): PortfolioSummary => {
  let totalAssetUsd = 0;
  let totalInvestedUsd = 0;
  let dailyProfitLoss = 0; // Simulated for demo

  positions.forEach(pos => {
    const assetValue = pos.quantity * pos.currentPrice;
    const investedValue = pos.quantity * pos.averagePrice;
    
    totalAssetUsd += assetValue;
    totalInvestedUsd += investedValue;
    
    // Simulating a daily change of roughly 0.5% - 2% variance per stock for the demo
    const simulatedDailyChange = (pos.currentPrice * 0.015 * (Math.random() > 0.5 ? 1 : -1)); 
    dailyProfitLoss += simulatedDailyChange * pos.quantity;
  });

  const cashBalanceUsd = 2540.50; // Mock cash
  totalAssetUsd += cashBalanceUsd;

  const totalProfitLoss = totalAssetUsd - cashBalanceUsd - totalInvestedUsd;
  const totalProfitLossPercent = totalInvestedUsd > 0 ? (totalProfitLoss / totalInvestedUsd) * 100 : 0;
  const dailyProfitLossPercent = (dailyProfitLoss / (totalAssetUsd - dailyProfitLoss)) * 100;

  return {
    totalAssetUsd,
    totalAssetKrw: exchangeRate ? totalAssetUsd * exchangeRate : undefined,
    totalInvestedUsd,
    dailyProfitLoss,
    dailyProfitLossPercent,
    totalProfitLoss,
    totalProfitLossPercent,
    cashBalanceUsd
  };
};

export const getSectorData = (positions: StockPosition[]): SectorData[] => {
  const sectorMap = new Map<string, number>();
  let totalValue = 0;

  positions.forEach(pos => {
    const val = pos.quantity * pos.currentPrice;
    const sector = pos.sector || 'Other';
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + val);
    totalValue += val;
  });

  return Array.from(sectorMap.entries()).map(([name, value]) => ({
    name,
    value: Number(((value / totalValue) * 100).toFixed(1)),
    color: SECTOR_COLORS[name as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Other
  })).sort((a, b) => b.value - a.value);
};

export const formatCurrency = (value: number, currency: 'USD' | 'KRW' = 'USD') => {
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export const formatPercent = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};