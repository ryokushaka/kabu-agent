import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Menu } from 'lucide-react';
import Sidebar from '../Sidebar';
import { useAuth } from '../../hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return '홈';
      case '/portfolio':
        return '내 주식';
      case '/transactions':
        return '거래 내역';
      case '/notifications':
        return '알림';
      case '/rebalance':
        return '리밸런싱';
      case '/analysis':
        return '자산 분석';
      case '/settings':
        return '설정';
      case '/admin':
        return '관리자';
      default:
        return '홈';
    }
  };

  return (
    <div className="min-h-screen bg-toss-grey-100 text-toss-grey-900 font-sans flex">
      <Sidebar
        onLogout={handleLogout}
        isAdmin={true}
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
              className="md:hidden p-2 -ml-2 hover:bg-toss-grey-200 rounded-lg text-toss-grey-500 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-toss-grey-900 truncate">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-toss-grey-900">사용자</span>
              <span className="text-xs text-toss-grey-500">Premium User</span>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-toss-grey-200 flex items-center justify-center border border-toss-grey-300">
              <User className="w-5 h-5 text-toss-grey-600" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
