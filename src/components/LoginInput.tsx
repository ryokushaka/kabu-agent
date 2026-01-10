import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './LoginIcons';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
}

export const LoginInput: React.FC<InputProps> = ({ label, type = "text", error, className, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className || ''}`}>
      <label className="text-sm font-semibold text-toss-grey-700 ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          type={inputType}
          className={`
            w-full px-4 py-3.5 
            bg-toss-grey-50 border border-transparent 
            rounded-2xl text-toss-grey-900 placeholder-toss-grey-400
            transition-all duration-200 ease-in-out
            focus:bg-white focus:border-toss-blue focus:ring-4 focus:ring-blue-500/10
            outline-none text-[15px]
            ${error ? 'bg-red-50 border-toss-red focus:border-toss-red focus:ring-red-500/10' : 'hover:bg-toss-grey-100'}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
