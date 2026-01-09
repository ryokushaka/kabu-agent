import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Position } from '../model/types';
import { formatCurrency, formatPercent } from '@shared/lib';

interface StockCardProps {
  position: Position;
  onClick?: (ticker: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ position, onClick }) => {
  const isPositive = position.profit_loss_percent >= 0;

  return (
    <div
      onClick={() => onClick?.(position.ticker)}
      className="bg-slate-800 rounded-xl p-4 hover:bg-slate-750 transition-colors cursor-pointer border border-slate-700 hover:border-slate-600"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white text-lg">{position.ticker}</h3>
          <p className="text-slate-400 text-sm truncate max-w-[150px]">{position.name}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white">{formatCurrency(position.current_price)}</p>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-sm">{formatPercent(position.profit_loss_percent)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">수량</p>
          <p className="text-white font-medium">{position.quantity}주</p>
        </div>
        <div>
          <p className="text-slate-500">평가금액</p>
          <p className="text-white font-medium">{formatCurrency(position.market_value)}</p>
        </div>
        <div>
          <p className="text-slate-500">평균단가</p>
          <p className="text-white font-medium">{formatCurrency(position.avg_price)}</p>
        </div>
        <div>
          <p className="text-slate-500">손익</p>
          <p className={`font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(position.profit_loss)}
          </p>
        </div>
      </div>

      {position.sector && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
            {position.sector}
          </span>
        </div>
      )}
    </div>
  );
};
