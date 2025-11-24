import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  Database, 
  Server, 
  Search, 
  Shield, 
  AlertTriangle, 
  RefreshCw,
  HardDrive,
  Settings as SettingsIcon,
  MoreVertical
} from 'lucide-react';

// Mock Data for Admin
const MOCK_USERS = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN', status: 'Active', joined: '2023-01-15' },
  { id: '2', name: 'Alice Smith', email: 'alice@example.com', role: 'USER', status: 'Active', joined: '2023-02-20' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'USER', status: 'Suspended', joined: '2023-03-10' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'USER', status: 'Active', joined: '2023-04-05' },
  { id: '5', name: 'Mike Brown', email: 'mike@example.com', role: 'USER', status: 'Pending', joined: '2023-05-12' },
];

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'monitoring' | 'system'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      Active: 'bg-emerald-950/50 text-emerald-400 border-emerald-900',
      Suspended: 'bg-rose-950/50 text-rose-400 border-rose-900',
      Pending: 'bg-amber-950/50 text-amber-400 border-amber-900'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-800 text-slate-400'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Console</h2>
          <p className="text-slate-400 text-sm">System management and monitoring</p>
        </div>
      </div>

      {/* Mobile Scrollable Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-700/50">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users size={18} /> User Management
        </button>
        <button 
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'monitoring' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity size={18} /> System Status
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'system' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Server size={18} /> System Settings
        </button>
      </div>

      {/* User Management Content */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                + Add User
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">User</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Role</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Joined</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {user.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-300">
                        {user.role === 'ADMIN' && <Shield size={14} className="text-blue-400" />}
                        {user.role}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={user.status} /></td>
                    <td className="p-4 text-sm text-slate-400">{user.joined}</td>
                    <td className="p-4 text-right">
                      <button className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                  </div>
                  <button className="text-slate-400 hover:text-white"><MoreVertical size={18} /></button>
                </div>
                <div className="flex items-center justify-between border-t border-slate-700/50 pt-3 mt-2">
                  <div className="flex items-center gap-2">
                     <StatusBadge status={user.status} />
                     {user.role === 'ADMIN' && (
                       <span className="flex items-center gap-1 text-xs text-blue-400 font-medium bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/50">
                         <Shield size={10} /> ADMIN
                       </span>
                     )}
                  </div>
                  <span className="text-xs text-slate-500">Joined {user.joined}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitoring Content */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-emerald-950/50 rounded-lg text-emerald-400"><Activity size={20} /></div>
                 <h3 className="text-lg font-semibold text-white">KIS API Status</h3>
               </div>
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-emerald-400 text-sm font-medium">Operational</span>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Response Time</span>
                   <span className="text-white">124ms</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Error Rate</span>
                   <span className="text-white">0.02%</span>
                 </div>
               </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-950/50 rounded-lg text-blue-400"><Database size={20} /></div>
                 <h3 className="text-lg font-semibold text-white">Database</h3>
               </div>
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-emerald-400 text-sm font-medium">Healthy</span>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Active Connections</span>
                   <span className="text-white">42</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Storage Usage</span>
                   <span className="text-white">1.2GB / 20GB</span>
                 </div>
               </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-violet-950/50 rounded-lg text-violet-400"><Server size={20} /></div>
                 <h3 className="text-lg font-semibold text-white">Redis Cache</h3>
               </div>
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-emerald-400 text-sm font-medium">Running</span>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Hit Rate</span>
                   <span className="text-white">94.5%</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Memory</span>
                   <span className="text-white">256MB</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">API Usage Statistics (24h)</h3>
            <div className="space-y-4">
              {[
                { label: 'inquire_balance', count: 1250, width: '70%' },
                { label: 'search_info', count: 850, width: '45%' },
                { label: 'inquire_period_profit', count: 320, width: '20%' },
                { label: 'auth_token', count: 120, width: '8%' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 font-mono">{stat.label}</span>
                    <span className="text-slate-400">{stat.count} calls</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: stat.width }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Settings Content */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
             <div className="flex items-center gap-3 mb-6">
               <AlertTriangle className="text-amber-500" />
               <h3 className="text-lg font-semibold text-white">Maintenance Controls</h3>
             </div>
             
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-medium text-white">Maintenance Mode</div>
                   <div className="text-xs text-slate-400">Suspend user access for updates</div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
               </div>

               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-medium text-white">Debug Logging</div>
                   <div className="text-xs text-slate-400">Enable verbose system logs</div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
               </div>
             </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
             <div className="flex items-center gap-3 mb-6">
               <HardDrive className="text-blue-500" />
               <h3 className="text-lg font-semibold text-white">Data Operations</h3>
             </div>
             
             <div className="space-y-4">
               <button className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 hover:border-slate-500">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={18} className="text-slate-400" />
                    <span className="text-slate-200 text-sm">Clear Redis Cache</span>
                  </div>
                  <span className="text-xs text-slate-500">24MB freed</span>
               </button>

               <button className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 hover:border-slate-500">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-slate-400" />
                    <span className="text-slate-200 text-sm">Backup Database Now</span>
                  </div>
                  <span className="text-xs text-slate-500">Last: 2h ago</span>
               </button>

               <button className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 hover:border-slate-500">
                  <div className="flex items-center gap-3">
                    <SettingsIcon size={18} className="text-slate-400" />
                    <span className="text-slate-200 text-sm">Force Sync KIS Data</span>
                  </div>
                  <span className="text-xs text-slate-500">Manual Trigger</span>
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;