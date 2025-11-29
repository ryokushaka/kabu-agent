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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
  status?: number;
}
