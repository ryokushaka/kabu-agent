/**
 * Investment Glossary Modal Component
 */
import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, TrendingUp, Filter, ChevronRight } from 'lucide-react';
import { LoadingSpinner, ErrorDisplay } from '@shared/ui';
import { glossaryApi } from '../api/glossaryApi';
import type { GlossaryTerm } from '@shared/types';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { value: 'all', label: '전체', icon: BookOpen },
  { value: 'risk', label: '리스크', icon: TrendingUp },
  { value: 'returns', label: '수익률', icon: TrendingUp },
  { value: 'sector', label: '섹터', icon: TrendingUp },
  { value: 'market', label: '시장 지표', icon: TrendingUp },
  { value: 'investment', label: '거래/투자', icon: TrendingUp },
];

const difficulties = [
  { value: 'all', label: '전체' },
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const categoryColors = {
  risk: 'bg-red-50 text-red-600',
  returns: 'bg-blue-50 text-blue-600',
  sector: 'bg-purple-50 text-purple-600',
  market: 'bg-orange-50 text-orange-600',
  investment: 'bg-emerald-50 text-emerald-600',
};

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTerms();
    }
  }, [isOpen, selectedCategory, selectedDifficulty, searchQuery]);

  const fetchTerms = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await glossaryApi.getTerms({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setTerms(data);
    } catch (err) {
      console.error('Failed to fetch glossary terms:', err);
      setError(err instanceof Error ? err.message : '용어를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTermClick = async (term: GlossaryTerm) => {
    try {
      const detailedTerm = await glossaryApi.getTermDetail(term.id);
      setSelectedTerm(detailedTerm);
    } catch {
      setSelectedTerm(term);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">투자 용어 가이드</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-6 border-b border-slate-200 space-y-4 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="용어 검색... (예: 변동성, 수익률, PER)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-600 mr-2">카테고리:</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg whitespace-nowrap font-semibold text-sm transition-all ${
                      selectedCategory === cat.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 mr-2">난이도:</span>
            <div className="flex gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setSelectedDifficulty(diff.value)}
                  className={`px-4 py-1.5 text-sm rounded-full font-semibold transition-all ${
                    selectedDifficulty === diff.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Terms List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <LoadingSpinner message="용어를 불러오는 중..." />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : terms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">검색 결과가 없습니다.</p>
              <p className="text-slate-400 text-sm mt-2">다른 검색어나 필터를 시도해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {terms.map((term) => (
                <div
                  key={term.id}
                  onClick={() => handleTermClick(term)}
                  className="group p-5 border border-slate-200 rounded-xl hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all duration-200 bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                        {term.term_ko}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">{term.term_en}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-3 mb-3 leading-relaxed">
                    {term.definition}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${categoryColors[term.category as keyof typeof categoryColors] || 'bg-slate-100 text-slate-600'}`}>
                      {term.category}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${difficultyColors[term.difficulty_level as keyof typeof difficultyColors] || 'bg-slate-100 text-slate-600'}`}>
                      {term.difficulty_level}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">
                      조회 {term.view_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Term Detail Modal */}
        {selectedTerm && (
          <div className="absolute inset-0 bg-white z-10 overflow-auto rounded-2xl">
            <div className="p-6">
              <button
                onClick={() => setSelectedTerm(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                목록으로 돌아가기
              </button>

              <div className="max-w-3xl">
                <div className="mb-6">
                  <h2 className="text-4xl font-black text-slate-900 mb-2">
                    {selectedTerm.term_ko}
                  </h2>
                  <p className="text-xl text-slate-600 font-semibold">
                    {selectedTerm.term_en}
                  </p>

                  <div className="flex items-center gap-2 mt-4">
                    <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${categoryColors[selectedTerm.category as keyof typeof categoryColors] || 'bg-slate-100 text-slate-600'}`}>
                      {selectedTerm.category}
                    </span>
                    <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${difficultyColors[selectedTerm.difficulty_level as keyof typeof difficultyColors] || 'bg-slate-100 text-slate-600'}`}>
                      {selectedTerm.difficulty_level}
                    </span>
                    <span className="text-sm text-slate-400 ml-auto">
                      조회수 {selectedTerm.view_count.toLocaleString()}회
                    </span>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 mt-0">정의</h3>
                    <p className="text-slate-700 leading-relaxed mb-0">
                      {selectedTerm.definition}
                    </p>
                  </div>

                  {selectedTerm.example && (
                    <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-xl">
                      <h3 className="text-lg font-bold text-slate-900 mb-3 mt-0">예시</h3>
                      <p className="text-slate-700 leading-relaxed mb-0">
                        {selectedTerm.example}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
