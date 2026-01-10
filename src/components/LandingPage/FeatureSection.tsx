import React from 'react';
import { BarChart3, Globe, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeatureKey {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

const featureKeys: FeatureKey[] = [
  {
    icon: <BarChart3 size={32} className="text-toss-blue" />,
    titleKey: 'features.asset.title',
    descriptionKey: 'features.asset.description'
  },
  {
    icon: <Globe size={32} className="text-toss-blue" />,
    titleKey: 'features.news.title',
    descriptionKey: 'features.news.description'
  },
  {
    icon: <ShieldCheck size={32} className="text-toss-blue" />,
    titleKey: 'features.security.title',
    descriptionKey: 'features.security.description'
  }
];

const FeatureSection: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {featureKeys.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-blue-50/50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-100/50 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-toss-grey-900 mb-4">{t(feature.titleKey)}</h3>
              <p className="text-toss-grey-600 leading-relaxed whitespace-pre-line">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
