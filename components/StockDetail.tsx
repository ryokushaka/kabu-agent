import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  BarChart2,
  Newspaper,
  Brain,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import {
  getStockInfo,
  getStockChart,
  getStockNews,
  getStockAnalysis,
  getUserStockPosition,
  StockInfo,
  ChartDataPoint,
  StockNews,
  StockAnalysis,
  UserPosition
} from '../services/api';
import { formatCurrency, formatPercent } from '../services/dataService';

type ChartPeriod = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

const StockDetail: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [news, setNews] = useState<StockNews[]>([]);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [position, setPosition] = useState<UserPosition | null>(null);

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1M');
  const [activeTab, setActiveTab] = useState<'chart' | 'news' | 'analysis'>('chart');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!ticker) return;

    try {
      setLoading(true);
      setError(null);

      const [infoData, chartDataRes, newsData, analysisData, positionData] = await Promise.all([
        getStockInfo(ticker),
        getStockChart(ticker, chartPeriod),
        getStockNews(ticker),
        getStockAnalysis(ticker),
        getUserStockPosition(ticker)
      ]);

      setStockInfo(infoData);
      setChartData(chartDataRes);
      setNews(newsData);
      setAnalysis(analysisData);
      setPosition(positionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [ticker]);

  useEffect(() => {
    if (ticker && !loading) {
      getStockChart(ticker, chartPeriod).then(setChartData).catch(console.error);
    }
  }, [chartPeriod]);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy':
      case 'buy':
        return 'text-toss-red bg-red-50 border-red-100';
      case 'sell':
      case 'strong_sell':
        return 'text-toss-blue bg-blue-50 border-blue-100';
      default:
        return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  const getRecommendationText = (rec: string) => {
    const map: Record<string, string> = {
      strong_buy: '적극 매수',
      buy: '매수',
      hold: '보유',
      sell: '매도',
      strong_sell: '적극 매도'
    };
    return map[rec] || rec;
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-toss-red" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-toss-blue" />;
      default:
        return <Clock className="w-4 h-4 text-toss-grey-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-toss-grey-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-toss-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-toss-grey-900 mb-1">종목 정보를 불러오는 중...</h3>
          <p className="text-sm text-toss-grey-500">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (error || !stockInfo) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 max-w-md shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <h3 className="text-lg font-bold text-toss-grey-900 mb-2">종목 정보를 불러올 수 없습니다</h3>
            <p className="text-toss-red mb-6 text-sm">{error || '알 수 없는 오류'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 bg-white border border-toss-grey-200 text-toss-grey-700 rounded-xl hover:bg-toss-grey-50 transition-colors"
              >
                뒤로가기
              </button>
              <button
                onClick={fetchAllData}
                className="px-4 py-2.5 bg-toss-blue text-white rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={16} />
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = stockInfo.change >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-toss-grey-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-toss-grey-700" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-toss-grey-100 flex items-center justify-center text-lg font-bold text-toss-grey-600">
              {stockInfo.ticker[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-toss-grey-900">{stockInfo.ticker}</h1>
              <p className="text-sm text-toss-grey-500">{stockInfo.name} · {stockInfo.exchange}</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchAllData}
          className="p-2.5 hover:bg-toss-grey-100 rounded-xl transition-colors"
          title="새로고침"
        >
          <RefreshCw className="w-5 h-5 text-toss-grey-500" />
        </button>
      </div>

      {/* Price Section */}
      <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <span className="text-4xl font-bold text-toss-grey-900">
            {formatCurrency(stockInfo.current_price)}
          </span>
          <div className={`flex items-center gap-2 text-lg font-semibold ${isPositive ? 'text-toss-red' : 'text-toss-blue'}`}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span>{isPositive ? '+' : ''}{formatCurrency(stockInfo.change)}</span>
            <span>({isPositive ? '+' : ''}{formatPercent(stockInfo.change_percent)})</span>
          </div>
        </div>

        {/* Stock Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-toss-grey-100">
          {stockInfo.high_52w && (
            <div>
              <div className="text-xs text-toss-grey-500">52주 최고</div>
              <div className="font-semibold text-toss-grey-900">{formatCurrency(stockInfo.high_52w)}</div>
            </div>
          )}
          {stockInfo.low_52w && (
            <div>
              <div className="text-xs text-toss-grey-500">52주 최저</div>
              <div className="font-semibold text-toss-grey-900">{formatCurrency(stockInfo.low_52w)}</div>
            </div>
          )}
          {stockInfo.pe_ratio && (
            <div>
              <div className="text-xs text-toss-grey-500">PER</div>
              <div className="font-semibold text-toss-grey-900">{stockInfo.pe_ratio.toFixed(2)}</div>
            </div>
          )}
          {stockInfo.dividend_yield && (
            <div>
              <div className="text-xs text-toss-grey-500">배당률</div>
              <div className="font-semibold text-toss-grey-900">{stockInfo.dividend_yield.toFixed(2)}%</div>
            </div>
          )}
          {stockInfo.volume && (
            <div>
              <div className="text-xs text-toss-grey-500">거래량</div>
              <div className="font-semibold text-toss-grey-900">{stockInfo.volume.toLocaleString()}</div>
            </div>
          )}
          {stockInfo.market_cap && (
            <div>
              <div className="text-xs text-toss-grey-500">시가총액</div>
              <div className="font-semibold text-toss-grey-900">
                ${(stockInfo.market_cap / 1e9).toFixed(1)}B
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Position */}
      {position && (
        <div className="bg-gradient-to-r from-toss-blue/5 to-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-toss-blue" />
            <h3 className="font-bold text-toss-grey-900">내 보유 현황</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-toss-grey-500">보유수량</div>
              <div className="font-bold text-toss-grey-900">{position.quantity}주</div>
            </div>
            <div>
              <div className="text-xs text-toss-grey-500">평균단가</div>
              <div className="font-semibold text-toss-grey-900">{formatCurrency(position.avg_price)}</div>
            </div>
            <div>
              <div className="text-xs text-toss-grey-500">평가금액</div>
              <div className="font-bold text-toss-grey-900">{formatCurrency(position.market_value)}</div>
            </div>
            <div>
              <div className="text-xs text-toss-grey-500">수익률</div>
              <div className={`font-bold ${position.profit_loss_percent >= 0 ? 'text-toss-red' : 'text-toss-blue'}`}>
                {position.profit_loss_percent >= 0 ? '+' : ''}{formatPercent(position.profit_loss_percent)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-toss-grey-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex border-b border-toss-grey-100">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'chart'
                ? 'text-toss-blue border-b-2 border-toss-blue bg-blue-50/50'
                : 'text-toss-grey-500 hover:text-toss-grey-700'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            차트
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'news'
                ? 'text-toss-blue border-b-2 border-toss-blue bg-blue-50/50'
                : 'text-toss-grey-500 hover:text-toss-grey-700'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            뉴스
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'analysis'
                ? 'text-toss-blue border-b-2 border-toss-blue bg-blue-50/50'
                : 'text-toss-grey-500 hover:text-toss-grey-700'
            }`}
          >
            <Brain className="w-4 h-4" />
            AI 분석
          </button>
        </div>

        <div className="p-6">
          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div>
              {/* Period Selector */}
              <div className="flex gap-2 mb-4">
                {(['1W', '1M', '3M', '6M', '1Y', '5Y'] as ChartPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      chartPeriod === period
                        ? 'bg-toss-blue text-white'
                        : 'bg-toss-grey-100 text-toss-grey-600 hover:bg-toss-grey-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Price Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3182f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3182f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#8b95a1' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis
                      yAxisId="price"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#8b95a1' }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      yAxisId="volume"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={false}
                      domain={[0, 'dataMax']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e8eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'volume') return [value.toLocaleString(), '거래량'];
                        return [`$${value.toFixed(2)}`, name === 'close' ? '종가' : name];
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('ko-KR')}
                    />
                    <Bar
                      yAxisId="volume"
                      dataKey="volume"
                      fill="#e5e8eb"
                      opacity={0.5}
                    />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="close"
                      stroke="#3182f6"
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              {news.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="w-12 h-12 text-toss-grey-300 mx-auto mb-4" />
                  <p className="text-toss-grey-500">관련 뉴스가 없습니다</p>
                </div>
              ) : (
                news.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-toss-grey-50 rounded-2xl hover:bg-toss-grey-100 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getSentimentIcon(item.sentiment)}
                          <span className="text-xs text-toss-grey-500">{item.source}</span>
                          <span className="text-xs text-toss-grey-400">
                            {new Date(item.published_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-toss-grey-900 mb-1 line-clamp-2 group-hover:text-toss-blue transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-toss-grey-500 line-clamp-2">{item.summary}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-toss-grey-400 flex-shrink-0 mt-1 group-hover:text-toss-blue transition-colors" />
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && analysis && (
            <div className="space-y-6">
              {/* Recommendation */}
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl font-bold text-lg border ${getRecommendationColor(analysis.recommendation)}`}>
                  {getRecommendationText(analysis.recommendation)}
                </div>
                {analysis.target_price && (
                  <div className="text-toss-grey-700">
                    목표가: <span className="font-bold">{formatCurrency(analysis.target_price)}</span>
                  </div>
                )}
                <div className="text-sm text-toss-grey-500">
                  신뢰도: {Math.round(analysis.confidence * 100)}%
                </div>
              </div>

              {/* Summary */}
              <div className="bg-toss-grey-50 rounded-2xl p-5">
                <h4 className="font-bold text-toss-grey-900 mb-2">분석 요약</h4>
                <p className="text-toss-grey-700 leading-relaxed">{analysis.analysis_summary}</p>
              </div>

              {/* Key Factors & Risks */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-800">핵심 요인</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.key_factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">+</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-amber-800">리스크 요인</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">!</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-toss-grey-400 text-right">
                마지막 업데이트: {new Date(analysis.updated_at).toLocaleString('ko-KR')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
