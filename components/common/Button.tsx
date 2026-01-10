import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-toss-blue text-white hover:bg-blue-600 shadow-sm shadow-blue-200 focus:ring-blue-500",
    secondary: "bg-toss-grey-100 text-toss-grey-800 hover:bg-toss-grey-200 focus:ring-toss-grey-400",
    ghost: "bg-transparent text-toss-grey-600 hover:bg-toss-grey-50 hover:text-toss-grey-900 focus:ring-toss-grey-200",
    danger: "bg-red-50 text-toss-red hover:bg-red-100 focus:ring-red-200 border border-red-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[32px]",
    md: "px-4 py-2.5 text-sm gap-2 min-h-[44px]",
    lg: "px-6 py-3.5 text-base gap-2.5 min-h-[52px]"
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
};
