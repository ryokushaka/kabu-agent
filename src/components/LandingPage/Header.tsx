import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/common';

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
          <div className="w-8 h-8 bg-toss-blue rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={20} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight text-toss-grey-900">Kabu Agent</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/login')}
            className="hidden md:inline-flex text-toss-grey-700 hover:text-toss-grey-900 font-medium"
          >
            로그인
          </Button>
          <Button 
            variant="primary"
            onClick={() => navigate('/contact')}
            className="rounded-full px-6 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            이용 문의
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
