import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar';
import { Header } from '@widgets/header';
import { useAuthContext } from '@features/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.username === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-toss-grey-100 text-toss-grey-900 font-sans flex">
      <Sidebar
        onLogout={handleLogout}
        isAdmin={isAdmin}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          userName={user?.username || 'User'}
          userRole={isAdmin ? 'Admin' : 'Premium User'}
        />

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};
