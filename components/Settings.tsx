import React, { useState } from 'react';
import { Key, Save, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('************************');
  const [apiSecret, setApiSecret] = useState('************************************************');
  const [showSecret, setShowSecret] = useState(false);
  const [accountNumber, setAccountNumber] = useState('12345678-01');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved securely (Mock).');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      {/* Account Integration Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600/20 p-2 rounded-lg">
            <Key className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">KIS API Configuration</h3>
            <p className="text-sm text-slate-400">Manage your Korea Investment Securities API keys.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">App Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">App Secret</label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200">
              Your API keys are encrypted using AES-256 before being stored. We never share your keys with third parties.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
             <button
              type="button"
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw size={16} /> Test Connection
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Display Preferences</h3>
        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
          <span className="text-slate-300">Base Currency</span>
          <select className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-1 text-sm outline-none">
            <option>USD ($)</option>
            <option>KRW (₩)</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-slate-300">Refresh Interval</span>
           <select className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-1 text-sm outline-none">
            <option>Realtime</option>
            <option>1 Minute</option>
            <option>5 Minutes</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;