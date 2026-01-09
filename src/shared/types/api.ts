// API Response Types

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

export interface PortfolioBalance {
  total_assets: number;
  stock_value: number;
  cash: number;
  total_profit_loss: number;
  total_return_percent: number;
  positions: Position[];
  currency: string;
}

export interface PortfolioSummary {
  total_assets: number;
  total_profit_loss: number;
  total_return_percent: number;
  positions_count: number;
  cash: number;
  stock_value: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  weight: number;
  count: number;
}

export interface ReturnAnalysis {
  daily_return: number;
  total_return: number;
  total_profit_loss: number;
  best_performer: {
    ticker: string;
    name: string;
    return: number;
    profit_loss: number;
  };
  worst_performer: {
    ticker: string;
    name: string;
    return: number;
    profit_loss: number;
  };
}

export interface HistoryData {
  date: string;
  value: number;
  invested: number;
}

export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  timestamp: string;
  source: string;
}

export interface RiskMetrics {
  volatility: number;
  beta: number;
  sharpe_ratio: number;
  max_drawdown: number;
}

export interface ChartData {
  date: string;
  portfolio: number;
  benchmark: number;
}

export interface AnalysisData {
  metrics: RiskMetrics;
  chart_data: ChartData[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Stock Types
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

export interface StockNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
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

// Glossary Types
export interface GlossaryTerm {
  id: string;
  term_ko: string;
  term_en: string;
  definition: string;
  example?: string;
  category: string;
  difficulty_level: string;
  view_count: number;
  is_ai_generated: boolean;
}

export interface GlossaryTermsParams {
  category?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// User Types
export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
}
