import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  Receipt,
  Bell,
  Scale
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isAdmin, isOpen, onClose }) => {
  const { t } = useTranslation('common');
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: t('navigation.home'), icon: LayoutDashboard },
    { path: '/portfolio', label: t('navigation.portfolio'), icon: PieChart },
    { path: '/transactions', label: t('navigation.transactions'), icon: Receipt },
    { path: '/notifications', label: t('navigation.notifications'), icon: Bell },
    { path: '/rebalance', label: t('navigation.rebalance'), icon: Scale },
    { path: '/analysis', label: t('navigation.analysis'), icon: TrendingUp },
    { path: '/settings', label: t('navigation.settings'), icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', label: t('navigation.admin'), icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-toss-grey-200 flex flex-col transition-transform duration-300 ease-in-out transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl shadow-sm overflow-hidden">
              <TrendingUp className="text-blue w-8 h-8" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-toss-grey-900 leading-tight">Kabu Agent</h1>
              <p className="text-xs text-toss-grey-500 font-medium tracking-wider">{t('app.tagline')}</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden text-toss-grey-400 hover:text-toss-grey-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 768) onClose();
                }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700' 
                    : 'text-toss-grey-600 hover:bg-toss-grey-100 hover:text-toss-grey-900 hover:ring-1 hover:ring-toss-grey-200'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-toss-grey-400 group-hover:text-toss-grey-600'}`} />
                <span className="text-[15px]">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-toss-grey-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-toss-grey-500 hover:text-toss-red hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('buttons.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;