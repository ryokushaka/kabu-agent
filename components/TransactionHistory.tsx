import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../services/dataService';

interface Transaction {
  id: string;
  ticker: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
  fees: number;
  transaction_date: string;
  created_at: string;
}

interface TransactionStats {
  total_buy_amount: number;
  total_sell_amount: number;
  total_fees: number;
  realized_profit_loss: number;
  transaction_count: number;
  buy_count: number;
  sell_count: number;
  most_traded_ticker: string | null;
  avg_transaction_amount: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const TransactionHistory: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterTicker, setFilterTicker] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statsPeriod, setStatsPeriod] = useState('1M');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });

      if (filterType) params.append('transaction_type', filterType);
      if (filterTicker) params.append('ticker', filterTicker);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_BASE_URL}/api/transactions?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      setTransactions(data.transactions);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/transactions/stats?period=${statsPeriod}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filterType, filterTicker, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [statsPeriod]);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_BASE_URL}/api/transactions/export/csv?${params}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterTicker('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-toss-grey-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-toss-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-toss-grey-900 mb-1">{t('transactions.loading')}</h3>
          <p className="text-sm text-toss-grey-500">{t('labels.loading')}</p>
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
              <span className="text-3xl">!</span>
            </div>
            <h3 className="text-lg font-bold text-toss-grey-900 mb-2">{t('errors.general')}</h3>
            <p className="text-toss-red mb-6 text-sm">{error}</p>
            <button
              onClick={fetchTransactions}
              className="px-6 py-2.5 bg-toss-blue hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium inline-flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {t('buttons.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-toss-grey-900">{t('transactions.title')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="flex items-center justify-center gap-2 bg-white hover:bg-toss-grey-50 border border-toss-grey-200 text-toss-grey-700 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('transactions.exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-toss-grey-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-toss-red" />
              </div>
              <span className="text-xs text-toss-grey-500">{t('transactions.stats.totalBuy')}</span>
            </div>
            <div className="font-bold text-lg text-toss-grey-900">
              {formatCurrency(stats.total_buy_amount)}
            </div>
            <div className="text-xs text-toss-grey-400">{stats.buy_count}</div>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-toss-blue" />
              </div>
              <span className="text-xs text-toss-grey-500">{t('transactions.stats.totalSell')}</span>
            </div>
            <div className="font-bold text-lg text-toss-grey-900">
              {formatCurrency(stats.total_sell_amount)}
            </div>
            <div className="text-xs text-toss-grey-400">{stats.sell_count}</div>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${stats.realized_profit_loss >= 0 ? 'bg-red-50' : 'bg-blue-50'} rounded-lg flex items-center justify-center`}>
                {stats.realized_profit_loss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-toss-red" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-toss-blue" />
                )}
              </div>
              <span className="text-xs text-toss-grey-500">{t('transactions.stats.realizedPL')}</span>
            </div>
            <div className={`font-bold text-lg ${stats.realized_profit_loss >= 0 ? 'text-toss-red' : 'text-toss-blue'}`}>
              {stats.realized_profit_loss >= 0 ? '+' : ''}{formatCurrency(stats.realized_profit_loss)}
            </div>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-xs text-toss-grey-500">{t('transactions.stats.avgAmount')}</span>
            </div>
            <div className="font-bold text-lg text-toss-grey-900">
              {formatCurrency(stats.avg_transaction_amount)}
            </div>
            <div className="text-xs text-toss-grey-400">{stats.transaction_count}</div>
          </div>
        </div>
      )}

      {/* Stats Period Selector */}
      <div className="flex gap-2">
        {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
          <button
            key={period}
            onClick={() => setStatsPeriod(period)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statsPeriod === period
                ? 'bg-toss-blue text-white'
                : 'bg-toss-grey-100 text-toss-grey-600 hover:bg-toss-grey-200'
            }`}
          >
            {t(`periods.${period}`)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-toss-grey-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-toss-grey-500" />
          <span className="text-sm font-semibold text-toss-grey-700">{t('labels.filter')}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="bg-toss-grey-50 border border-toss-grey-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-toss-blue"
          >
            <option value="">{t('transactions.filters.allTypes')}</option>
            <option value="BUY">{t('transactions.filters.buy')}</option>
            <option value="SELL">{t('transactions.filters.sell')}</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-toss-grey-400" />
            <input
              type="text"
              placeholder={t('transactions.tickerPlaceholder')}
              value={filterTicker}
              onChange={(e) => { setFilterTicker(e.target.value.toUpperCase()); setPage(1); }}
              className="w-full bg-toss-grey-50 border border-toss-grey-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-toss-blue"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-toss-grey-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full bg-toss-grey-50 border border-toss-grey-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-toss-blue"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-toss-grey-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full bg-toss-grey-50 border border-toss-grey-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-toss-blue"
            />
          </div>

          <button
            onClick={clearFilters}
            className="bg-toss-grey-100 hover:bg-toss-grey-200 text-toss-grey-600 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {t('transactions.reset')}
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white border border-toss-grey-100 rounded-3xl shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-toss-grey-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-toss-grey-300" />
            </div>
            <h3 className="text-lg font-bold text-toss-grey-900 mb-2">{t('transactions.noData')}</h3>
            <p className="text-sm text-toss-grey-500">{t('transactions.noDataDesc')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-toss-grey-50 border-b border-toss-grey-100">
                    <th className="p-4 text-xs font-semibold text-toss-grey-500 uppercase">{t('transactions.dateTime')}</th>
                    <th className="p-4 text-xs font-semibold text-toss-grey-500 uppercase">{t('transactions.table.stock')}</th>
                    <th className="p-4 text-xs font-semibold text-toss-grey-500 uppercase text-center">{t('transactions.table.type')}</th>
                    <th className="p-4 text-xs font-semibold text-toss-grey-500 uppercase text-right">{t('transactions.table.quantity')}</th>
                    <th className="p-4 text-xs font-semibold text-toss-grey-500 uppercase text-right">{t('transactions.table.price')}</th>
                    <th className="p-4 text-xs font-semibold text-toss-grey-500 uppercase text-right">{t('transactions.table.amount')}</th>
                    <th className="p-4 text-xs font-semibold text-toss-grey-500 uppercase text-right">{t('transactions.fee')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-toss-grey-100">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => navigate(`/stock/${tx.ticker}`)}
                      className="hover:bg-toss-grey-50 transition-colors cursor-pointer"
                    >
                      <td className="p-4 text-sm text-toss-grey-700">
                        {new Date(tx.transaction_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-toss-grey-100 flex items-center justify-center text-xs font-bold text-toss-grey-600">
                            {tx.ticker[0]}
                          </div>
                          <span className="font-semibold text-toss-grey-900">{tx.ticker}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          tx.transaction_type === 'BUY'
                            ? 'bg-red-50 text-toss-red border border-red-100'
                            : 'bg-blue-50 text-toss-blue border border-blue-100'
                        }`}>
                          {tx.transaction_type === 'BUY' ? (
                            <>
                              <ArrowDownRight className="w-3 h-3" />
                              {t('transactions.filters.buy')}
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              {t('transactions.filters.sell')}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-right text-toss-grey-700 font-medium">{tx.quantity}</td>
                      <td className="p-4 text-right text-toss-grey-700">{formatCurrency(tx.price)}</td>
                      <td className="p-4 text-right font-bold text-toss-grey-900">{formatCurrency(tx.total_amount)}</td>
                      <td className="p-4 text-right text-toss-grey-500 text-sm">{formatCurrency(tx.fees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-toss-grey-100">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/stock/${tx.ticker}`)}
                  className="p-4 hover:bg-toss-grey-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-toss-grey-100 flex items-center justify-center text-sm font-bold text-toss-grey-600">
                        {tx.ticker[0]}
                      </div>
                      <div>
                        <div className="font-bold text-toss-grey-900">{tx.ticker}</div>
                        <div className="text-xs text-toss-grey-500">
                          {new Date(tx.transaction_date).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      tx.transaction_type === 'BUY'
                        ? 'bg-red-50 text-toss-red border border-red-100'
                        : 'bg-blue-50 text-toss-blue border border-blue-100'
                    }`}>
                      {tx.transaction_type === 'BUY' ? t('transactions.filters.buy') : t('transactions.filters.sell')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-toss-grey-500">{t('transactions.table.quantity')}</div>
                      <div className="font-medium text-toss-grey-900">{tx.quantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-toss-grey-500">{t('transactions.table.price')}</div>
                      <div className="font-medium text-toss-grey-900">{formatCurrency(tx.price)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-toss-grey-500">{t('transactions.table.amount')}</div>
                      <div className="font-bold text-toss-grey-900">{formatCurrency(tx.total_amount)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-toss-grey-100 bg-toss-grey-50">
            <div className="text-sm text-toss-grey-500">
              {t('transactions.totalOf', { total, start: (page - 1) * pageSize + 1, end: Math.min(page * pageSize, total) })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-toss-grey-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-toss-grey-600" />
              </button>
              <span className="text-sm font-medium text-toss-grey-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-toss-grey-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-toss-grey-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
