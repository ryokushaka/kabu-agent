import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { RefreshCw, TrendingUp, Activity, AlertTriangle, BarChart2 } from 'lucide-react';
import { formatCurrency } from '../services/dataService';
import { getSectorAnalysis, getReturnsAnalysis, getPortfolioAnalysis, SectorAllocation, ReturnAnalysis, AnalysisData } from '../services/api';
import AIAnalysis from './AIAnalysis';

const Analysis: React.FC = () => {
  const { t } = useTranslation('common');
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
    '#3182F6', '#10b981', '#f59e0b', '#F04452', '#8b5cf6', '#ec4899',
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
          <RefreshCw className="animate-spin h-12 w-12 text-toss-blue mx-auto mb-4" />
          <p className="text-toss-grey-500">{t('analysis.loading')}</p>
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
              {t('buttons.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-toss-grey-900">{t('analysis.title')}</h2>
            <p className="text-toss-grey-500 text-sm mt-1">{t('analysis.riskMetrics')}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-toss-grey-50 border border-toss-grey-200 text-toss-grey-700 rounded-xl transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">{t('dashboard.refresh')}</span>
        </button>
      </div>

      {/* Risk Metrics Cards */}
      {analysisData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Activity className="w-5 h-5 text-toss-blue" />
              </div>
              <span className="text-toss-grey-600 text-sm font-medium">{t('analysis.volatility')}</span>
            </div>
            <p className="text-2xl font-bold text-toss-grey-900">
              {(analysisData.metrics.volatility * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-toss-grey-400 mt-1">Annualized Std Dev</p>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-toss-grey-600 text-sm font-medium">{t('analysis.beta')}</span>
            </div>
            <p className="text-2xl font-bold text-toss-grey-900">
              {analysisData.metrics.beta.toFixed(2)}
            </p>
            <p className="text-xs text-toss-grey-400 mt-1">vs SPY</p>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-xl">
                <BarChart2 className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-toss-grey-600 text-sm font-medium">{t('analysis.sharpeRatio')}</span>
            </div>
            <p className="text-2xl font-bold text-toss-grey-900">
              {analysisData.metrics.sharpe_ratio.toFixed(2)}
            </p>
            <p className="text-xs text-toss-grey-400 mt-1">Risk-adjusted Return</p>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-toss-red" />
              </div>
              <span className="text-toss-grey-600 text-sm font-medium">{t('analysis.maxDrawdown')}</span>
            </div>
            <p className="text-2xl font-bold text-toss-red">
              {(analysisData.metrics.max_drawdown * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-toss-grey-400 mt-1">Max Decline from Peak</p>
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <AIAnalysis />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmark Comparison Chart */}
        {analysisData && (
            <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-bold text-toss-grey-900 mb-6">{t('analysis.spComparison')}</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analysisData.chart_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EB" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              stroke="#8B95A1" 
                              tick={{fontSize: 12, fontFamily: 'Pretendard'}} 
                              tickLine={false}
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis 
                              stroke="#8B95A1" 
                              tick={{fontSize: 12, fontFamily: 'Pretendard'}} 
                              unit="%" 
                              tickLine={false}
                              axisLine={false}
                              dx={-10}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#FFFFFF', 
                                  borderColor: '#E5E8EB', 
                                  color: '#191F28',
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                  fontFamily: 'Pretendard'
                                }}
                                itemStyle={{ fontWeight: 600 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line type="monotone" dataKey="portfolio" name={t('analysis.myPortfolio')} stroke="#3182F6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="benchmark" name={t('analysis.sp500')} stroke="#B0B8C1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* Sector Allocation */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-toss-grey-900 mb-6">{t('analysis.sectorWeight')}</h3>
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
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E5E8EB', 
                    color: '#191F28',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'Pretendard'
                  }}
                  itemStyle={{ color: '#333D4B' }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(1)}% (${formatCurrency(props.payload.actualValue)})`,
                    t('analysis.portfolio')
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chartData.map((sector) => (
              <div key={sector.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }}></div>
                <span className="text-toss-grey-700 font-medium truncate">{sector.name}</span>
                <span className="text-toss-grey-500 ml-auto">{sector.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Returns Overview */}
        {returnsData && (
          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-toss-grey-900 mb-6">{t('analysis.profitStatus')}</h3>
            <div className="space-y-4">
              <div className="bg-toss-grey-50 rounded-2xl p-5">
                <p className="text-toss-grey-500 text-sm mb-1 font-medium">{t('analysis.totalReturn')}</p>
                <p className={`text-2xl font-bold ${returnsData.total_return >= 0 ? 'text-toss-red' : 'text-toss-blue'}`}>
                  {returnsData.total_return >= 0 ? '+' : ''}{returnsData.total_return.toFixed(2)}%
                </p>
                <p className="text-toss-grey-600 text-sm mt-1 font-medium">
                  {formatCurrency(returnsData.total_profit_loss)}
                </p>
              </div>

              <div className="bg-toss-grey-50 rounded-2xl p-5">
                <p className="text-toss-grey-500 text-sm mb-2 font-medium">{t('analysis.bestPerformer')}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-toss-grey-900">{returnsData.best_performer.ticker}</p>
                    <p className="text-xs text-toss-grey-500">{returnsData.best_performer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-toss-red">+{returnsData.best_performer.return.toFixed(2)}%</p>
                    <p className="text-xs text-toss-red/80">{formatCurrency(returnsData.best_performer.profit_loss)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-toss-grey-50 rounded-2xl p-5">
                <p className="text-toss-grey-500 text-sm mb-2 font-medium">{t('analysis.worstPerformer')}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-toss-grey-900">{returnsData.worst_performer.ticker}</p>
                    <p className="text-xs text-toss-grey-500">{returnsData.worst_performer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-toss-blue">{returnsData.worst_performer.return.toFixed(2)}%</p>
                    <p className="text-xs text-toss-blue/80">{formatCurrency(returnsData.worst_performer.profit_loss)}</p>
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