import React, { useState } from 'react';
import { BookOpen, PieChart, Coins, Layers, Scale, ArrowUpRight } from 'lucide-react';
import { GlossaryModal } from '../../../components/common';

const basics = [
  {
    Icon: PieChart,
    title: "주식 (Stock)",
    subtitle: "회사의 주인 되기",
    description: "주식은 회사의 소유권입니다. 주주가 되면 회사의 성장과 이익을 함께 나눌 수 있습니다."
  },
  {
    Icon: Coins,
    title: "배당금 (Dividend)",
    subtitle: "보너스 같은 수익",
    description: "회사가 번 돈의 일부를 주주에게 나눠주는 것입니다. 정기적인 현금 흐름을 만들 수 있죠."
  },
  {
    Icon: Layers,
    title: "ETF",
    subtitle: "종합 선물 세트",
    description: "여러 기업을 한 바구니에 담은 상품입니다. 하나만 사도 분산 투자 효과가 있어 안전합니다."
  },
  {
    Icon: Scale,
    title: "PER",
    subtitle: "가격 적정성 판단",
    description: "현재 주가가 이익 대비 싼지 비싼지를 보여주는 지표입니다. 낮을수록 저평가된 경우가 많습니다."
  }
];

const StockBasics: React.FC = () => {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16">
          <div className="max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-4">
              <BookOpen size={16} />
              <span>초보자 가이드</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
              투자가 처음이신가요?<br />
              <span className="text-blue-600">핵심 용어</span>부터 시작해보세요.
            </h2>
            <p className="text-slate-500 text-lg">
              어렵게 느껴지는 주식 용어, Kabu Agent가 알기 쉽게 설명해 드립니다.
            </p>
          </div>

           <button
            onClick={() => setIsGlossaryOpen(true)}
            className="hidden md:flex items-center gap-2 text-slate-600 font-bold hover:text-blue-600 transition-colors mt-6 md:mt-0 group"
          >
            전체 가이드 보기
            <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {basics.map((item, index) => (
            <div key={index} className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <item.Icon className="w-32 h-32 -mr-12 -mt-12 text-slate-50 opacity-50" />
              </div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <item.Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm font-semibold text-blue-600 mb-4">{item.subtitle}</p>
                
                <p className="text-slate-500 leading-relaxed text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Glossary Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </section>
  );
};

export default StockBasics;
