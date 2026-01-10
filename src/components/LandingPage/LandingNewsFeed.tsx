import React from 'react';
import { ChevronRight, Sparkles, ExternalLink, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { MarketNews } from '../../services/publicService';

interface LandingNewsFeedProps {
  news: MarketNews | null;
  loading: boolean;
}

const formatRelativeTime = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return locale === 'ko' ? '방금 전' : locale === 'ja' ? 'たった今' : 'Just now';
  }
  if (diffMins < 60) {
    return locale === 'ko' ? `${diffMins}분 전` : locale === 'ja' ? `${diffMins}分前` : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return locale === 'ko' ? `${diffHours}시간 전` : locale === 'ja' ? `${diffHours}時間前` : `${diffHours}h ago`;
  }
  return locale === 'ko' ? `${diffDays}일 전` : locale === 'ja' ? `${diffDays}日前` : `${diffDays}d ago`;
};

const LandingNewsFeed: React.FC<LandingNewsFeedProps> = ({ news, loading }) => {
  const { t, i18n } = useTranslation('landing');
  const currentLang = i18n.language?.split('-')[0] || 'ko';

  return (
    <section className="py-24 bg-toss-grey-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-toss-grey-900 mb-3">{t('news.title')}</h2>
          <p className="text-toss-grey-500">{t('news.subtitle')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>

          {loading ? (
             <div className="relative z-10 animate-pulse space-y-4">
                 <div className="h-6 bg-toss-grey-100 rounded w-1/3 mb-8"></div>
                 <div className="h-4 bg-toss-grey-100 rounded w-full"></div>
                 <div className="h-4 bg-toss-grey-100 rounded w-full"></div>
                 <div className="h-4 bg-toss-grey-100 rounded w-3/4"></div>
             </div>
          ) : (
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8 border-b border-toss-grey-100 pb-4">
                <Sparkles className="text-toss-blue" size={20} />
                <span className="font-bold text-toss-grey-800">{t('news.aiReport')}</span>
              </div>

              <div className="prose prose-blue max-w-none prose-headings:text-toss-grey-900 prose-p:text-toss-grey-700 prose-strong:text-toss-grey-800 prose-li:text-toss-grey-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                 {news ? (
                   <ReactMarkdown
                     components={{
                       h3: ({ children }) => <h3 className="text-xl font-bold text-toss-grey-900 mb-4 mt-6">{children}</h3>,
                       ul: ({ children }) => <ul className="space-y-3 list-none pl-0">{children}</ul>,
                       li: ({ children }) => <li className="text-toss-grey-700 leading-relaxed">{children}</li>,
                       strong: ({ children }) => <strong className="font-bold text-toss-grey-800">{children}</strong>,
                       em: ({ children }) => <em className="text-toss-grey-500 text-sm not-italic">{children}</em>,
                       p: ({ children }) => <p className="text-toss-grey-700 leading-relaxed mb-3">{children}</p>,
                       a: ({ href, children }) => (
                         <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                           {children}
                         </a>
                       ),
                     }}
                   >
                     {news.summary}
                   </ReactMarkdown>
                 ) : (
                   <div className="text-center text-toss-grey-500 py-8">
                      {t('news.noNews')}
                   </div>
                 )}
              </div>

              {/* Individual News Items */}
              {news?.news && news.news.length > 0 && (
                <div className="mt-8 pt-6 border-t border-toss-grey-100">
                  <div className="space-y-4">
                    {news.news.slice(0, 3).map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-xl hover:bg-toss-grey-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-toss-grey-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                              {item.title}
                            </h4>
                            <p className="text-sm text-toss-grey-500 line-clamp-2">{item.summary}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-toss-grey-400">
                              <span className="font-medium">{t('news.source')}: {item.source}</span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatRelativeTime(item.published_at, currentLang)}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-toss-grey-400 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-toss-grey-100 flex justify-center">
                <button className="text-toss-blue font-bold hover:text-blue-600 flex items-center gap-1 transition-colors">
                  {t('news.readMore')} <ChevronRight size={18} />
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
