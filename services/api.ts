/**
 * API Client for backend communication
 * @deprecated Use @shared/api and @features/* instead
 */

// Re-export auth API for backward compatibility
export { authApi } from '@features/auth';

const API_BASE_URL = 'http://localhost:8000';

// Types
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

// API Client Class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  // Portfolio APIs
  async getPortfolioBalance(): Promise<PortfolioBalance> {
    return this.request<PortfolioBalance>('/api/portfolio/balance');
  }

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    return this.request<PortfolioSummary>('/api/portfolio/summary');
  }

  // Analysis APIs
  async getSectorAnalysis(): Promise<{ sectors: SectorAllocation[] }> {
    return this.request<{ sectors: SectorAllocation[] }>('/api/analysis/sector');
  }

  async getReturnsAnalysis(): Promise<ReturnAnalysis> {
    return this.request<ReturnAnalysis>('/api/analysis/returns');
  }

  async getPortfolioAnalysis(): Promise<AnalysisData> {
    return this.request<AnalysisData>('/api/analysis/portfolio');
  }

  async getPortfolioHistory(days: number = 30): Promise<HistoryData[]> {
    return this.request<HistoryData[]>(`/api/portfolio/history?days=${days}`);
  }

  async getAIAnalysis(): Promise<{ analysis: string }> {
    return this.request<{ analysis: string }>('/api/ai/analyze', {
      method: 'POST',
    });
  }

  async getAINews(query: string = "미국 주식 시장"): Promise<{ summary: string; sources: { title: string; link: string; source: string }[] }> {
    return this.request<{ summary: string; sources: { title: string; link: string; source: string }[] }>('/api/ai/news', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // Exchange Rate APIs
  async getExchangeRate(baseCurrency: string = 'USD', targetCurrency: string = 'KRW'): Promise<ExchangeRate> {
    return this.request<ExchangeRate>(`/api/exchange/rate/${baseCurrency}/${targetCurrency}`);
  }

  async getMajorExchangeRates(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/api/exchange/rates');
  }

  // Glossary APIs
  async getGlossaryTerms(params?: GlossaryTermsParams): Promise<GlossaryTerm[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/glossary/terms?${queryString}` : '/api/glossary/terms';

    return this.request<GlossaryTerm[]>(endpoint);
  }

  async getGlossaryTermDetail(termId: string): Promise<GlossaryTerm> {
    return this.request<GlossaryTerm>(`/api/glossary/terms/${termId}`);
  }

  async searchGlossaryTerms(keyword: string, limit: number = 20): Promise<GlossaryTerm[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('keyword', keyword);
    queryParams.append('limit', limit.toString());

    return this.request<GlossaryTerm[]>(`/api/glossary/search?${queryParams}`);
  }

  async getPopularGlossaryTerms(limit: number = 10): Promise<GlossaryTerm[]> {
    return this.request<GlossaryTerm[]>(`/api/glossary/terms/popular?limit=${limit}`);
  }

  async getGlossaryTermsByCategory(category: string, limit: number = 20): Promise<GlossaryTerm[]> {
    return this.request<GlossaryTerm[]>(`/api/glossary/terms/category/${category}?limit=${limit}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual functions for convenience
export const getPortfolioBalance = () => apiClient.getPortfolioBalance();
export const getPortfolioSummary = () => apiClient.getPortfolioSummary();
export const getSectorAnalysis = () => apiClient.getSectorAnalysis();
export const getReturnsAnalysis = () => apiClient.getReturnsAnalysis();
export const getPortfolioAnalysis = () => apiClient.getPortfolioAnalysis();
export const getPortfolioHistory = (days?: number) => apiClient.getPortfolioHistory(days);
export const getAIAnalysis = () => apiClient.getAIAnalysis();
export const getAINews = (query?: string) => apiClient.getAINews(query);
export const getExchangeRate = (baseCurrency?: string, targetCurrency?: string) => apiClient.getExchangeRate(baseCurrency, targetCurrency);
export const getMajorExchangeRates = () => apiClient.getMajorExchangeRates();
export const getGlossaryTerms = (params?: GlossaryTermsParams) => apiClient.getGlossaryTerms(params);
export const getGlossaryTermDetail = (termId: string) => apiClient.getGlossaryTermDetail(termId);
export const searchGlossaryTerms = (keyword: string, limit?: number) => apiClient.searchGlossaryTerms(keyword, limit);
export const getPopularGlossaryTerms = (limit?: number) => apiClient.getPopularGlossaryTerms(limit);
export const getGlossaryTermsByCategory = (category: string, limit?: number) => apiClient.getGlossaryTermsByCategory(category, limit);

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

// Stock API Functions
export const getStockInfo = async (ticker: string): Promise<StockInfo> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/api/stock/${ticker}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const getStockChart = async (ticker: string, period: string = '1M'): Promise<ChartDataPoint[]> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/api/stock/${ticker}/chart?period=${period}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const getStockNews = async (ticker: string, limit: number = 10): Promise<StockNews[]> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/api/stock/${ticker}/news?limit=${limit}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const getStockAnalysis = async (ticker: string): Promise<StockAnalysis> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/api/stock/${ticker}/analysis`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const getUserStockPosition = async (ticker: string): Promise<UserPosition | null> => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/api/stock/${ticker}/position`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
};
