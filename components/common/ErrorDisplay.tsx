/**
 * Error Display Component
 */
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '../../services/api/client';

interface ErrorDisplayProps {
  error: Error | ApiError | null;
  onRetry?: () => void;
  message?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  message
}) => {
  const getErrorMessage = () => {
    if (message) return message;
    if (!error) return 'An unknown error occurred';

    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          return 'Authentication failed. Please login again.';
        case 403:
          return 'You do not have permission to access this resource.';
        case 404:
          return 'The requested resource was not found.';
        case 408:
          return 'Request timeout. Please check your connection and try again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return error.message;
      }
    }

    return error.message || 'An error occurred';
  };

  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="text-center max-w-md">
        <div className="bg-rose-950 border border-rose-900 rounded-xl p-6">
          <div className="w-12 h-12 bg-rose-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-rose-400 mb-4">{getErrorMessage()}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
