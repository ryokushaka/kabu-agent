import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatPercent } from '../services/dataService';
import { getPortfolioSummary, getPortfolioHistory, PortfolioSummary, HistoryData } from '../services/api';
import { getUSDToKRWRate } from '../services/exchangeService';
import NewsFeed from './NewsFeed';

const Dashboard: React.FC = () => {
  const { t } = useTranslation('common');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '1Y' | 'ALL'>('1M');

  const periodToDays: Record<string, number> = {
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    'ALL': 1095 // 3 years
  };

  const fetchSummaryData = async () => {
    try {
      const [summaryData, currentExchangeRate] = await Promise.all([
        getPortfolioSummary(),
        getUSDToKRWRate()
      ]);
      setSummary(summaryData);
      setExchangeRate(currentExchangeRate);
    } catch (err) {
      throw err;
    }
  };

  const fetchHistoryData = async (period: string) => {
    try {
      setHistoryLoading(true);
      const days = periodToDays[period] || 30;
      const historyData = await getPortfolioHistory(days);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      // History failure shouldn't block the whole dashboard
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([
        fetchSummaryData(),
        fetchHistoryData(selectedPeriod)
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch history when period changes
  useEffect(() => {
    fetchHistoryData(selectedPeriod);
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Skeleton for Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-toss-grey-100 rounded-xl animate-pulse"></div>
                <div className="w-16 h-4 bg-toss-grey-100 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="w-32 h-8 bg-toss-grey-100 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-toss-grey-100 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton for Chart */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="w-32 h-6 bg-toss-grey-100 rounded animate-pulse"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-8 bg-toss-grey-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="h-64 bg-toss-grey-50 rounded-xl animate-pulse"></div>
        </div>

        {/* Loading indicator */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-toss-grey-500 text-sm">
            <div className="w-4 h-4 border-2 border-toss-blue border-t-transparent rounded-full animate-spin"></div>
            <span>{t('dashboard.loadingData')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 max-w-md shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-lg font-bold text-toss-grey-900 mb-2">{t('dashboard.loadError')}</h3>
            <p className="text-toss-red mb-6 text-sm">{error}</p>
            <div className="space-y-2">
              <button
                onClick={fetchAllData}
                className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-300/50 active:scale-[0.98] text-white rounded-xl transition-all duration-200 font-medium shadow-sm shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 min-h-[44px] inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                {t('buttons.retry')}
              </button>
              <p className="text-xs text-toss-grey-500 mt-3">
                {t('dashboard.checkKisApi')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const isProfit = summary.total_profit_loss >= 0;
  const dailyIsProfit = summary.total_return_percent >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-toss-grey-900">{t('dashboard.myAssets')}</h2>
          <p className="text-sm text-toss-grey-500 mt-1">
            {refreshing ? (
              <span className="inline-flex items-center gap-1.5 text-toss-blue">
                <div className="w-1.5 h-1.5 bg-toss-blue rounded-full animate-pulse"></div>
                {t('dashboard.updatingData')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                {t('dashboard.latestData')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-toss-grey-50 border border-toss-grey-200 text-toss-grey-700 rounded-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-toss-grey-300 focus:ring-offset-2 min-h-[44px]"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">{refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Assets Card */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:shadow-toss-grey-200/50 hover:border-toss-grey-200 transition-all duration-200 cursor-pointer group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-toss-grey-600 text-sm font-medium mb-1">{t('dashboard.totalAssets')}</p>
              <h2 className="text-3xl font-bold text-toss-grey-900 tracking-tight">
                {formatCurrency(summary.total_assets)}
              </h2>
              <p className="text-xs text-toss-grey-400 mt-1">≈ ₩{(summary.total_assets * exchangeRate).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-toss-blue/10 p-3 rounded-2xl group-hover:bg-toss-blue/20 transition-colors">
              <Wallet size={24} className="text-toss-blue" />
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isProfit ? 'text-toss-red' : 'text-toss-blue'}`}>
                {isProfit ? '▲' : '▼'}
                {isProfit ? '+' : ''}{formatCurrency(summary.total_profit_loss)} ({formatPercent(summary.total_return_percent)})
             </span>
             <span className="text-toss-grey-400 text-sm">{t('dashboard.totalProfit')}</span>
          </div>
        </div>

        {/* Daily P/L Card */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:shadow-toss-grey-200/50 hover:border-toss-grey-200 transition-all duration-200 cursor-pointer group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-toss-grey-600 text-sm font-medium mb-1">{t('dashboard.dailyPL')}</p>
              <h2 className={`text-3xl font-bold tracking-tight ${dailyIsProfit ? 'text-toss-red' : 'text-toss-blue'}`}>
                {dailyIsProfit ? '+' : ''}{formatCurrency(summary.total_profit_loss)}
              </h2>
            </div>
            <div className={`p-3 rounded-2xl transition-colors ${dailyIsProfit ? 'bg-red-50 group-hover:bg-red-100' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
              {dailyIsProfit ? <TrendingUp size={24} className="text-toss-red" /> : <TrendingDown size={24} className="text-toss-blue" />}
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${
                dailyIsProfit
                  ? 'bg-red-50 text-toss-red border-red-100 shadow-red-100'
                  : 'bg-blue-50 text-toss-blue border-blue-100 shadow-blue-100'
             }`}>
                {dailyIsProfit ? '▲' : '▼'}
                {formatPercent(summary.total_return_percent)}
             </span>
             <span className="text-toss-grey-400 text-sm">{t('dashboard.todayChange')}</span>
          </div>
        </div>

        {/* Exchange Rate Card */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:shadow-toss-grey-200/50 hover:border-toss-grey-200 transition-all duration-200 cursor-pointer group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-toss-grey-600 text-sm font-medium mb-1">{t('dashboard.exchangeRate')}</p>
              <h2 className="text-3xl font-bold text-toss-grey-900 tracking-tight">
                ₩{exchangeRate.toLocaleString()}
              </h2>
            </div>
            <div className="bg-toss-grey-100 p-3 rounded-2xl group-hover:bg-toss-grey-200 transition-colors">
              <ArrowLeftRight size={24} className="text-toss-grey-600" />
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-toss-grey-500 text-sm">{t('dashboard.realtimeRate')}</span>
          </div>
        </div>
      </div>

      {/* Charts and News Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-toss-grey-900">{t('dashboard.assetTrend')}</h3>
            <div className="flex gap-1 bg-toss-grey-100 p-1 rounded-xl">
              {(['1M', '3M', '1Y', 'ALL'] as const).map((period) => (
                <button 
                  key={period} 
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period 
                      ? 'bg-white text-toss-blue font-bold shadow-sm ring-1 ring-toss-blue/20' 
                      : 'text-toss-grey-500 hover:text-toss-grey-900 hover:bg-white/50'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full relative">
            {historyLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10 rounded-2xl">
                <RefreshCw className="animate-spin h-8 w-8 text-toss-blue" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3182F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3182F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EB" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8B95A1"
                  style={{ fontSize: '12px', fontFamily: 'Pretendard' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.substring(5)}
                  dy={10}
                />
                <YAxis 
                  stroke="#8B95A1"
                  style={{ fontSize: '12px', fontFamily: 'Pretendard' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E8EB',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'Pretendard'
                  }}
                  itemStyle={{ color: '#3182F6', fontWeight: 600 }}
                  labelStyle={{ color: '#4E5968', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3182F6" 
                  strokeWidth={3}
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI News Feed */}
        <div className="lg:col-span-1 h-[420px]">
          <NewsFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;