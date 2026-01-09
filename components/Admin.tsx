import React, { useState, useEffect, useCallback } from 'react';
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
  MoreVertical,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../services/api';

// Types
interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  role: string;
  created_at: string;
  last_login: string | null;
}

interface SystemHealth {
  status: string;
  database: {
    connected: boolean;
    response_time_ms?: number;
    active_connections?: number;
    database_size_mb?: number;
    error?: string;
  };
  kis_api: {
    operational: boolean;
    response_time_ms?: number;
    error_rate_percent?: number;
  };
  redis: {
    connected: boolean;
    used_memory_mb?: number;
    hit_rate_percent?: number;
    total_keys?: number;
  };
  timestamp: string;
}

interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'monitoring' | 'system'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiClient.request<UserListResponse>(`/api/admin/users?${params}`);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.request<SystemHealth>('/api/admin/system/health');
      setSystemHealth(response);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      setSystemHealth({
        status: 'error',
        database: { connected: false },
        kis_api: { operational: false },
        redis: { connected: false },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Flush cache
  const handleFlushCache = async () => {
    setActionLoading('flush');
    try {
      await apiClient.request('/api/admin/system/cache/flush', { method: 'POST' });
      alert('Cache flushed successfully');
      fetchSystemHealth();
    } catch (err) {
      console.error('Failed to flush cache:', err);
      alert('Failed to flush cache');
    } finally {
      setActionLoading(null);
    }
  };

  // Update user status
  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      await apiClient.request(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  // Effects
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'monitoring') {
      fetchSystemHealth();
    }
  }, [activeTab, fetchUsers, fetchSystemHealth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') {
        setCurrentPage(1);
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, fetchUsers]);

  // Status helpers
  const getStatusInfo = (user: AdminUser) => {
    if (!user.is_active) return { status: 'Suspended', label: '정지', style: 'bg-red-50 text-toss-red border-red-100' };
    if (!user.is_verified) return { status: 'Pending', label: '대기', style: 'bg-amber-50 text-amber-600 border-amber-100' };
    return { status: 'Active', label: '활성', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  };

  const StatusBadge = ({ user }: { user: AdminUser }) => {
    const { label, style } = getStatusInfo(user);
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${style}`}>
        {label}
      </span>
    );
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700'
              : 'bg-white text-toss-grey-700 hover:text-toss-grey-900 hover:bg-toss-grey-50 border border-toss-grey-200'
          }`}
        >
          <Users size={18} /> 사용자 관리
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] ${
            activeTab === 'monitoring'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700'
              : 'bg-white text-toss-grey-700 hover:text-toss-grey-900 hover:bg-toss-grey-50 border border-toss-grey-200'
          }`}
        >
          <Activity size={18} /> 시스템 상태
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] ${
            activeTab === 'system'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700'
              : 'bg-white text-toss-grey-700 hover:text-toss-grey-900 hover:bg-toss-grey-50 border border-toss-grey-200'
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
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="text-toss-grey-400 w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="사용자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-toss-grey-50 border border-toss-grey-100 text-toss-grey-900 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-200 disabled:bg-toss-grey-50 disabled:text-toss-grey-400 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-toss-grey-500">
                총 {totalUsers}명
              </span>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="p-2.5 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-xl transition-colors border border-toss-grey-200"
              >
                <RefreshCw size={18} className={`text-toss-grey-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-toss-grey-100 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-toss-blue animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-toss-grey-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-toss-grey-300" />
                </div>
                <h3 className="text-lg font-bold text-toss-grey-900 mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-toss-grey-500">다른 검색어를 시도해보세요</p>
              </div>
            ) : (
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
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-toss-grey-50 transition-all duration-200 cursor-pointer group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-toss-grey-100 flex items-center justify-center text-sm font-bold text-toss-grey-600">
                            {(user.full_name || user.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-toss-grey-900">{user.full_name || user.username}</div>
                            <div className="text-xs text-toss-grey-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-1 text-sm text-toss-grey-700 font-medium">
                          {user.is_admin && <Shield size={14} className="text-toss-blue" />}
                          {user.role.toUpperCase()}
                        </div>
                      </td>
                      <td className="p-5"><StatusBadge user={user} /></td>
                      <td className="p-5 text-sm text-toss-grey-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateUserStatus(user.id, !user.is_active)}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active
                                ? 'hover:bg-red-50 text-toss-grey-400 hover:text-red-500'
                                : 'hover:bg-emerald-50 text-toss-grey-400 hover:text-emerald-500'
                            }`}
                            title={user.is_active ? '비활성화' : '활성화'}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : user.is_active ? (
                              <XCircle size={18} />
                            ) : (
                              <CheckCircle size={18} />
                            )}
                          </button>
                          <button className="p-2 hover:bg-toss-grey-100 rounded-lg text-toss-grey-400 hover:text-toss-grey-700 transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 bg-white border border-toss-grey-100 rounded-3xl">
                <Loader2 className="w-8 h-8 text-toss-blue animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 bg-white border border-toss-grey-100 rounded-3xl">
                <div className="w-16 h-16 bg-toss-grey-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-toss-grey-300" />
                </div>
                <h3 className="text-lg font-bold text-toss-grey-900 mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-toss-grey-500">다른 검색어를 시도해보세요</p>
              </div>
            ) : (
              users.map(user => (
                <div key={user.id} className="bg-white border border-toss-grey-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:shadow-toss-grey-200/50 hover:border-toss-grey-200 transition-all duration-200 cursor-pointer active:scale-[0.99]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-toss-grey-100 flex items-center justify-center text-base font-bold text-toss-grey-600">
                        {(user.full_name || user.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-toss-grey-900 text-lg">{user.full_name || user.username}</div>
                        <div className="text-xs text-toss-grey-500">{user.email}</div>
                      </div>
                    </div>
                    <button className="text-toss-grey-400 hover:text-toss-grey-700"><MoreVertical size={20} /></button>
                  </div>
                  <div className="flex items-center justify-between border-t border-toss-grey-100 pt-3 mt-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge user={user} />
                      {user.is_admin && (
                        <span className="flex items-center gap-1 text-xs text-toss-blue font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                          <Shield size={10} /> ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-toss-grey-400">
                      가입일 {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-toss-grey-200 hover:bg-toss-grey-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-toss-grey-600 px-4">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-toss-grey-200 hover:bg-toss-grey-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Monitoring Content */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={fetchSystemHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-xl transition-colors border border-toss-grey-200 text-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              새로고침
            </button>
          </div>

          {loading && !systemHealth ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-toss-blue animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Activity size={20} /></div>
                    <h3 className="text-lg font-bold text-toss-grey-900">KIS API 상태</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${systemHealth?.kis_api?.operational ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-bold ${systemHealth?.kis_api?.operational ? 'text-emerald-600' : 'text-red-600'}`}>
                      {systemHealth?.kis_api?.operational ? '정상 작동 중' : '연결 실패'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-toss-grey-500">응답 시간</span>
                      <span className="text-toss-grey-900 font-medium">
                        {systemHealth?.kis_api?.response_time_ms ?? '-'}ms
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-toss-grey-500">에러율</span>
                      <span className="text-toss-grey-900 font-medium">
                        {systemHealth?.kis_api?.error_rate_percent ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-xl text-toss-blue"><Database size={20} /></div>
                    <h3 className="text-lg font-bold text-toss-grey-900">데이터베이스</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${systemHealth?.database?.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-bold ${systemHealth?.database?.connected ? 'text-emerald-600' : 'text-red-600'}`}>
                      {systemHealth?.database?.connected ? '정상' : '연결 실패'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-toss-grey-500">활성 연결</span>
                      <span className="text-toss-grey-900 font-medium">
                        {systemHealth?.database?.active_connections ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-toss-grey-500">응답 시간</span>
                      <span className="text-toss-grey-900 font-medium">
                        {systemHealth?.database?.response_time_ms ?? '-'}ms
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-violet-50 rounded-xl text-violet-600"><Server size={20} /></div>
                    <h3 className="text-lg font-bold text-toss-grey-900">Redis 캐시</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${systemHealth?.redis?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <span className={`text-sm font-bold ${systemHealth?.redis?.connected ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {systemHealth?.redis?.connected ? '실행 중' : '미연결'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-toss-grey-500">적중률 (Hit Rate)</span>
                      <span className="text-toss-grey-900 font-medium">
                        {systemHealth?.redis?.hit_rate_percent ?? '-'}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-toss-grey-500">메모리</span>
                      <span className="text-toss-grey-900 font-medium">
                        {systemHealth?.redis?.used_memory_mb ?? '-'}MB
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-toss-grey-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-toss-grey-900 mb-2">시스템 상태</h3>
                <p className="text-sm text-toss-grey-500 mb-4">
                  마지막 업데이트: {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleString('ko-KR') : '-'}
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                  systemHealth?.status === 'healthy'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : systemHealth?.status === 'degraded'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  {systemHealth?.status === 'healthy' ? '모든 시스템 정상' :
                   systemHealth?.status === 'degraded' ? '일부 서비스 저하' : '시스템 오류'}
                </div>
              </div>
            </>
          )}
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
              <button
                onClick={handleFlushCache}
                disabled={actionLoading === 'flush'}
                className="w-full flex items-center justify-between p-4 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-2xl transition-colors border border-toss-grey-100 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {actionLoading === 'flush' ? (
                    <Loader2 size={18} className="text-toss-grey-500 animate-spin" />
                  ) : (
                    <RefreshCw size={18} className="text-toss-grey-500" />
                  )}
                  <span className="text-toss-grey-900 text-sm font-medium">Redis 캐시 초기화</span>
                </div>
                <span className="text-xs text-toss-grey-500">수동 실행</span>
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-toss-grey-50 hover:bg-toss-grey-100 rounded-2xl transition-colors border border-toss-grey-100">
                <div className="flex items-center gap-3">
                  <Database size={18} className="text-toss-grey-500" />
                  <span className="text-toss-grey-900 text-sm font-medium">데이터베이스 백업</span>
                </div>
                <span className="text-xs text-toss-grey-500">마지막: -</span>
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
