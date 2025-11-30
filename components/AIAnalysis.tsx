import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { getAIAnalysis } from '../services/api';

const AIAnalysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAIAnalysis();
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown rendering helper
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-toss-grey-900 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold text-toss-grey-900 mt-6 mb-3 border-b border-toss-grey-200 pb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-toss-grey-900 mt-6 mb-4">{line.replace('# ', '')}</h1>;
      }
      
      // List items
      if (line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return (
          <li key={index} className="ml-4 list-disc text-toss-grey-700 mb-1">
            {parseBold(content)}
          </li>
        );
      }
      
      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
         const content = line.trim().replace(/^\d+\.\s/, '');
         return (
             <div key={index} className="flex gap-2 mb-2">
                 <span className="font-bold text-toss-blue min-w-[20px]">{line.trim().match(/^\d+\./)?.[0]}</span>
                 <span className="text-toss-grey-700">{parseBold(content)}</span>
             </div>
         )
      }

      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2"></div>;
      }

      // Paragraphs
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
    <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm mt-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-toss-grey-900">AI 포트폴리오 진단</h2>
            <p className="text-toss-grey-500 text-sm">Gemini가 분석한 맞춤형 투자 리포트</p>
          </div>
        </div>
        
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 분석 시작하기</span>
          </button>
        )}
        
        {analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 px-4 py-2 bg-toss-grey-50 hover:bg-toss-grey-100 text-toss-grey-700 rounded-xl transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 분석</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
             <div className="absolute inset-0 border-4 border-toss-grey-100 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div>
            <p className="text-lg font-bold text-toss-grey-900">AI가 포트폴리오를 분석 중입니다...</p>
            <p className="text-toss-grey-500 text-sm mt-1">약 5-10초 정도 소요될 수 있습니다.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-toss-red mx-auto mb-3" />
          <p className="text-toss-red font-medium mb-2">분석 중 오류가 발생했습니다</p>
          <p className="text-toss-grey-600 text-sm mb-4">{error}</p>
          <button
            onClick={handleAnalyze}
            className="px-4 py-2 bg-white border border-red-200 text-toss-red rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      )}

      {analysis && !loading && (
        <div className="bg-toss-grey-50 rounded-2xl p-6 md:p-8 animate-fade-in">
          <div className="prose prose-indigo max-w-none">
            {renderMarkdown(analysis)}
          </div>
          <div className="mt-6 pt-4 border-t border-toss-grey-200 flex items-center gap-2 text-xs text-toss-grey-400 justify-center">
            <Sparkles className="w-3 h-3" />
            <span>Generated by Google Gemini Pro</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
