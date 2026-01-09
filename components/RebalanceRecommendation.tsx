import React, { useState, useEffect } from 'react';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Check,
  X,
  History,
  AlertTriangle,
  Loader2,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency, formatPercent } from '../services/dataService';

interface AllocationItem {
  ticker: string;
  name: string;
  current_weight: number;
  target_weight: number;
  difference: number;
  current_value: number;
  target_value: number;
  action: 'buy' | 'sell' | 'hold';
  shares_to_trade: number;
}

interface RebalanceRecommendation {
  id: string;
  strategy: string;
  risk_profile: string;
  analysis_summary: string;
  current_allocation: AllocationItem[];
  suggested_allocation: AllocationItem[];
  total_portfolio_value: number;
  estimated_trades: number;
  estimated_fees: number;
  status: string;
  created_at: string;
}

interface HistoryItem {
  id: string;
  strategy: string;
  status: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const COLORS = ['#3182f6', '#f04452', '#00c48c', '#ffb020', '#7c3aed', '#ec4899', '#06b6d4', '#f59e0b'];

const RebalanceRecommendationPage: React.FC = () => {
  const [recommendation, setRecommendation] = useState<RebalanceRecommendation | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('balanced');

  const strategies = [
    { id: 'aggressive', label: '공격형', icon: Zap, color: 'text-toss-red', bg: 'bg-red-50', description: '성장주 비중 강화' },
    { id: 'balanced', label: '균형형', icon: Scale, color: 'text-toss-blue', bg: 'bg-blue-50', description: '적정 비중 유지' },
    { id: 'conservative', label: '보수형', icon: Shield, color: 'text-green-600', bg: 'bg-green-50', description: '안정성 우선' },
    { id: 'equal_weight', label: '동일 비중', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', description: '균등 배분' }
  ];

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/rebalance/history?limit=5`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const generateRecommendation = async () => {
    try {
      setGenerating(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/rebalance/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ strategy: selectedStrategy })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to generate recommendation');
      }

      const data = await response.json();
      setRecommendation(data);
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendation');
    } finally {
      setGenerating(false);
    }
  };

  const applyRecommendation = async () => {
    if (!recommendation) return;

    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE_URL}/api/rebalance/${recommendation.id}/apply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      setRecommendation({ ...recommendation, status: 'applied' });
      fetchHistory();
    } catch (err) {
      console.error('Failed to apply recommendation:', err);
    }
  };

  const dismissRecommendation = async () => {
    if (!recommendation) return;

    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE_URL}/api/rebalance/${recommendation.id}/dismiss`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      setRecommendation({ ...recommendation, status: 'dismissed' });
      fetchHistory();
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-toss-red bg-red-50 border-red-100';
      case 'sell': return 'text-toss-blue bg-blue-50 border-blue-100';
      default: return 'text-toss-grey-500 bg-toss-grey-50 border-toss-grey-100';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'buy': return '매수';
      case 'sell': return '매도';
      default: return '유지';
    }
  };

  const preparePieData = (items: AllocationItem[], key: 'current_weight' | 'target_weight') => {
    return items.map(item => ({
      name: item.ticker,
      value: item[key],
      fullName: item.name
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-toss-grey-900">리밸런싱 추천</h2>
          <p className="text-sm text-toss-grey-500 mt-1">AI 기반 포트폴리오 최적화 제안</p>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-toss-grey-900 mb-4">투자 전략 선택</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`p-4 rounded-2xl border-2 transition-all ${
                selectedStrategy === strategy.id
                  ? `${strategy.bg} border-current ${strategy.color}`
                  : 'bg-white border-toss-grey-100 hover:border-toss-grey-200'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <strategy.icon className={`w-6 h-6 mb-2 ${selectedStrategy === strategy.id ? strategy.color : 'text-toss-grey-400'}`} />
                <span className={`font-semibold text-sm ${selectedStrategy === strategy.id ? strategy.color : 'text-toss-grey-700'}`}>
                  {strategy.label}
                </span>
                <span className="text-xs text-toss-grey-500 mt-1">{strategy.description}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={generateRecommendation}
            disabled={generating}
            className="flex items-center gap-2 px-8 py-3 bg-toss-blue text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Scale className="w-5 h-5" />
                리밸런싱 추천받기
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-toss-red flex-shrink-0" />
          <p className="text-toss-red text-sm">{error}</p>
        </div>
      )}

      {/* Recommendation Result */}
      {recommendation && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-toss-blue/5 to-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-toss-blue text-white text-xs font-bold rounded-full">
                    {recommendation.risk_profile}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    recommendation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    recommendation.status === 'applied' ? 'bg-green-100 text-green-700' :
                    'bg-toss-grey-100 text-toss-grey-600'
                  }`}>
                    {recommendation.status === 'pending' ? '대기 중' :
                     recommendation.status === 'applied' ? '적용됨' : '무시됨'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-toss-grey-900 mb-2">AI 리밸런싱 분석 결과</h3>
                <p className="text-sm text-toss-grey-600">{recommendation.analysis_summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-100">
              <div>
                <div className="text-xs text-toss-grey-500">포트폴리오 가치</div>
                <div className="font-bold text-toss-grey-900">{formatCurrency(recommendation.total_portfolio_value)}</div>
              </div>
              <div>
                <div className="text-xs text-toss-grey-500">예상 거래 수</div>
                <div className="font-bold text-toss-grey-900">{recommendation.estimated_trades}건</div>
              </div>
              <div>
                <div className="text-xs text-toss-grey-500">예상 수수료</div>
                <div className="font-bold text-toss-grey-900">{formatCurrency(recommendation.estimated_fees)}</div>
              </div>
            </div>

            {recommendation.status === 'pending' && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={applyRecommendation}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-toss-blue text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  적용하기
                </button>
                <button
                  onClick={dismissRecommendation}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-toss-grey-100 text-toss-grey-700 rounded-xl font-medium hover:bg-toss-grey-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  무시
                </button>
              </div>
            )}
          </div>

          {/* Charts Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Allocation */}
            <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-toss-grey-900 mb-4">현재 배분</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={preparePieData(recommendation.suggested_allocation, 'current_weight')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {recommendation.suggested_allocation.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '비중']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e8eb',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Allocation */}
            <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-toss-grey-900 mb-4">추천 배분</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={preparePieData(recommendation.suggested_allocation, 'target_weight')}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {recommendation.suggested_allocation.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '비중']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e8eb',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Recommendations */}
          <div className="bg-white border border-toss-grey-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-toss-grey-100">
              <h4 className="font-bold text-toss-grey-900">상세 조정 내역</h4>
            </div>
            <div className="divide-y divide-toss-grey-100">
              {recommendation.suggested_allocation
                .filter(item => item.action !== 'hold')
                .map((item, index) => (
                <div key={index} className="p-5 hover:bg-toss-grey-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-toss-grey-100 flex items-center justify-center text-sm font-bold text-toss-grey-600">
                        {item.ticker[0]}
                      </div>
                      <div>
                        <div className="font-bold text-toss-grey-900">{item.ticker}</div>
                        <div className="text-xs text-toss-grey-500">{item.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-toss-grey-500">{item.current_weight.toFixed(1)}%</span>
                          <ArrowRight className="w-4 h-4 text-toss-grey-400" />
                          <span className="font-semibold text-toss-grey-900">{item.target_weight.toFixed(1)}%</span>
                        </div>
                        <div className={`text-xs ${item.difference > 0 ? 'text-toss-red' : 'text-toss-blue'}`}>
                          {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}%p
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getActionColor(item.action)}`}>
                        {item.action === 'buy' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                        {item.action === 'sell' && <TrendingDown className="w-3 h-3 inline mr-1" />}
                        {getActionText(item.action)} {item.shares_to_trade > 0 && `${item.shares_to_trade}주`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recommendation.suggested_allocation.filter(item => item.action !== 'hold').length === 0 && (
                <div className="p-8 text-center text-toss-grey-500">
                  현재 포트폴리오가 이미 최적화되어 있습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-toss-grey-100 rounded-3xl shadow-sm">
          <div className="p-6 border-b border-toss-grey-100 flex items-center gap-2">
            <History className="w-5 h-5 text-toss-grey-500" />
            <h4 className="font-bold text-toss-grey-900">추천 이력</h4>
          </div>
          <div className="divide-y divide-toss-grey-100">
            {history.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-toss-grey-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    item.strategy === 'aggressive' ? 'bg-red-50 text-toss-red' :
                    item.strategy === 'conservative' ? 'bg-green-50 text-green-600' :
                    item.strategy === 'equal_weight' ? 'bg-purple-50 text-purple-600' :
                    'bg-blue-50 text-toss-blue'
                  }`}>
                    {strategies.find(s => s.id === item.strategy)?.label || item.strategy}
                  </div>
                  <span className="text-sm text-toss-grey-600">
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  item.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                  item.status === 'applied' ? 'bg-green-50 text-green-600' :
                  'bg-toss-grey-100 text-toss-grey-500'
                }`}>
                  {item.status === 'pending' ? '대기' : item.status === 'applied' ? '적용됨' : '무시'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RebalanceRecommendationPage;
