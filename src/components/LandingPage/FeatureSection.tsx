import React from 'react';
import { BarChart3, Globe, ShieldCheck } from 'lucide-react';
import { Feature } from './types';

const features: Feature[] = [
  {
    icon: <BarChart3 size={32} className="text-toss-blue" />,
    title: "직관적인 자산 현황",
    description: "흩어진 내 자산을 한곳에서.\n실시간 수익률과 포트폴리오 구성을\n아름다운 차트로 확인하세요."
  },
  {
    icon: <Globe size={32} className="text-toss-blue" />,
    title: "AI 뉴스 브리핑",
    description: "매일 쏟아지는 미국 주식 뉴스,\nAI가 핵심만 뽑아 한국어로\n요약해 드립니다."
  },
  {
    icon: <ShieldCheck size={32} className="text-toss-blue" />,
    title: "안전한 투자 관리",
    description: "한국투자증권 공식 API 연동으로\n안전하게 자산을 조회하고\n체계적으로 관리하세요."
  }
];

const FeatureSection: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-blue-50/50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-100/50 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-toss-grey-900 mb-4">{feature.title}</h3>
              <p className="text-toss-grey-600 leading-relaxed whitespace-pre-line">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
