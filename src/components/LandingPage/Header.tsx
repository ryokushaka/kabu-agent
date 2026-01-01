import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={20} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Kabu Agent</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden md:block"
          >
            로그인
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            시작하기
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
