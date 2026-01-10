/**
 * Language Selector Component
 */
import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@shared/i18n';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'buttons',
  showIcon = true,
  size = 'md',
}) => {
  const {
    currentLanguage,
    changeLanguage,
    supportedLanguages,
    languageLabels,
  } = useLanguage();

  if (variant === 'dropdown') {
    return (
      <div className="relative flex items-center gap-2">
        {showIcon && <Globe className="w-4 h-4 text-toss-grey-500" />}
        <select
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value as typeof currentLanguage)}
          className={`appearance-none bg-white border border-toss-grey-200 rounded-lg ${sizeClasses[size]} pr-8 font-medium text-toss-grey-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
        >
          {supportedLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {languageLabels[lang]}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-toss-grey-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showIcon && <Globe className="w-4 h-4 text-toss-grey-500" />}
      <div className="flex gap-1.5">
        {supportedLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => changeLanguage(lang)}
            className={`${sizeClasses[size]} font-medium rounded-lg transition-all ${
              currentLanguage === lang
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-toss-grey-100 text-toss-grey-600 hover:bg-toss-grey-200 hover:text-toss-grey-900'
            }`}
          >
            {languageLabels[lang]}
          </button>
        ))}
      </div>
    </div>
  );
};
