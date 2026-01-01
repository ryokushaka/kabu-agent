import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, TrendingUp } from 'lucide-react';
import AuthService from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { LoginInput } from './LoginInput';
import { InfoIcon } from './LoginIcons';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthService.login(formData.username, formData.password);
      login(response.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.response && err.response.status === 401) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인에 실패했습니다. 나중에 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden bg-white">
      
      {/* Background Decor - Subtle premium gradient shapes */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Header / Brand Area */}
      <header className="w-full max-w-7xl flex justify-between items-center z-10 mb-8 animate-fade-up">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
             <TrendingUp size={20} strokeWidth={3} />
           </div>
           <span className="text-xl font-bold tracking-tight text-gray-900">Kabu Agent</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
          <a href="#" className="hover:text-blue-600 transition-colors">고객센터</a>
          <a href="#" className="hover:text-blue-600 transition-colors">이용안내</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md z-10 flex-1 flex flex-col justify-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
        
        {/* Login Card */}
        <div className="bg-white rounded-[32px] shadow-xl shadow-blue-900/5 p-8 md:p-10 border border-white/50 backdrop-blur-xl">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-md text-white">
               <TrendingUp size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              안녕하세요<br/>
              <span className="text-blue-600">Kabu Agent</span> 입니다
            </h1>
            <p className="text-gray-500 text-[15px] font-medium">
              안전하고 편리한 자산 관리를 시작해보세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">로그인 실패</h3>
                  <p className="text-sm text-gray-700">{error}</p>
                </div>
              </div>
            )}

            <LoginInput 
              label="아이디" 
              name="username" 
              placeholder="아이디를 입력해주세요" 
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
            />
            
            <LoginInput 
              label="비밀번호" 
              name="password" 
              type="password"
              placeholder="비밀번호를 입력해주세요" 
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />

            {/* Default Credentials Hint Box */}
            <div className="bg-blue-50/80 rounded-xl p-4 flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-700 uppercase mb-1">Demo Account (Mock Data)</p>
                <p className="text-sm text-blue-800 font-medium">
                  admin / admin123
                </p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`
                w-full py-4 px-6 mt-2
                bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                text-white text-[16px] font-bold rounded-2xl
                shadow-lg shadow-blue-500/20
                transform transition-all duration-200
                disabled:opacity-70 disabled:cursor-not-allowed
                flex justify-center items-center gap-2
              `}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>로그인 중...</span>
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="mt-8 flex justify-center items-center gap-4 text-sm text-gray-500 font-medium">
             <button className="hover:text-gray-800 transition-colors">아이디 찾기</button>
             <div className="w-px h-3 bg-gray-300"></div>
             <button className="hover:text-gray-800 transition-colors">비밀번호 재설정</button>
             <div className="w-px h-3 bg-gray-300"></div>
             <button onClick={() => navigate('/contact')} className="hover:text-gray-800 transition-colors">이용 문의</button>
          </div>

        </div>
        
        {/* Footer Text */}
        <p className="text-center text-xs text-gray-400 mt-8 font-medium leading-relaxed">
          로그인하시면 서비스 이용약관 및 개인정보처리방침에 <br className="hidden xs:block"/>동의하는 것으로 간주됩니다.
        </p>

      </main>

      {/* Footer Area */}
      <footer className="w-full max-w-7xl text-center md:text-left py-4 z-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
         <div className="text-[11px] text-gray-400 space-y-1">
            <p>Copyright © Kabu Agent Corp. All rights reserved.</p>
         </div>
      </footer>

    </div>
  );
};

export default Login;
