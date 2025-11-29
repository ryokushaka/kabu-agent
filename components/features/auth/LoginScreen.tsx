import React, { useState } from 'react';
import { Eye, EyeOff, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username: email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-toss-grey-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-toss-blue to-blue-600 rounded-3xl shadow-lg shadow-blue-200 mb-6">
            <TrendingUp className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-toss-grey-900 mb-2">
            해외주식 포트폴리오
          </h1>
          <p className="text-toss-grey-500">
            안전하고 편리한 자산 관리
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-toss-grey-100 rounded-3xl shadow-sm p-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {loginError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-toss-red shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-toss-grey-900 mb-1">로그인 실패</h3>
                  <p className="text-sm text-toss-grey-700">
                    {loginError instanceof Error
                      ? loginError.message
                      : '이메일 또는 비밀번호가 올바르지 않습니다.'}
                  </p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-toss-grey-700 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                required
                className="w-full bg-white border border-toss-grey-200 text-toss-grey-900 rounded-xl px-4 py-3 focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-300 disabled:bg-toss-grey-50 disabled:text-toss-grey-400 outline-none transition-all duration-200"
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-toss-grey-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  required
                  className="w-full bg-white border border-toss-grey-200 text-toss-grey-900 rounded-xl px-4 py-3 pr-12 focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/10 hover:border-toss-grey-300 disabled:bg-toss-grey-50 disabled:text-toss-grey-400 outline-none transition-all duration-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoggingIn}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-toss-grey-400 hover:text-toss-grey-600 disabled:text-toss-grey-300 transition-colors p-1 rounded-lg hover:bg-toss-grey-50 focus:outline-none focus:ring-2 focus:ring-toss-blue/10"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-300/50 active:scale-[0.98] disabled:bg-toss-grey-200 disabled:text-toss-grey-400 disabled:cursor-not-allowed disabled:hover:shadow-none text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 min-h-[52px] flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* Demo Account Info */}
          <div className="mt-6 pt-6 border-t border-toss-grey-100">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-medium text-toss-grey-500 mb-2">데모 계정</p>
              <p className="text-sm text-toss-grey-700 font-mono">
                demo@example.com / password
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-toss-grey-500">
            로그인하시면 <span className="text-toss-grey-700 font-medium">서비스 이용약관</span> 및{' '}
            <span className="text-toss-grey-700 font-medium">개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
