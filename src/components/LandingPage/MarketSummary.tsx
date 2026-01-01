import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { StockIndex } from './types';
import { MarketIndices } from '../../services/publicService';

// Keep mock data for backup and charts
const mockIndices: StockIndex[] = [
  {
    name: 'NASDAQ',
    value: '14,893.21',
    change: '-112.50',
    changePercent: '-0.76%',
    isPositive: false,
    chartData: [15000, 14950, 14980, 14900, 14920, 14890, 14893]
  },
  {
    name: 'S&P 500',
    value: '4,769.83',
    change: '-34.20',
    changePercent: '-0.74%',
    isPositive: false,
    chartData: [4800, 4790, 4785, 4780, 4775, 4770, 4769]
  },
  {
    name: 'Dow Jones',
    value: '37,450.10',
    change: '+15.30',
    changePercent: '+0.04%',
    isPositive: true,
    chartData: [37400, 37410, 37420, 37440, 37430, 37445, 37450]
  }
];

interface MarketSummaryProps {
  indices: MarketIndices;
  loading: boolean;
}

const MarketSummary: React.FC<MarketSummaryProps> = ({ indices, loading }) => {
  // Merge real data with mock chart data
  const displayIndices = mockIndices.map(mock => {
    // API keys might differ marginally, assuming standard naming "NASDAQ", "S&P 500", "Dow Jones" matches or needs mapping.
    // The previous PublicDashboard code used keys 'NASDAQ', 'S&P 500', 'Dow Jones'.
    const realData = indices[mock.name];
    if (realData) {
      const change = parseFloat(realData.change);
      return {
        ...mock,
        value: parseFloat(realData.price).toLocaleString(),
        change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
        changePercent: `${change >= 0 ? '+' : ''}${parseFloat(realData.change_percent).toFixed(2)}%`,
        isPositive: change >= 0,
        // Keep mock chart data as real historical data isn't available in this endpoint
      };
    }
    return mock;
  });

  if (loading) {
    return (
      <section className="relative z-30 -mt-24 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 h-48 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-20 mb-4"></div>
                <div className="h-8 bg-slate-100 rounded w-32 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-30 -mt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayIndices.map((index) => (
            <div key={index.name} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between h-48 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider">{index.name}</h3>
                <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                  {index.value}
                </div>
                <div className={`flex items-center gap-2 font-bold text-sm ${index.isPositive ? 'text-red-500' : 'text-blue-600'}`}>
                  <span>{index.change}</span>
                  <span className="bg-opacity-10 px-2 py-0.5 rounded-md bg-current">
                    {index.changePercent}
                  </span>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30 group-hover:opacity-50 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={index.chartData.map(val => ({ val }))}>
                    <defs>
                      <linearGradient id={`color${index.name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={index.isPositive ? '#ef4444' : '#2563eb'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={index.isPositive ? '#ef4444' : '#2563eb'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Area 
                      type="monotone" 
                      dataKey="val" 
                      stroke={index.isPositive ? '#ef4444' : '#2563eb'} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill={`url(#color${index.name})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketSummary;
