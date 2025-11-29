import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { RefreshCw, TrendingUp, Activity, AlertTriangle, BarChart2 } from 'lucide-react';
import { formatCurrency } from '../services/dataService';
import { getSectorAnalysis, getReturnsAnalysis, getPortfolioAnalysis, SectorAllocation, ReturnAnalysis, AnalysisData } from '../services/api';

const Analysis: React.FC = () => {
  const [sectorData, setSectorData] = useState<SectorAllocation[]>([]);
  const [returnsData, setReturnsData] = useState<ReturnAnalysis | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sectors, returns, analysis] = await Promise.all([
        getSectorAnalysis(),
        getReturnsAnalysis(),
        getPortfolioAnalysis()
      ]);
      setSectorData(sectors.sectors);
      setReturnsData(returns);
      setAnalysisData(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const SECTOR_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
  ];

  const chartData = sectorData.map((sector, index) => ({
    name: sector.sector,
    value: sector.weight,
    actualValue: sector.value,
    count: sector.count,
    color: SECTOR_COLORS[index % SECTOR_COLORS.length]
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading premium analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="bg-rose-950 border border-rose-900 rounded-xl p-6 max-w-md">
            <p className="text-rose-400 mb-4">❌ {error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-white">Premium Portfolio Analysis</h2>
            <p className="text-slate-400 text-sm">Advanced risk metrics and benchmark comparison</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Risk Metrics Cards */}
      {analysisData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Volatility (Risk)</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {(analysisData.metrics.volatility * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Annualized Std Dev</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Beta (vs SPY)</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {analysisData.metrics.beta.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Market Sensitivity</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <BarChart2 className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-slate-400 text-sm">Sharpe Ratio</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {analysisData.metrics.sharpe_ratio.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Risk-Adjusted Return</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-slate-400 text-sm">Max Drawdown</span>
            </div>
            <p className="text-2xl font-bold text-rose-400">
              {(analysisData.metrics.max_drawdown * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Peak to Trough</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmark Comparison Chart */}
        {analysisData && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-6">Performance vs S&P 500</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analysisData.chart_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
                            <YAxis stroke="#94a3b8" tick={{fontSize: 12}} unit="%" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="benchmark" name="S&P 500" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* Sector Allocation */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Sector Allocation</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(1)}% (${formatCurrency(props.payload.actualValue)})`,
                    'Weight'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chartData.map((sector) => (
              <div key={sector.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }}></div>
                <span className="text-slate-300">{sector.name}</span>
                <span className="text-slate-500 ml-auto">{sector.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Returns Overview */}
        {returnsData && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Returns Overview</h3>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Total Return</p>
                <p className={`text-2xl font-bold ${returnsData.total_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {returnsData.total_return >= 0 ? '+' : ''}{returnsData.total_return.toFixed(2)}%
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {formatCurrency(returnsData.total_profit_loss)}
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Best Performer</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{returnsData.best_performer.ticker}</p>
                    <p className="text-xs text-slate-400">{returnsData.best_performer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">+{returnsData.best_performer.return.toFixed(2)}%</p>
                    <p className="text-xs text-emerald-500">{formatCurrency(returnsData.best_performer.profit_loss)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Worst Performer</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{returnsData.worst_performer.ticker}</p>
                    <p className="text-xs text-slate-400">{returnsData.worst_performer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-400">{returnsData.worst_performer.return.toFixed(2)}%</p>
                    <p className="text-xs text-rose-500">{formatCurrency(returnsData.worst_performer.profit_loss)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;