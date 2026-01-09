import React from 'react';
import { useLocation } from 'react-router-dom';
import { User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  userRole?: string;
}

const pageTitles: Record<string, string> = {
  '/': '홈',
  '/dashboard': '홈',
  '/portfolio': '내 주식',
  '/transactions': '거래 내역',
  '/notifications': '알림',
  '/rebalance': '리밸런싱',
  '/analysis': '자산 분석',
  '/settings': '설정',
  '/admin': '관리자',
};

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  userName = 'User',
  userRole = 'Member'
}) => {
  const location = useLocation();

  const getPageTitle = () => {
    return pageTitles[location.pathname] || '홈';
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-toss-grey-200 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
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
          <span className="text-sm font-semibold text-toss-grey-900">{userName}</span>
          <span className="text-xs text-toss-grey-500">{userRole}</span>
        </div>
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-toss-grey-200 flex items-center justify-center border border-toss-grey-300">
          <User className="w-5 h-5 text-toss-grey-600" />
        </div>
      </div>
    </header>
  );
};
