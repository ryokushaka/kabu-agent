/**
 * NISA Information Card Component
 * Displays a summary card about NISA for Japanese users
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, ChevronRight } from 'lucide-react';
import { useLanguage } from '@shared/i18n';

interface NisaInfoCardProps {
  onLearnMore?: () => void;
}

export const NisaInfoCard: React.FC<NisaInfoCardProps> = ({ onLearnMore }) => {
  const { t } = useTranslation('nisa');
  const { isJapanese } = useLanguage();

  // Only show for Japanese language users
  if (!isJapanese) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 p-2.5 rounded-xl">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-toss-grey-900 mb-1">
            {t('card.title')}
          </h3>
          <p className="text-sm text-toss-grey-600 mb-3">
            {t('card.subtitle')}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700">
              {t('limits.tsumitate.title')}: ¥120万/年
            </span>
            <span className="inline-flex items-center px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700">
              {t('limits.growth.title')}: ¥240万/年
            </span>
          </div>
          {onLearnMore && (
            <button
              onClick={onLearnMore}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('learnMore')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
