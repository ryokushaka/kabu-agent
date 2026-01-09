import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './ProtectedRoute';
import { useAuthContext } from '@features/auth';
import { LoadingSpinner } from '@shared/ui';

// Lazy load pages
const Dashboard = lazy(() => import('@/components/Dashboard'));
const PortfolioList = lazy(() => import('@/components/PortfolioList'));
const Analysis = lazy(() => import('@/components/Analysis'));
const Settings = lazy(() => import('@/components/Settings'));
const Admin = lazy(() => import('@/components/Admin'));
const StockDetail = lazy(() => import('@/components/StockDetail'));
const TransactionHistory = lazy(() => import('@/components/TransactionHistory'));
const NotificationCenter = lazy(() => import('@/components/NotificationCenter'));
const RebalanceRecommendation = lazy(() => import('@/components/RebalanceRecommendation'));
const LandingPage = lazy(() => import('@/src/components/LandingPage/LandingPage'));
const Login = lazy(() => import('@/src/components/Login'));
const Contact = lazy(() => import('@/src/components/Contact'));

// Layout - using existing for now
const AppLayout = lazy(() => import('@/components/layout/AppLayout'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-toss-grey-100 flex items-center justify-center">
    <LoadingSpinner size="lg" message="페이지 로딩 중..." />
  </div>
);

const AppRoutesContent: React.FC = () => {
  const { isAuthenticated } = useAuthContext();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <AppLayout>
                  <Suspense fallback={<LoadingSpinner size="lg" message="로딩 중..." />}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/portfolio" element={<PortfolioList />} />
                      <Route path="/stock/:ticker" element={<StockDetail />} />
                      <Route path="/transactions" element={<TransactionHistory />} />
                      <Route path="/notifications" element={<NotificationCenter />} />
                      <Route path="/rebalance" element={<RebalanceRecommendation />} />
                      <Route path="/analysis" element={<Analysis />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <Admin />
                          </AdminRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </AppLayout>
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutesContent />
    </BrowserRouter>
  );
};
