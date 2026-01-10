import React from 'react';
import { QueryProvider, AuthProvider } from './providers';
import { I18nProvider } from '@shared/i18n';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <QueryProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryProvider>
    </I18nProvider>
  );
};

export default App;
