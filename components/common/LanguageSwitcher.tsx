import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../src/shared/i18n/config';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const currentLang = (i18n.language?.split('-')[0] || 'ko') as SupportedLanguage;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative group">
        <button 
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-toss-grey-100 hover:bg-toss-grey-200 transition-colors text-sm font-medium text-toss-grey-700"
          aria-label="Change Language"
        >
          <Globe className="w-4 h-4" />
          <span>{LANGUAGE_LABELS[currentLang] || 'Language'}</span>
        </button>
        
        <div className="absolute right-0 top-full mt-2 w-32 py-2 bg-white rounded-xl shadow-lg border border-toss-grey-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-toss-grey-50 transition-colors ${
                currentLang === lang ? 'text-toss-blue font-bold' : 'text-toss-grey-700'
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
