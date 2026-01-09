import React from 'react';
import { QueryProvider, AuthProvider } from './providers';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
