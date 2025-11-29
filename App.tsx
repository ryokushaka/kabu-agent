import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PortfolioList from './components/PortfolioList';
import Analysis from './components/Analysis';
import Settings from './components/Settings';
import Admin from './components/Admin';
import { User, Lock, Menu } from 'lucide-react';

// Login Component (Internal to App for simplicity in this structure)
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save login state to localStorage
    localStorage.setItem('isAuthenticated', 'true');
    onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to manage your portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          Demo Account: demo@example.com / password
        </div>
      </div>
    </div>
  );
};

// Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/portfolio': return 'Holdings';
      case '/analysis': return 'Analytics';
      case '/settings': return 'Settings';
      case '/admin': return 'Admin Console';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex">
      <Sidebar 
        onLogout={onLogout} 
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
            <h2 className="text-xl font-bold text-white capitalize truncate">{getPageTitle()}</h2>
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
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  // Check localStorage for existing authentication
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginScreen onLogin={handleLogin} /> : <Navigate to="/" replace />} 
        />
        
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <AppLayout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/portfolio" element={<PortfolioList />} />
                  <Route path="/analysis" element={<Analysis />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;