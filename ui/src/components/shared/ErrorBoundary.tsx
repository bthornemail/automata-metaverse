import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

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
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
          <Card className="max-w-2xl" variant="outlined">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-gray-400 mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mb-4">
                    <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                      Error Details
                    </summary>
                    <pre className="text-xs text-gray-600 bg-gray-900 p-3 rounded overflow-auto">
                      {this.state.error?.stack}
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <div className="flex gap-3">
                  <Button onClick={this.handleReset} variant="primary">
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="secondary"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
