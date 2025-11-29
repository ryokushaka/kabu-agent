import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatPercent } from '../services/dataService';
import { getPortfolioSummary, getPortfolioHistory, PortfolioSummary, HistoryData } from '../services/api';
import { getUSDToKRWRate } from '../services/exchangeService';

const Dashboard: React.FC = () => {
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-toss-blue mx-auto mb-4" />
          <p className="text-toss-grey-500">자산 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 max-w-md">
            <p className="text-toss-red mb-4 font-medium">❌ {error}</p>
            <button
              onClick={fetchAllData}
              className="px-4 py-2 bg-toss-blue hover:bg-blue-600 text-white rounded-xl transition-colors font-medium"
            >
              다시 시도
            </button>
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
      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-toss-grey-900">내 자산</h2>
        <button
          onClick={fetchAllData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-toss-grey-50 border border-toss-grey-200 text-toss-grey-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">새로고침</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Assets Card */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-toss-grey-600 text-sm font-medium mb-1">총 자산 (USD)</p>
              <h2 className="text-3xl font-bold text-toss-grey-900 tracking-tight">
                {formatCurrency(summary.total_assets)}
              </h2>
            </div>
            <div className="bg-toss-blue/10 p-3 rounded-2xl">
              <Wallet size={24} className="text-toss-blue" />
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className={`text-sm font-semibold ${isProfit ? 'text-toss-red' : 'text-toss-blue'}`}>
                {isProfit ? '+' : ''}{formatCurrency(summary.total_profit_loss)} ({formatPercent(summary.total_return_percent)})
             </span>
             <span className="text-toss-grey-400 text-sm">전체 수익</span>
          </div>
        </div>

        {/* Daily P/L Card */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-toss-grey-600 text-sm font-medium mb-1">일일 손익</p>
              <h2 className={`text-3xl font-bold tracking-tight ${dailyIsProfit ? 'text-toss-red' : 'text-toss-blue'}`}>
                {summary.total_profit_loss > 0 ? '+' : ''}{formatCurrency(summary.total_profit_loss)}
              </h2>
            </div>
            <div className={`p-3 rounded-2xl ${dailyIsProfit ? 'bg-red-50' : 'bg-blue-50'}`}>
              {dailyIsProfit ? <TrendingUp size={24} className="text-toss-red" /> : <TrendingDown size={24} className="text-toss-blue" />}
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                dailyIsProfit ? 'bg-red-100 text-toss-red' : 'bg-blue-100 text-toss-blue'
             }`}>
                {formatPercent(summary.total_return_percent)}
             </span>
             <span className="text-toss-grey-400 text-sm">오늘 변동</span>
          </div>
        </div>

        {/* Exchange Rate Card */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-toss-grey-600 text-sm font-medium mb-1">환율 (USD/KRW)</p>
              <h2 className="text-3xl font-bold text-toss-grey-900 tracking-tight">
                ₩{exchangeRate.toLocaleString()}
              </h2>
            </div>
            <div className="bg-toss-grey-100 p-3 rounded-2xl">
              <ArrowLeftRight size={24} className="text-toss-grey-600" />
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-toss-grey-500 text-sm">실시간 고시 환율</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-toss-grey-900">자산 추이</h3>
            <div className="flex gap-1 bg-toss-grey-100 p-1 rounded-xl">
              {(['1M', '3M', '1Y', 'ALL'] as const).map((period) => (
                <button 
                  key={period} 
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period 
                      ? 'bg-white text-toss-grey-900 shadow-sm' 
                      : 'text-toss-grey-500 hover:text-toss-grey-900'
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
      </div>
    </div>
  );
};

export default Dashboard;