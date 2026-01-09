import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import type { StockNews } from '../model/types';
import { formatDateTime } from '@shared/lib';

interface NewsCardProps {
  news: StockNews;
}

const sentimentColors = {
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-rose-100 text-rose-700',
  neutral: 'bg-slate-100 text-slate-700',
};

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl p-5 hover:shadow-lg transition-shadow border border-slate-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {news.title}
        </h3>
        <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-blue-600" />
      </div>

      <p className="text-slate-600 text-sm line-clamp-2 mb-4">{news.summary}</p>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{news.source}</span>
          {news.sentiment && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentimentColors[news.sentiment]}`}>
              {news.sentiment === 'positive' ? '긍정' : news.sentiment === 'negative' ? '부정' : '중립'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{formatDateTime(news.published_at)}</span>
        </div>
      </div>
    </a>
  );
};
