import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface MarketIndices {
  [key: string]: {
    price: string;
    change: string;
    change_percent: string;
  };
}

export interface MarketNews {
  summary: string;
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
