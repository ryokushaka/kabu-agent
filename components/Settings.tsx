import React, { useState } from 'react';
import { Key, Save, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('************************');
  const [apiSecret, setApiSecret] = useState('************************************************');
  const [showSecret, setShowSecret] = useState(false);
  const [accountNumber, setAccountNumber] = useState('12345678-01');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('설정이 안전하게 저장되었습니다 (Mock).');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-toss-grey-900">설정</h2>

      {/* Account Integration Card */}
      <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 p-2 rounded-xl">
            <Key className="w-6 h-6 text-toss-blue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-toss-grey-900">KIS API 설정</h3>
            <p className="text-sm text-toss-grey-500">한국투자증권 API 키를 관리합니다.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label htmlFor="account-number" className="block text-sm font-medium text-toss-grey-700 mb-2">계좌번호</label>
            <input
              id="account-number"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-white border border-toss-grey-200 text-toss-grey-900 rounded-xl px-4 py-3 focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-300 disabled:bg-toss-grey-50 disabled:text-toss-grey-400 outline-none transition-all duration-200"
              placeholder="12345678-01"
            />
          </div>

          <div>
            <label htmlFor="app-key" className="block text-sm font-medium text-toss-grey-700 mb-2">App Key</label>
            <input
              id="app-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white border border-toss-grey-200 text-toss-grey-900 rounded-xl px-4 py-3 focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-300 disabled:bg-toss-grey-50 disabled:text-toss-grey-400 outline-none transition-all duration-200 font-mono"
              placeholder="************************"
            />
          </div>

          <div>
            <label htmlFor="app-secret" className="block text-sm font-medium text-toss-grey-700 mb-2">App Secret</label>
            <div className="relative">
              <input
                id="app-secret"
                type={showSecret ? "text" : "password"}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-white border border-toss-grey-200 text-toss-grey-900 rounded-xl px-4 py-3 pr-12 focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-300 disabled:bg-toss-grey-50 disabled:text-toss-grey-400 outline-none transition-all duration-200 font-mono"
                placeholder="************************************************"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-toss-grey-400 hover:text-toss-grey-600 transition-colors p-1 rounded-lg hover:bg-toss-grey-50 focus:outline-none focus:ring-2 focus:ring-toss-blue/10"
                aria-label={showSecret ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-toss-blue shrink-0 mt-0.5" />
            <p className="text-sm text-toss-grey-700">
              API 키는 저장 전 AES-256으로 암호화됩니다. 키는 절대 외부와 공유되지 않습니다.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
             <button
              type="button"
              className="px-4 py-2.5 bg-white border border-toss-grey-200 text-toss-grey-700 hover:bg-toss-grey-50 hover:border-toss-grey-300 active:scale-[0.98] transition-all duration-200 text-sm font-medium flex items-center gap-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-toss-grey-300 focus:ring-offset-2 min-h-[44px]"
            >
              <RefreshCw size={16} /> 연결 테스트
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-300/50 active:scale-[0.98] text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-sm shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 min-h-[44px]"
            >
              <Save size={18} /> 변경사항 저장
            </button>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-toss-grey-900 mb-4">화면 설정</h3>
        <div className="flex items-center justify-between py-3 border-b border-toss-grey-100">
          <label htmlFor="currency" className="text-toss-grey-700 font-medium">기본 통화</label>
          <select id="currency" className="bg-white border border-toss-grey-200 text-toss-grey-900 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-300 transition-all duration-200 cursor-pointer">
            <option>USD ($)</option>
            <option>KRW (₩)</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-3">
          <label htmlFor="refresh-interval" className="text-toss-grey-700 font-medium">새로고침 주기</label>
           <select id="refresh-interval" className="bg-white border border-toss-grey-200 text-toss-grey-900 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-300 transition-all duration-200 cursor-pointer">
            <option>실시간</option>
            <option>1분</option>
            <option>5분</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;