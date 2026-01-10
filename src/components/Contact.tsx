import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, TrendingUp } from 'lucide-react';

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden bg-white">
      
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl flex justify-between items-center z-10 mb-8 animate-fade-up">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={20} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Kabu Agent</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md z-10 flex-1 flex flex-col justify-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
        
        <div className="bg-white rounded-[32px] shadow-xl shadow-blue-900/5 p-8 md:p-10 border border-white/50 backdrop-blur-xl text-center">
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6 text-blue-600">
             <Mail size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {t('auth:contact.title')}
          </h1>

          <div className="space-y-4 text-gray-600 mb-8 leading-relaxed">
            <p>
              {t('auth:contact.description')}
            </p>
            <p className="text-sm">
              {t('auth:contact.helpText')}
            </p>
          </div>

          <a 
            href="mailto:gimyumin40@gmail.com"
            className="block w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 mb-4"
          >
            gimyumin40@gmail.com
          </a>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full py-3.5 text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            <span>{t('common:buttons.backToHome')}</span>
          </button>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl text-center md:text-left py-4 z-10 animate-fade-up">
         <div className="text-[11px] text-gray-400 space-y-1">
            <p>Copyright © Kabu Agent Corp. All rights reserved.</p>
         </div>
      </footer>

    </div>
  );
};

export default Contact;
