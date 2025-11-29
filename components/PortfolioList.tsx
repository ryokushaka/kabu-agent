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

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown size={14} className="text-toss-grey-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-toss-blue" /> : <ArrowDown size={14} className="text-toss-blue" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-toss-blue mx-auto mb-4" />
          <p className="text-toss-grey-500">주식 목록을 불러오는 중...</p>
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
              onClick={fetchData}
              className="px-4 py-2 bg-toss-blue hover:bg-blue-600 text-white rounded-xl transition-colors font-medium"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-toss-grey-900">내 주식</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-toss-grey-400 w-4 h-4" />
            <input
              type="text"
              placeholder="종목명 또는 티커 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-toss-grey-200 text-toss-grey-900 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white hover:bg-toss-grey-50 border border-toss-grey-200 text-toss-grey-700 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
          <a
            href="http://localhost:8000/api/export/excel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition-colors text-sm font-medium whitespace-nowrap shadow-sm shadow-emerald-200"
          >
            <Download size={16} />
            <span className="hidden sm:inline">엑셀 다운로드</span>
          </a>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-toss-grey-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-toss-grey-50 border-b border-toss-grey-100">
                <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase tracking-wider cursor-pointer hover:text-toss-grey-700" onClick={() => handleSort('ticker')}>
                  <div className="flex items-center gap-2">종목 <SortIcon column="ticker" /></div>
                </th>
                <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase tracking-wider text-right cursor-pointer hover:text-toss-grey-700" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-end gap-2">보유수량 <SortIcon column="quantity" /></div>
                </th>
                <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase tracking-wider text-right cursor-pointer hover:text-toss-grey-700" onClick={() => handleSort('avg_price')}>
                  <div className="flex items-center justify-end gap-2">평균단가 <SortIcon column="avg_price" /></div>
                </th>
                <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase tracking-wider text-right cursor-pointer hover:text-toss-grey-700" onClick={() => handleSort('current_price')}>
                  <div className="flex items-center justify-end gap-2">현재가 <SortIcon column="current_price" /></div>
                </th>
                <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase tracking-wider text-right cursor-pointer hover:text-toss-grey-700" onClick={() => handleSort('market_value')}>
                  <div className="flex items-center justify-end gap-2">평가금액 <SortIcon column="market_value" /></div>
                </th>
                <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase tracking-wider text-right cursor-pointer hover:text-toss-grey-700" onClick={() => handleSort('profit_loss_percent')}>
                  <div className="flex items-center justify-end gap-2">수익률 <SortIcon column="profit_loss_percent" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-toss-grey-100">
              {sortedPositions.map((pos) => {
                const isProfitable = pos.profit_loss_percent >= 0;

                return (
                  <tr key={pos.ticker} className="hover:bg-toss-grey-50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-toss-grey-100 flex items-center justify-center text-sm font-bold text-toss-grey-600">
                          {pos.ticker[0]}
                        </div>
                        <div>
                          <div className="font-bold text-toss-grey-900">{pos.ticker}</div>
                          <div className="text-xs text-toss-grey-500">{pos.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-right text-toss-grey-700 font-medium">{pos.quantity}</td>
                    <td className="p-5 text-right text-toss-grey-700">{formatCurrency(pos.avg_price)}</td>
                    <td className="p-5 text-right font-medium text-toss-grey-900">{formatCurrency(pos.current_price)}</td>
                    <td className="p-5 text-right font-bold text-toss-grey-900">{formatCurrency(pos.market_value)}</td>
                    <td className="p-5 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${isProfitable ? 'bg-red-50 text-toss-red' : 'bg-blue-50 text-toss-blue'
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
            <div key={pos.ticker} className="bg-white border border-toss-grey-100 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-toss-grey-100 flex items-center justify-center text-base font-bold text-toss-grey-600">
                    {pos.ticker[0]}
                  </div>
                  <div>
                    <div className="font-bold text-toss-grey-900 text-lg">{pos.ticker}</div>
                    <div className="text-xs text-toss-grey-500">{pos.name}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isProfitable ? 'bg-red-50 text-toss-red' : 'bg-blue-50 text-toss-blue'
                  }`}>
                  {formatPercent(pos.profit_loss_percent)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-toss-grey-100">
                <div>
                  <div className="text-xs text-toss-grey-500 mb-1">현재가</div>
                  <div className="font-semibold text-toss-grey-900">{formatCurrency(pos.current_price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-toss-grey-500 mb-1">평가금액</div>
                  <div className="font-bold text-toss-grey-900">{formatCurrency(pos.market_value)}</div>
                </div>
                <div>
                  <div className="text-xs text-toss-grey-500 mb-1">평균단가</div>
                  <div className="text-toss-grey-700">{formatCurrency(pos.avg_price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-toss-grey-500 mb-1">보유수량</div>
                  <div className="text-toss-grey-700">{pos.quantity}</div>
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