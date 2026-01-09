import React from 'react';
import { useLocation } from 'react-router-dom';
import { User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  userRole?: string;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/portfolio': 'Holdings',
  '/transactions': 'Transactions',
  '/notifications': 'Notifications',
  '/rebalance': 'Rebalancing',
  '/analysis': 'Analytics',
  '/settings': 'Settings',
  '/admin': 'Admin Console',
};

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  userName = 'User',
  userRole = 'Member'
}) => {
  const location = useLocation();

  const getPageTitle = () => {
    return pageTitles[location.pathname] || 'Dashboard';
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
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
          <span className="text-sm font-semibold text-white">{userName}</span>
          <span className="text-xs text-slate-400">{userRole}</span>
        </div>
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
          <User className="w-5 h-5 text-slate-300" />
        </div>
      </div>
    </header>
  );
};
