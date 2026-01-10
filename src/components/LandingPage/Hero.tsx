import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/common';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden bg-toss-grey-50">
      {/* 3D Background Layer - overflow-hidden clips the Spline watermark at bottom */}
      <div className="absolute inset-0 z-0 opacity-80 md:opacity-100 overflow-hidden">
         <iframe
            src='https://my.spline.design/interactivecubes-Bt3WelK2LnhkUZ0rgxfEQ7Ng/'
            frameBorder='0'
            width='100%'
            height='100%'
            className="w-full h-[calc(100%+50px)] pointer-events-auto"
            title="Spline 3D Background"
         ></iframe>
      </div>

      {/* Overlay Gradient to fade out bottom of iframe for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-toss-grey-50 to-transparent z-10 pointer-events-none"></div>

      {/* Content Layer */}
      <div className="relative z-20 text-center max-w-4xl mx-auto px-6 mt-[-10vh]">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-toss-grey-900 mb-6 leading-tight drop-shadow-sm">
          {t('hero.title')}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-toss-blue to-blue-600">{t('hero.titleHighlight')}</span>
        </h1>

        <p className="text-lg md:text-xl text-toss-grey-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}<br className="hidden md:block"/>
          {t('hero.description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="rounded-full px-10 shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 transform hover:-translate-y-1 group"
            rightIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          >
            {t('common:buttons.startFree', { defaultValue: t('hero.cta', { defaultValue: '무료로 시작하기' }) })}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
