import React, { useState, useEffect } from 'react';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { formatCurrency, formatPercent } from '../services/dataService';
import { getPortfolioBalance, Position } from '../services/api';

const PortfolioList: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPortfolioBalance();
      setPositions(data.positions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPositions = [...positions].filter(pos =>
    pos.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (!sortConfig) return 0;

    const key = sortConfig.key as keyof Position;
    let aValue: any = a[key];
    let bValue: any = b[key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExport = () => {
    alert("Excel Export Triggered (Mock Function)");
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown size={14} className="text-slate-600" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-blue-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading portfolio...</p>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Holdings</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ticker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} />
          </button>
          <a
            href="http://localhost:8000/api/export/excel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Excel</span>
          </a>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('ticker')}>
                  <div className="flex items-center gap-2">Ticker <SortIcon column="ticker" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-end gap-2">Qty <SortIcon column="quantity" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('avg_price')}>
                  <div className="flex items-center justify-end gap-2">Avg Price <SortIcon column="avg_price" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('current_price')}>
                  <div className="flex items-center justify-end gap-2">Cur Price <SortIcon column="current_price" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('market_value')}>
                  <div className="flex items-center justify-end gap-2">Valuation <SortIcon column="market_value" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('profit_loss_percent')}>
                  <div className="flex items-center justify-end gap-2">Return (%) <SortIcon column="profit_loss_percent" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedPositions.map((pos) => {
                const isProfitable = pos.profit_loss_percent >= 0;

                return (
                  <tr key={pos.ticker} className="hover:bg-slate-700/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {pos.ticker[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white">{pos.ticker}</div>
                          <div className="text-xs text-slate-400">{pos.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right text-slate-300 font-medium">{pos.quantity}</td>
                    <td className="p-4 text-right text-slate-300">{formatCurrency(pos.avg_price)}</td>
                    <td className="p-4 text-right font-medium text-white">{formatCurrency(pos.current_price)}</td>
                    <td className="p-4 text-right font-bold text-white">{formatCurrency(pos.market_value)}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${isProfitable ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'
                        }`}>
                        {formatPercent(pos.profit_loss_percent)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedPositions.map((pos) => {
          const isProfitable = pos.profit_loss_percent >= 0;

          return (
            <div key={pos.ticker} className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
                    {pos.ticker[0]}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{pos.ticker}</div>
                    <div className="text-xs text-slate-400">{pos.name}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${isProfitable ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'
                  }`}>
                  {formatPercent(pos.profit_loss_percent)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-700/50">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Current Price</div>
                  <div className="font-semibold text-white">{formatCurrency(pos.current_price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Valuation</div>
                  <div className="font-bold text-white">{formatCurrency(pos.market_value)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Avg. Price</div>
                  <div className="text-slate-300">{formatCurrency(pos.avg_price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Quantity</div>
                  <div className="text-slate-300">{pos.quantity}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default PortfolioList;