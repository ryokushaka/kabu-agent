import React from 'react';
import { TrendingUp } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-toss-grey-100 pb-12 pt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-toss-blue rounded-lg flex items-center justify-center text-white">
              <TrendingUp size={20} strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight text-toss-grey-900">Kabu Agent</span>
          </div>

          <div className="text-toss-grey-500 text-sm font-medium">
            © 2026 Kabu Agent. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
