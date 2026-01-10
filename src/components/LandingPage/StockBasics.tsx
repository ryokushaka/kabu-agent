import React, { useState } from 'react';
import { BookOpen, PieChart, Coins, Layers, Scale, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GlossaryModal } from '../../../components/common';

const StockBasics: React.FC = () => {
  const { t } = useTranslation('landing');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  const basics = [
    {
      Icon: PieChart,
      key: 'stock',
    },
    {
      Icon: Coins,
      key: 'dividend',
    },
    {
      Icon: Layers,
      key: 'etf',
    },
    {
      Icon: Scale,
      key: 'per',
    }
  ];

  return (
    <section className="py-24 bg-white border-t border-toss-grey-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16">
          <div className="max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-toss-blue text-sm font-semibold mb-4">
              <BookOpen size={16} />
              <span>{t('stockBasics.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-toss-grey-900 mb-4 leading-tight">
              {t('stockBasics.title')}<br />
              <span className="text-toss-blue">{t('stockBasics.titleHighlight')}</span>{t('stockBasics.titleSuffix')}
            </h2>
            <p className="text-toss-grey-500 text-lg">
              {t('stockBasics.subtitle')}
            </p>
          </div>

           <button
            onClick={() => setIsGlossaryOpen(true)}
            className="hidden md:flex items-center gap-2 text-toss-grey-600 font-bold hover:text-toss-blue transition-colors mt-6 md:mt-0 group"
          >
            {t('stockBasics.viewGuide')}
            <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {basics.map((item, index) => (
            <div key={index} className="group relative bg-white rounded-3xl p-8 border border-toss-grey-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <item.Icon className="w-32 h-32 -mr-12 -mt-12 text-toss-grey-50 opacity-50" />
              </div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-50/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-toss-blue transition-colors duration-300">
                  <item.Icon className="w-7 h-7 text-toss-blue group-hover:text-white transition-colors duration-300" />
                </div>
                
                <h3 className="text-xl font-bold text-toss-grey-900 mb-1">{t(`stockBasics.terms.${item.key}.title`)}</h3>
                <p className="text-sm font-semibold text-toss-blue mb-4">{t(`stockBasics.terms.${item.key}.subtitle`)}</p>

                <p className="text-toss-grey-600 leading-relaxed text-sm">
                  {t(`stockBasics.terms.${item.key}.description`)}
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
