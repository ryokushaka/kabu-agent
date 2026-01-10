import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface MarketIndices {
  [key: string]: {
    price: string;
    change: string;
    change_percent: string;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
  is_featured: boolean;
  category: string;
}

export interface MarketNews {
  summary: string;
  news: NewsItem[];
  total: number;
}

class PublicService {
  async getMarketIndices(): Promise<MarketIndices> {
    const response = await axios.get(`${API_URL}/api/public/market/indices`);
    return response.data;
  }

  async getMarketNews(): Promise<MarketNews> {
    const response = await axios.get(`${API_URL}/api/public/market/news`);
    return response.data;
  }
}

export default new PublicService();
