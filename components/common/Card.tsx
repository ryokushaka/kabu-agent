import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hoverEffect = false,
  onClick
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseStyles = "bg-white border border-toss-grey-100 rounded-3xl shadow-sm overflow-hidden";
  const hoverStyles = hoverEffect 
    ? "hover:shadow-md hover:shadow-toss-grey-200/50 hover:border-toss-grey-200 transition-all duration-200 cursor-pointer group active:scale-[0.99]" 
    : "";

  return (
    <div 
      className={`
        ${baseStyles}
        ${paddings[padding]}
        ${hoverStyles}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
