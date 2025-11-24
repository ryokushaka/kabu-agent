import React, { useState } from 'react';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { MOCK_POSITIONS } from '../constants';
import { formatCurrency, formatPercent } from '../services/dataService';
import { StockPosition } from '../types';

const PortfolioList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof StockPosition | 'valuation' | 'return', direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof StockPosition | 'valuation' | 'return') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const calculateValuation = (pos: StockPosition) => pos.quantity * pos.currentPrice;
  const calculateReturn = (pos: StockPosition) => (pos.currentPrice - pos.averagePrice) / pos.averagePrice * 100;

  const sortedPositions = [...MOCK_POSITIONS].filter(pos => 
    pos.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pos.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = a[sortConfig.key as keyof StockPosition];
    let bValue: any = b[sortConfig.key as keyof StockPosition];

    if (sortConfig.key === 'valuation') {
      aValue = calculateValuation(a);
      bValue = calculateValuation(b);
    } else if (sortConfig.key === 'return') {
      aValue = calculateReturn(a);
      bValue = calculateReturn(b);
    }

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
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>
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
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('averagePrice')}>
                  <div className="flex items-center justify-end gap-2">Avg Price <SortIcon column="averagePrice" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('currentPrice')}>
                  <div className="flex items-center justify-end gap-2">Cur Price <SortIcon column="currentPrice" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('valuation')}>
                  <div className="flex items-center justify-end gap-2">Valuation <SortIcon column="valuation" /></div>
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('return')}>
                  <div className="flex items-center justify-end gap-2">Return (%) <SortIcon column="return" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedPositions.map((pos) => {
                const valuation = calculateValuation(pos);
                const totalReturn = calculateReturn(pos);
                const isProfitable = totalReturn >= 0;

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
                    <td className="p-4 text-right text-slate-300">{formatCurrency(pos.averagePrice)}</td>
                    <td className="p-4 text-right font-medium text-white">{formatCurrency(pos.currentPrice)}</td>
                    <td className="p-4 text-right font-bold text-white">{formatCurrency(valuation)}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        isProfitable ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'
                      }`}>
                        {formatPercent(totalReturn)}
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
            const valuation = calculateValuation(pos);
            const totalReturn = calculateReturn(pos);
            const isProfitable = totalReturn >= 0;

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
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                        isProfitable ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'
                  }`}>
                    {formatPercent(totalReturn)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-700/50">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Current Price</div>
                    <div className="font-semibold text-white">{formatCurrency(pos.currentPrice)}</div>
                  </div>
                  <div className="text-right">
                     <div className="text-xs text-slate-500 mb-1">Valuation</div>
                     <div className="font-bold text-white">{formatCurrency(valuation)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Avg. Price</div>
                    <div className="text-slate-300">{formatCurrency(pos.averagePrice)}</div>
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