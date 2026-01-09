/**
 * Error Boundary Component
 * Catches and displays React errors gracefully
 */
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-rose-900/50 rounded-xl p-8 max-w-2xl w-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-rose-950 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-slate-400 mb-4">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4">
                    <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-auto">
                      <pre className="text-xs text-rose-400">
                        {this.state.error.toString()}
                      </pre>
                      {this.state.errorInfo && (
                        <pre className="text-xs text-slate-500 mt-2">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                  </button>
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
