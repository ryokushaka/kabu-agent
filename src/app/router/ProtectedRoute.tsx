import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@features/auth';
import { LoadingSpinner } from '@shared/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-toss-grey-100 flex items-center justify-center">
    <LoadingSpinner size="lg" message="페이지 로딩 중..." />
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <PageLoader />;
  }

  if (user?.username !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
