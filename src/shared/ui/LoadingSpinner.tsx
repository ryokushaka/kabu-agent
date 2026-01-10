/**
 * Loading Spinner Component
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md'
}) => {
  const { t } = useTranslation('common');
  const displayMessage = message ?? t('labels.loading');
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <RefreshCw
          className={`${sizeClasses[size]} animate-spin text-blue-500 mx-auto mb-4`}
        />
        <p className="text-slate-400">{displayMessage}</p>
      </div>
    </div>
  );
};
