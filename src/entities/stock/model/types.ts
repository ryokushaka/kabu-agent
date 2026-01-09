export interface StockInfo {
  ticker: string;
  name: string;
  exchange: string;
  current_price: number;
  change: number;
  change_percent: number;
  high_52w?: number;
  low_52w?: number;
  market_cap?: number;
  pe_ratio?: number;
  eps?: number;
  dividend_yield?: number;
  volume?: number;
  avg_volume?: number;
  sector?: string;
  industry?: string;
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockAnalysis {
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  target_price?: number;
  confidence: number;
  analysis_summary: string;
  key_factors: string[];
  risks: string[];
  updated_at: string;
}

export interface UserPosition {
  quantity: number;
  avg_price: number;
  market_value: number;
  profit_loss: number;
  profit_loss_percent: number;
  weight: number;
}

export interface Position {
  ticker: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  profit_loss: number;
  profit_loss_percent: number;
  weight: number;
  sector?: string;
}
