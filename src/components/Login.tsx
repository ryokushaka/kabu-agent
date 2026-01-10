import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, TrendingUp } from 'lucide-react';
import AuthService from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { LoginInput } from './LoginInput';
import { InfoIcon } from './LoginIcons';
import { Button, Card } from '../../components/common';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

const Login: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
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
        setError(t('auth:errors.invalidCredentials'));
      } else {
        setError(t('auth:errors.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden bg-white">
      
      {/* Background Decor - Subtle premium gradient shapes */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-toss-blue/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Header / Brand Area */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-toss-grey-200 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
           <div className="w-8 h-8 bg-toss-blue rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
             <TrendingUp size={20} strokeWidth={3} />
           </div>
           <span className="text-xl font-bold tracking-tight text-toss-grey-900">Kabu Agent</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-toss-grey-500">
          <button onClick={() => alert('고객센터 서비스 준비 중입니다.')} className="hover:text-toss-blue transition-colors">고객센터</button>
          <button onClick={() => alert('이용안내 페이지 준비 중입니다.')} className="hover:text-toss-blue transition-colors">이용안내</button>
          <LanguageSwitcher />
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md z-10 flex-1 flex flex-col justify-center pt-16 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        
        {/* Login Card */}
        <div className="bg-white rounded-[32px] shadow-xl shadow-toss-grey-900/5 p-8 md:p-10 border border-white/50 backdrop-blur-xl">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-toss-blue rounded-2xl mb-6 shadow-md text-white">
               <TrendingUp size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-toss-grey-900 mb-3 leading-tight">
              {t('auth:login.title')}<br/>
              <span className="text-toss-blue">{t('auth:login.subtitle')}</span>
            </h1>
            <p className="text-toss-grey-500 text--[15px] font-medium">
              {t('common:app.tagline')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-toss-red shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-toss-grey-900 mb-1">{t('auth:errors.loginFailed')}</h3>
                  <p className="text-sm text-toss-grey-700">{error}</p>
                </div>
              </div>
            )}

            <LoginInput
              label={t('auth:login.username')}
              name="username"
              placeholder={t('auth:login.usernamePlaceholder')}
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
            />

            <LoginInput
              label={t('auth:login.password')}
              name="password"
              type="password"
              placeholder={t('auth:login.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />

            {/* Default Credentials Hint Box */}
            <div className="bg-blue-50/80 rounded-xl p-4 flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-toss-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-toss-blue uppercase mb-1">{t('auth:login.demoHint')}</p>
                <p className="text-sm text-toss-blue font-medium">
                  admin / admin123
                </p>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2 rounded-2xl shadow-lg shadow-blue-500/20"
            >
              {loading ? t('auth:login.submitting') : t('auth:login.submit')}
            </Button>
          </form>

          <div className="mt-8 flex justify-center items-center gap-4 text-sm text-toss-grey-500 font-medium">
             <button type="button" onClick={() => alert(t('auth:links.findId'))} className="hover:text-toss-grey-800 transition-colors">{t('auth:links.findId')}</button>
             <div className="w-px h-3 bg-toss-grey-300"></div>
             <button type="button" onClick={() => alert(t('auth:links.resetPassword'))} className="hover:text-toss-grey-800 transition-colors">{t('auth:links.resetPassword')}</button>
             <div className="w-px h-3 bg-toss-grey-300"></div>
             <button type="button" onClick={() => navigate('/contact')} className="hover:text-toss-grey-800 transition-colors">{t('auth:links.contact')}</button>
          </div>

        </div>
        
        {/* Footer Text */}
        <p className="text-center text-xs text-gray-400 mt-8 font-medium leading-relaxed">
          {t('auth:footer.agreement')}
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
