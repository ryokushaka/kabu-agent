import React, { Suspense, useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../config';
import { LoadingSpinner } from '@shared/ui';

interface I18nProviderProps {
  children: React.ReactNode;
}

const LanguageInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set document lang attribute on language change
    document.documentElement.lang = i18n.language?.split('-')[0] || 'ko';
  }, [i18n.language]);

  return <>{children}</>;
};

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<LoadingSpinner />}>
        <LanguageInitializer>{children}</LanguageInitializer>
      </Suspense>
    </I18nextProvider>
  );
};
