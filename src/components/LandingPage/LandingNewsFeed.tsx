import React from 'react';
import { Newspaper, ChevronRight, Sparkles } from 'lucide-react';
import { MarketNews } from '../../services/publicService';

interface LandingNewsFeedProps {
  news: MarketNews | null;
  loading: boolean;
}

const LandingNewsFeed: React.FC<LandingNewsFeedProps> = ({ news, loading }) => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">오늘의 주요 시장 뉴스</h2>
          <p className="text-slate-500">Kabu Agent AI가 실시간으로 분석한 시장 동향입니다.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
          
          {loading ? (
             <div className="relative z-10 animate-pulse space-y-4">
                 <div className="h-6 bg-slate-100 rounded w-1/3 mb-8"></div>
                 <div className="h-4 bg-slate-100 rounded w-full"></div>
                 <div className="h-4 bg-slate-100 rounded w-full"></div>
                 <div className="h-4 bg-slate-100 rounded w-3/4"></div>
             </div>
          ) : (
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
                <Sparkles className="text-blue-600" size={20} />
                <span className="font-bold text-slate-700">AI 요약 리포트</span>
              </div>

              <div className="prose prose-blue max-w-none">
                 {news ? (
                   <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                      {news.summary}
                   </div>
                 ) : (
                   <div className="text-center text-slate-500 py-8">
                      뉴스를 불러올 수 없습니다.
                   </div>
                 )}
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-center">
                <button className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1 transition-colors">
                  더 많은 뉴스 보기 <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LandingNewsFeed;
