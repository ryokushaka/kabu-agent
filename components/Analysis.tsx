import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { MOCK_POSITIONS } from '../constants';
import { getSectorData, formatCurrency } from '../services/dataService';

const Analysis: React.FC = () => {
  const sectorData = getSectorData(MOCK_POSITIONS);
  
  // Transform data for profit chart
  const profitData = MOCK_POSITIONS.map(pos => ({
    ticker: pos.ticker,
    profit: (pos.currentPrice - pos.averagePrice) * pos.quantity,
  })).sort((a, b) => b.profit - a.profit);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Portfolio Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sector Allocation */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Sector Allocation</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`${value}%`, 'Weight']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {sectorData.map((sector) => (
              <div key={sector.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }}></div>
                <span className="text-slate-300 flex-1 truncate">{sector.name}</span>
                <span className="font-bold text-slate-100">{sector.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profit/Loss by Ticker */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Profit/Loss by Ticker</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={profitData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="ticker" 
                  type="category" 
                  stroke="#94a3b8" 
                  width={40}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value: number) => [formatCurrency(value), 'Profit/Loss']}
                />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                   {profitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analysis;