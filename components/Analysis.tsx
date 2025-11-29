import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../services/dataService';
import { getSectorAnalysis, getReturnsAnalysis, SectorAllocation, ReturnAnalysis } from '../services/api';

const Analysis: React.FC = () => {
  const [sectorData, setSectorData] = useState<SectorAllocation[]>([]);
  const [returnsData, setReturnsData] = useState<ReturnAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sectors, returns] = await Promise.all([
        getSectorAnalysis(),
        getReturnsAnalysis()
      ]);
      setSectorData(sectors.sectors);
      setReturnsData(returns);
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
    '#3b82f6', // blue
    '#10b981', // emerald  
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
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
          <p className="text-slate-400">Loading analysis...</p>
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
        <h2 className="text-2xl font-bold text-white">Portfolio Analysis</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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