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
  { id: '1', name: '김철수', email: 'chulsoo@example.com', role: 'ADMIN', status: 'Active', joined: '2023-01-15' },
  { id: '2', name: '이영희', email: 'younghee@example.com', role: 'USER', status: 'Active', joined: '2023-02-20' },
  { id: '3', name: '박민수', email: 'minsoo@example.com', role: 'USER', status: 'Suspended', joined: '2023-03-10' },
  { id: '4', name: '최지은', email: 'jieun@example.com', role: 'USER', status: 'Active', joined: '2023-04-05' },
  { id: '5', name: '정우성', email: 'woosung@example.com', role: 'USER', status: 'Pending', joined: '2023-05-12' },
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
      Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      Suspended: 'bg-red-50 text-toss-red border-red-100',
      Pending: 'bg-amber-50 text-amber-600 border-amber-100'
    };
    const labels: Record<string, string> = {
      Active: '활성',
      Suspended: '정지',
      Pending: '대기'
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || 'bg-toss-grey-50 text-toss-grey-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-toss-grey-900">관리자 콘솔</h2>
          <p className="text-toss-grey-500 text-sm mt-1">시스템 관리 및 모니터링</p>
        </div>
      </div>

      {/* Mobile Scrollable Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-toss-grey-100">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-toss-blue text-white shadow-sm shadow-blue-200' : 'text-toss-grey-500 hover:text-toss-grey-900 hover:bg-toss-grey-50'
          }`}
        >
          <Users size={18} /> 사용자 관리
        </button>
        <button 
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
            activeTab === 'monitoring' ? 'bg-toss-blue text-white shadow-sm shadow-blue-200' : 'text-toss-grey-500 hover:text-toss-grey-900 hover:bg-toss-grey-50'
          }`}
        >
          <Activity size={18} /> 시스템 상태
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
            activeTab === 'system' ? 'bg-toss-blue text-white shadow-sm shadow-blue-200' : 'text-toss-grey-500 hover:text-toss-grey-900 hover:bg-toss-grey-50'
          }`}
        >
          <Server size={18} /> 시스템 설정
        </button>
      </div>

      {/* User Management Content */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-3xl border border-toss-grey-100 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-toss-grey-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="사용자 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-toss-grey-50 border border-toss-grey-100 text-toss-grey-900 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2.5 bg-toss-blue hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap shadow-sm shadow-blue-200">
                + 사용자 추가
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-toss-grey-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-toss-grey-50 border-b border-toss-grey-100">
                  <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase">사용자</th>
                  <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase">권한</th>
                  <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase">상태</th>
                  <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase">가입일</th>
                  <th className="p-5 text-xs font-semibold text-toss-grey-500 uppercase text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-toss-grey-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-toss-grey-50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-toss-grey-100 flex items-center justify-center text-sm font-bold text-toss-grey-600">
                          {user.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-toss-grey-900">{user.name}</div>
                          <div className="text-xs text-toss-grey-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1 text-sm text-toss-grey-700 font-medium">
                        {user.role === 'ADMIN' && <Shield size={14} className="text-toss-blue" />}
                        {user.role}
                      </div>
                    </td>
                    <td className="p-5"><StatusBadge status={user.status} /></td>
                    <td className="p-5 text-sm text-toss-grey-500">{user.joined}</td>
                    <td className="p-5 text-right">
                      <button className="p-2 hover:bg-toss-grey-100 rounded-lg text-toss-grey-400 hover:text-toss-grey-700 transition-colors">
                        <MoreVertical size={18} />
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
              <div key={user.id} className="bg-white border border-toss-grey-100 rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-toss-grey-100 flex items-center justify-center text-base font-bold text-toss-grey-600">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-toss-grey-900 text-lg">{user.name}</div>
                        <div className="text-xs text-toss-grey-500">{user.email}</div>
                      </div>
                  </div>
                  <button className="text-toss-grey-400 hover:text-toss-grey-700"><MoreVertical size={20} /></button>
                </div>
                <div className="flex items-center justify-between border-t border-toss-grey-100 pt-3 mt-2">
                  <div className="flex items-center gap-2">
                     <StatusBadge status={user.status} />
                     {user.role === 'ADMIN' && (
                       <span className="flex items-center gap-1 text-xs text-toss-blue font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                         <Shield size={10} /> ADMIN
                       </span>
                     )}
                  </div>
                  <span className="text-xs text-toss-grey-400">가입일 {user.joined}</span>
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
            <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Activity size={20} /></div>
                 <h3 className="text-lg font-bold text-toss-grey-900">KIS API 상태</h3>
               </div>
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-emerald-600 text-sm font-bold">정상 작동 중</span>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-toss-grey-500">응답 시간</span>
                   <span className="text-toss-grey-900 font-medium">124ms</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-toss-grey-500">에러율</span>
                   <span className="text-toss-grey-900 font-medium">0.02%</span>
                 </div>
               </div>
            </div>

            <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-50 rounded-xl text-toss-blue"><Database size={20} /></div>
                 <h3 className="text-lg font-bold text-toss-grey-900">데이터베이스</h3>
               </div>
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                 <span className="text-emerald-600 text-sm font-bold">정상</span>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-toss-grey-500">활성 연결</span>
                   <span className="text-toss-grey-900 font-medium">42</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-toss-grey-500">스토리지 사용량</span>
                   <span className="text-toss-grey-900 font-medium">1.2GB / 20GB</span>
                 </div>
               </div>
            </div>

            <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-violet-50 rounded-xl text-violet-600"><Server size={20} /></div>
                 <h3 className="text-lg font-bold text-toss-grey-900">Redis 캐시</h3>
               </div>
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                 <span className="text-emerald-600 text-sm font-bold">실행 중</span>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-toss-grey-500">적중률 (Hit Rate)</span>
                   <span className="text-toss-grey-900 font-medium">94.5%</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-toss-grey-500">메모리</span>
                   <span className="text-toss-grey-900 font-medium">256MB</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-toss-grey-900 mb-4">API 사용량 통계 (24h)</h3>
            <div className="space-y-4">
              {[
                { label: 'inquire_balance', count: 1250, width: '70%' },
                { label: 'search_info', count: 850, width: '45%' },
                { label: 'inquire_period_profit', count: 320, width: '20%' },
                { label: 'auth_token', count: 120, width: '8%' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-toss-grey-700 font-mono font-medium">{stat.label}</span>
                    <span className="text-toss-grey-500">{stat.count} calls</span>
                  </div>
                  <div className="w-full bg-toss-grey-100 rounded-full h-2.5">
                    <div className="bg-toss-blue h-2.5 rounded-full transition-all duration-500 shadow-sm shadow-blue-200" style={{ width: stat.width }}></div>
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
          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
               <AlertTriangle className="text-amber-500" />
               <h3 className="text-lg font-bold text-toss-grey-900">유지보수 제어</h3>
             </div>
             
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-bold text-toss-grey-900">유지보수 모드</div>
                   <div className="text-xs text-toss-grey-500 mt-0.5">업데이트를 위해 사용자 접근을 차단합니다.</div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-12 h-7 bg-toss-grey-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-toss-blue shadow-inner"></div>
                  </label>
               </div>

               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-bold text-toss-grey-900">디버그 로깅</div>
                   <div className="text-xs text-toss-grey-500 mt-0.5">상세 시스템 로그를 활성화합니다.</div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-12 h-7 bg-toss-grey-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-toss-blue shadow-inner"></div>
                  </label>
               </div>
             </div>
          </div>

          <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
               <HardDrive className="text-toss-blue" />
               <h3 className="text-lg font-bold text-toss-grey-900">데이터 작업</h3>
             </div>
             
             <div className="space-y-4">
               <button className="w-full flex items-center justify-between p-4 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-2xl transition-colors border border-toss-grey-100">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={18} className="text-toss-grey-500" />
                    <span className="text-toss-grey-900 text-sm font-medium">Redis 캐시 초기화</span>
                  </div>
                  <span className="text-xs text-toss-grey-500">24MB 확보됨</span>
               </button>

               <button className="w-full flex items-center justify-between p-4 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-2xl transition-colors border border-toss-grey-100">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-toss-grey-500" />
                    <span className="text-toss-grey-900 text-sm font-medium">데이터베이스 백업</span>
                  </div>
                  <span className="text-xs text-toss-grey-500">마지막: 2시간 전</span>
               </button>

               <button className="w-full flex items-center justify-between p-4 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-2xl transition-colors border border-toss-grey-100">
                  <div className="flex items-center gap-3">
                    <SettingsIcon size={18} className="text-toss-grey-500" />
                    <span className="text-toss-grey-900 text-sm font-medium">KIS 데이터 강제 동기화</span>
                  </div>
                  <span className="text-xs text-toss-grey-500">수동 실행</span>
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;