import React, { useState, useEffect } from 'react';
import { Newspaper, Search, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAINews } from '../services/api';

interface NewsSource {
  title: string;
  link: string;
  source: string;
}

const NewsFeed: React.FC = () => {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState(t('newsFeed.defaultQuery'));
  const [summary, setSummary] = useState<string | null>(null);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAINews(query);
      setSummary(result.summary);
      setSources(result.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.general'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNews();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews();
  };

  // Simple Markdown rendering helper (reused from AIAnalysis)
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-toss-grey-900 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold text-toss-grey-900 mt-6 mb-3 border-b border-toss-grey-200 pb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.trim().startsWith('- ')) {
        return <li key={index} className="ml-4 list-disc text-toss-grey-700 mb-1">{parseBold(line.trim().substring(2))}</li>;
      }
      if (/^\d+\.\s/.test(line.trim())) {
         return (
             <div key={index} className="flex gap-2 mb-2">
                 <span className="font-bold text-toss-blue min-w-[20px]">{line.trim().match(/^\d+\./)?.[0]}</span>
                 <span className="text-toss-grey-700">{parseBold(line.trim().replace(/^\d+\.\s/, ''))}</span>
             </div>
         )
      }
      if (line.trim() === '') return <div key={index} className="h-2"></div>;
      return <p key={index} className="text-toss-grey-700 mb-2 leading-relaxed">{parseBold(line)}</p>;
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-toss-grey-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-xl">
            <Newspaper className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-toss-grey-900">{t('newsFeed.title')}</h2>
            <p className="text-toss-grey-500 text-sm">{t('newsFeed.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('labels.search')}
          className="w-full bg-toss-grey-50 border border-toss-grey-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 transition-all"
        />
        <Search className="w-5 h-5 text-toss-grey-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg shadow-sm border border-toss-grey-100 hover:bg-toss-grey-50 text-toss-grey-600 disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-toss-grey-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-toss-red mx-auto mb-3" />
          <p className="text-toss-red font-medium mb-2">
            {error.includes('authenticated') || error.includes('401') ? t('errors.unauthorized') : t('errors.general')}
          </p>
          <p className="text-toss-grey-600 text-sm mb-4">
            {error.includes('authenticated') || error.includes('401')
              ? t('errors.serverError')
              : error}
          </p>
          {(error.includes('authenticated') || error.includes('401')) && (
            <a href="/#/login" className="inline-block px-4 py-2 bg-toss-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
              {t('buttons.login')}
            </a>
          )}
        </div>
      ) : loading && !summary ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-toss-grey-100 rounded w-3/4"></div>
            <div className="h-4 bg-toss-grey-100 rounded w-1/2"></div>
            <div className="h-32 bg-toss-grey-50 rounded-xl mt-4"></div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* AI Summary */}
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(summary)}
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="pt-4 border-t border-toss-grey-100">
                <h3 className="text-sm font-bold text-toss-grey-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {t('newsFeed.source')}
                </h3>
                <div className="space-y-2">
                  {sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-xl transition-colors group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm text-toss-grey-800 font-medium line-clamp-1 group-hover:text-toss-blue transition-colors">
                          {source.title}
                        </span>
                        <span className="text-xs text-toss-grey-400 whitespace-nowrap shrink-0">
                          {source.source}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-toss-grey-400">
            {t('newsFeed.noNews')}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
