export interface StockNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface AINewsSource {
  title: string;
  link: string;
  source: string;
}

export interface AINewsResponse {
  summary: string;
  sources: AINewsSource[];
}
