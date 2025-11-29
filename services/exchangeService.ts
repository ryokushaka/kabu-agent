/**
 * Exchange Rate Service - Manages real-time exchange rates
 */
import { getExchangeRate, ExchangeRate } from './api';

class ExchangeRateService {
  private cache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get current USD to KRW exchange rate with caching
   */
  async getUSDToKRW(): Promise<number> {
    const cacheKey = 'USD-KRW';
    const cached = this.cache.get(cacheKey);

    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.rate;
    }

    try {
      const exchangeData: ExchangeRate = await getExchangeRate('USD', 'KRW');
      const rate = exchangeData.rate;

      // Cache the new rate
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Fallback to cached value if available
      if (cached) {
        console.warn('Using cached exchange rate due to API failure');
        return cached.rate;
      }
      
      // Ultimate fallback to a reasonable default
      console.warn('Using default exchange rate (1400 KRW per USD)');
      return 1400;
    }
  }

  /**
   * Convert USD amount to KRW
   */
  async convertUSDToKRW(usdAmount: number): Promise<number> {
    const rate = await this.getUSDToKRW();
    return usdAmount * rate;
  }

  /**
   * Format currency with appropriate symbol and decimals
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    });
    
    return formatter.format(amount);
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();

// Export for convenience
export const getUSDToKRWRate = () => exchangeRateService.getUSDToKRW();
export const convertUSDToKRW = (amount: number) => exchangeRateService.convertUSDToKRW(amount);
export const formatCurrency = (amount: number, currency?: string) => exchangeRateService.formatCurrency(amount, currency);