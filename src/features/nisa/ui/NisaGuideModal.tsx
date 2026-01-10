/**
 * NISA Guide Modal Component
 * Comprehensive guide about the Japanese NISA system
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Info,
  Infinity,
  RefreshCw,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { NISA_LIMITS } from '../model/nisaConstants';

interface NisaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatJPY = (value: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);
};

export const NisaGuideModal: React.FC<NisaGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('nisa');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const featureIcons = {
    unlimited: Infinity,
    reusable: RefreshCw,
    combined: Layers,
  };

  const faqItems = t('faq.items', { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-toss-grey-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-toss-grey-900">
                {t('title')}
              </h2>
              <p className="text-sm text-toss-grey-500">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-toss-grey-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-toss-grey-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Description */}
          <p className="text-toss-grey-700 leading-relaxed">{t('description')}</p>

          {/* Limits Section */}
          <section>
            <h3 className="text-lg font-bold text-toss-grey-900 mb-4">
              {t('limits.title')}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tsumitate */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-1">
                  {t('limits.tsumitate.title')}
                </h4>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  {t('limits.tsumitate.annual')}
                </p>
                <p className="text-sm text-blue-700">
                  {t('limits.tsumitate.description')}
                </p>
              </div>

              {/* Growth */}
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-1">
                  {t('limits.growth.title')}
                </h4>
                <p className="text-2xl font-bold text-indigo-600 mb-2">
                  {t('limits.growth.annual')}
                </p>
                <p className="text-sm text-indigo-700">
                  {t('limits.growth.description')}
                </p>
              </div>
            </div>

            {/* Lifetime Limit */}
            <div className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-4 text-white">
              <h4 className="font-bold mb-1">{t('limits.lifetime.title')}</h4>
              <p className="text-3xl font-bold mb-1">{t('limits.lifetime.amount')}</p>
              <p className="text-sm text-blue-100">
                {t('limits.lifetime.description')}
              </p>
            </div>
          </section>

          {/* Features Section */}
          <section>
            <h3 className="text-lg font-bold text-toss-grey-900 mb-4">
              {t('features.title')}
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {(['unlimited', 'reusable', 'combined'] as const).map((feature) => {
                const Icon = featureIcons[feature];
                return (
                  <div
                    key={feature}
                    className="bg-white border border-toss-grey-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                  >
                    <Icon className="w-8 h-8 text-blue-500 mb-3" />
                    <h4 className="font-bold text-toss-grey-900 mb-1">
                      {t(`features.${feature}.title`)}
                    </h4>
                    <p className="text-sm text-toss-grey-600">
                      {t(`features.${feature}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <h3 className="text-lg font-bold text-toss-grey-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-toss-grey-500" />
              {t('faq.title')}
            </h3>
            <div className="space-y-2">
              {Array.isArray(faqItems) &&
                faqItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-toss-grey-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-toss-grey-50 transition-colors"
                    >
                      <span className="font-medium text-toss-grey-900">
                        {item.question}
                      </span>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-toss-grey-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-toss-grey-400" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-4 pb-4 text-sm text-toss-grey-600 border-t border-toss-grey-100 pt-3">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>

          {/* Disclaimer */}
          <p className="text-xs text-toss-grey-500 text-center">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};
