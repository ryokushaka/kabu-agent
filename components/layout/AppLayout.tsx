import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Menu } from 'lucide-react';
import Sidebar from '../Sidebar';
import { useAuth } from '../../hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/portfolio':
        return 'Holdings';
      case '/analysis':
        return 'Analytics';
      case '/settings':
        return 'Settings';
      case '/admin':
        return 'Admin Console';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex">
      <Sidebar
        onLogout={logout}
        isAdmin={true}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white capitalize truncate">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-white">John Doe</span>
              <span className="text-xs text-slate-400">Premium User</span>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
              <User className="w-5 h-5 text-slate-300" />
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
