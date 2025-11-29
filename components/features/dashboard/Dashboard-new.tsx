import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { usePortfolioSummary, usePortfolioHistory } from '../../../hooks/usePortfolio';
import { useUSDToKRW } from '../../../hooks/useExchangeRate';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorDisplay } from '../../common/ErrorDisplay';
import { formatCurrency, formatPercent } from '../../../services/dataService';
import type { PeriodType } from '../../../types';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1M');

  const periodToDays: Record<PeriodType, number> = {
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    ALL: 1095 // 3 years
  };

  // Use custom hooks
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = usePortfolioSummary();

  const {
    data: history = [],
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory
  } = usePortfolioHistory(periodToDays[selectedPeriod]);

  const { rate: exchangeRate, isLoading: rateLoading } = useUSDToKRW();

  const handleRefresh = () => {
    refetchSummary();
    refetchHistory();
  };

  // Loading state
  if (summaryLoading || rateLoading) {
    return <LoadingSpinner message="Loading portfolio data..." />;
  }

  // Error state
  if (summaryError) {
    return <ErrorDisplay error={summaryError} onRetry={handleRefresh} />;
  }

  // No data state
  if (!summary) return null;

  const isProfit = summary.total_profit_loss >= 0;
  const dailyIsProfit = summary.total_return_percent >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Total Assets Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={64} className="text-blue-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">
            Total Assets (USD)
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {formatCurrency(summary.total_assets)}
          </h2>
          <p className="text-slate-500 text-sm">{summary.positions_count} positions</p>
        </div>

        {/* Daily P/L Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {dailyIsProfit ? (
              <TrendingUp size={64} className="text-emerald-500" />
            ) : (
              <TrendingDown size={64} className="text-rose-500" />
            )}
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">
            Daily Profit/Loss
          </p>
          <h2
            className={`text-2xl md:text-3xl font-bold mb-2 ${
              dailyIsProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.total_profit_loss > 0 ? '+' : ''}
            {formatCurrency(summary.total_profit_loss)}
          </h2>
          <div
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
              dailyIsProfit
                ? 'bg-emerald-950 text-emerald-400'
                : 'bg-rose-950 text-rose-400'
            }`}
          >
            {formatPercent(summary.total_return_percent)} Today
          </div>
        </div>

        {/* Total Return Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={64} className="text-violet-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Total Return</p>
          <h2
            className={`text-2xl md:text-3xl font-bold mb-2 ${
              isProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.total_profit_loss > 0 ? '+' : ''}
            {formatCurrency(summary.total_profit_loss)}
          </h2>
          <p className={`text-sm ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
            {formatPercent(summary.total_return_percent)} All Time
          </p>
        </div>

        {/* Cash Balance */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={64} className="text-amber-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Cash Balance</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {formatCurrency(summary.cash)}
          </h2>
          <p className="text-slate-500 text-sm">Available</p>
        </div>

        {/* Exchange Rate Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowLeftRight size={64} className="text-cyan-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">USD to KRW</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            ₩{exchangeRate.toLocaleString()}
          </h2>
          <p className="text-slate-500 text-sm">Exchange Rate</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-white">
              Asset Growth Trend
            </h3>
            <div className="flex gap-2">
              {(['1M', '3M', '1Y', 'ALL'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full relative">
            {historyLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 z-10">
                <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            )}
            {historyError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-rose-400">Failed to load chart data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => value.substring(5)}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
