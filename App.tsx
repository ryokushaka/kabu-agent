import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PortfolioList from './components/PortfolioList';
import Analysis from './components/Analysis';
import Settings from './components/Settings';
import Admin from './components/Admin';
import LandingPage from './src/components/LandingPage/LandingPage';
import Login from './src/components/Login';
import Contact from './src/components/Contact';
import { User, Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

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
        onLogout={logout} 
        isAdmin={user?.username === 'admin'} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Header */}
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
              />
             </div>
          </div>
        </header>

        {/* Content */}
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
    return <div className="min-h-screen bg-toss-grey-100 flex items-center justify-center text-toss-grey-900">로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-toss-grey-100 flex items-center justify-center text-toss-grey-900">로딩 중...</div>;
  }

  if (user?.username !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
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
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/portfolio" element={<PortfolioList />} />
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
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
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