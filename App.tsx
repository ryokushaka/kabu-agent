import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoadingSpinner } from './components/common';

const Dashboard = lazy(() => import('./components/Dashboard'));
const PortfolioList = lazy(() => import('./components/PortfolioList'));
const Analysis = lazy(() => import('./components/Analysis'));
const Settings = lazy(() => import('./components/Settings'));
const Admin = lazy(() => import('./components/Admin'));
const StockDetail = lazy(() => import('./components/StockDetail'));
const TransactionHistory = lazy(() => import('./components/TransactionHistory'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const RebalanceRecommendation = lazy(() => import('./components/RebalanceRecommendation'));
const LandingPage = lazy(() => import('./src/components/LandingPage/LandingPage'));
const Login = lazy(() => import('./src/components/Login'));
const Contact = lazy(() => import('./src/components/Contact'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-toss-grey-100 flex items-center justify-center">
    <LoadingSpinner size="lg" message="페이지 로딩 중..." />
  </div>
);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return '홈';
      case '/portfolio': return '내 주식';
      case '/analysis': return '자산 분석';
      case '/settings': return '설정';
      case '/admin': return '관리자';
      default: return '홈';
    }
  };

  return (
    <div className="min-h-screen bg-toss-grey-100 text-toss-grey-900 font-sans flex">
      <Sidebar 
        onLogout={handleLogout} 
        isAdmin={user?.username === 'admin'} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 w-full md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-toss-grey-200 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 hover:bg-toss-grey-100 rounded-lg text-toss-grey-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-toss-grey-900">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-toss-grey-800">{user?.full_name || user?.username}</span>
                <span className="text-xs text-toss-grey-500">{user?.username === 'admin' ? '관리자' : '사용자'}</span>
             </div>
             <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-toss-grey-100 flex items-center justify-center border border-toss-grey-200">
               <img 
                src="/logo/gamja.png" 
                alt="Kabu Agent Logo" 
                className="w-10 h-10 object-cover"
                loading="lazy"
              />
             </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user?.username !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

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
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
