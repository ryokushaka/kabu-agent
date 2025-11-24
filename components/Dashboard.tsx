import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_POSITIONS, MOCK_HISTORY } from '../constants';
import { calculatePortfolioSummary, formatCurrency, formatPercent } from '../services/dataService';

const Dashboard: React.FC = () => {
  const summary = calculatePortfolioSummary(MOCK_POSITIONS);
  const isProfit = summary.dailyProfitLoss >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Assets Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={64} className="text-blue-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Total Assets (USD)</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{formatCurrency(summary.totalAssetUsd)}</h2>
          <p className="text-slate-500 text-sm">≈ {formatCurrency(summary.totalAssetKrw, 'KRW')}</p>
        </div>

        {/* Daily P/L Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {isProfit ? <TrendingUp size={64} className="text-emerald-500" /> : <TrendingDown size={64} className="text-rose-500" />}
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Daily Profit/Loss</p>
          <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.dailyProfitLoss > 0 ? '+' : ''}{formatCurrency(summary.dailyProfitLoss)}
          </h2>
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
            isProfit ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
          }`}>
            {formatPercent(summary.dailyProfitLossPercent)} Today
          </div>
        </div>

        {/* Total Return Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={64} className="text-violet-500" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">Total Return</p>
          <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${summary.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
             {summary.totalProfitLoss > 0 ? '+' : ''}{formatCurrency(summary.totalProfitLoss)}
          </h2>
           <p className={`text-sm ${summary.totalProfitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             {formatPercent(summary.totalProfitLossPercent)} All Time
           </p>
        </div>

        {/* Cash Balance */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Cash Balance</p>
              <h2 className="text-xl md:text-2xl font-bold text-white">{formatCurrency(summary.cashBalanceUsd)}</h2>
            </div>
            <div className="bg-slate-700 p-2 rounded-lg">
              <DollarSign className="text-slate-300 w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">15% of Portfolio</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-white">Asset Growth Trend</h3>
            <div className="flex gap-2">
              {['1M', '3M', '1Y', 'ALL'].map((period) => (
                <button 
                  key={period} 
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    period === '1M' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_HISTORY}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(str) => str.substring(8)} // Show day only
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
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