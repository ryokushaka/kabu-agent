import { StockPosition, HistoryData, SectorData } from './types';

// Exchange rate is now dynamic - use exchangeRateService.getUSDToKRW() 
// export const EXCHANGE_RATE = 1350; // Removed hardcoded rate

export const MOCK_POSITIONS: StockPosition[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    quantity: 50,
    averagePrice: 150.00,
    currentPrice: 175.50,
    currency: 'USD',
    sector: 'Technology'
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    quantity: 30,
    averagePrice: 280.00,
    currentPrice: 320.10,
    currency: 'USD',
    sector: 'Technology'
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    quantity: 20,
    averagePrice: 210.00,
    currentPrice: 195.50,
    currency: 'USD',
    sector: 'Consumer Cyclical'
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    quantity: 15,
    averagePrice: 450.00,
    currentPrice: 485.20,
    currency: 'USD',
    sector: 'Technology'
  },
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    quantity: 40,
    averagePrice: 160.00,
    currentPrice: 155.80,
    currency: 'USD',
    sector: 'Healthcare'
  },
  {
    ticker: 'KO',
    name: 'Coca-Cola Co.',
    quantity: 100,
    averagePrice: 55.00,
    currentPrice: 58.90,
    currency: 'USD',
    sector: 'Consumer Defensive'
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    quantity: 25,
    averagePrice: 120.00,
    currentPrice: 138.40,
    currency: 'USD',
    sector: 'Communication'
  }
];

export const MOCK_HISTORY: HistoryData[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const baseValue = 50000;
  const randomFluctuation = (Math.random() - 0.4) * 1000;
  const trend = i * 150;
  return {
    date: `2024-04-${day.toString().padStart(2, '0')}`,
    value: baseValue + trend + randomFluctuation,
    invested: 48000 + (i * 50)
  };
});

export const SECTOR_COLORS = {
  Technology: '#3b82f6', // Blue 500
  Healthcare: '#10b981', // Emerald 500
  'Consumer Cyclical': '#f59e0b', // Amber 500
  'Consumer Defensive': '#8b5cf6', // Violet 500
  Communication: '#ec4899', // Pink 500
  Other: '#64748b' // Slate 500
};