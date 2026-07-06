'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-slate-600 text-center mb-4">
                {process.env.NODE_ENV === 'development' && this.state.error?.message}
                {process.env.NODE_ENV === 'production' && 'We encountered an error. Please try refreshing the page.'}
              </p>
              <button
                onClick={this.resetError}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
