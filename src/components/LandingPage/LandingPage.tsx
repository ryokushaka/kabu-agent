import React, { useState, useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import MarketSummary from './MarketSummary';
import FeatureSection from './FeatureSection';
import LandingNewsFeed from './LandingNewsFeed';
import StockBasics from './StockBasics';
import Footer from './Footer';
import PublicService, { MarketIndices, MarketNews } from '../../services/publicService';

const LandingPage: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndices>({});
  const [news, setNews] = useState<MarketNews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [indicesData, newsData] = await Promise.all([
          PublicService.getMarketIndices(),
          PublicService.getMarketNews()
        ]);
        setIndices(indicesData);
        setNews(newsData);
      } catch (error) {
        console.error("Failed to fetch public data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />
      <main>
        <Hero />
        <MarketSummary indices={indices} loading={loading} />
        <FeatureSection />
        <LandingNewsFeed news={news} loading={loading} />
        <StockBasics />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
