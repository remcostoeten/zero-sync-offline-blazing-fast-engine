'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Database, Wifi, Home } from 'lucide-react';

type ErrorType = 
  | 'database'
  | 'sync' 
  | 'network'
  | 'validation'
  | 'unknown';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, errorType: ErrorType, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorType: ErrorType;
  errorId: string;
  retryCount: number;
};

export class DatabaseErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorType = DatabaseErrorBoundary.classifyError(error);
    const errorId = `${errorType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorType,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('🔴 Error Boundary caught error:', {
      error,
      errorInfo,
      errorType: this.state.errorType,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send error to monitoring service (in production)
    this.reportError(error, errorInfo);

    // Auto-retry for certain error types
    if (this.shouldAutoRetry(this.state.errorType) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset on props change if enabled
    if (hasError && resetOnPropsChange && prevProps.resetKeys !== resetKeys) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private static classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('database') || message.includes('sqlite') || message.includes('sql')) {
      return 'database';
    }

    if (message.includes('sync') || message.includes('offline') || message.includes('network')) {
      return 'sync';
    }

    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return 'network';
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }

    // Check stack trace for more clues
    if (stack.includes('database') || stack.includes('sync-orchestrator')) {
      return 'sync';
    }

    return 'unknown';
  }

  private shouldAutoRetry(errorType: ErrorType): boolean {
    return ['network', 'sync'].includes(errorType);
  }

  private scheduleRetry() {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    this.resetTimeoutId = window.setTimeout(() => {
      console.log(`🔄 Auto-retrying after ${retryDelay}ms (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
      this.retry();
    }, retryDelay);
  }

  private retry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: prevState.retryCount + 1
    }));

    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: 'unknown',
      errorId: '',
      retryCount: 0
    });

    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
  };

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error monitoring service
    // For now, just store locally for debugging
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        errorType: this.state.errorType,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: this.state.retryCount
      };

      // Store in localStorage for debugging (limit to last 10 errors)
      const storedErrors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      storedErrors.unshift(errorReport);
      localStorage.setItem('app-errors', JSON.stringify(storedErrors.slice(0, 10)));

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private getErrorIcon(errorType: ErrorType) {
    switch (errorType) {
      case 'database':
        return <Database className="h-12 w-12 text-red-500" />;
      case 'sync':
      case 'network':
        return <Wifi className="h-12 w-12 text-red-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
    }
  }

  private getErrorTitle(errorType: ErrorType): string {
    switch (errorType) {
      case 'database':
        return 'Database Error';
      case 'sync':
        return 'Sync Error';
      case 'network':
        return 'Network Error';
      case 'validation':
        return 'Validation Error';
      default:
        return 'Something Went Wrong';
    }
  }

  private getErrorDescription(error: Error, errorType: ErrorType): string {
    switch (errorType) {
      case 'database':
        return 'There was a problem with the local database. Your data is safe, but some features may not work properly.';
      case 'sync':
        return 'Unable to sync your data with the cloud. You can continue working offline, and we\'ll sync when the connection is restored.';
      case 'network':
        return 'Network connection issue detected. Please check your internet connection and try again.';
      case 'validation':
        return 'The data provided is invalid. Please check your input and try again.';
      default:
        return 'An unexpected error occurred. We\'ve been notified and are working on a fix.';
    }
  }

  private getRecoveryActions(errorType: ErrorType) {
    const actions = [];

    // Always show retry button
    actions.push(
      <Button key="retry" onClick={this.retry} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    );

    // Type-specific actions
    switch (errorType) {
      case 'database':
        actions.push(
          <Button key="refresh" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh App
          </Button>
        );
        break;
        
      case 'network':
      case 'sync':
        actions.push(
          <Button 
            key="offline" 
            variant="outline" 
            onClick={() => {
              // Continue in offline mode
              this.resetError();
            }}
          >
            Continue Offline
          </Button>
        );
        break;
    }

    // Always show home button
    actions.push(
      <Button key="home" variant="outline" onClick={() => window.location.href = '/'}>
        <Home className="h-4 w-4 mr-2" />
        Go Home
      </Button>
    );

    return actions;
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorType, this.retry);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="mb-6">
              {this.getErrorIcon(this.state.errorType)}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {this.getErrorTitle(this.state.errorType)}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {this.getErrorDescription(this.state.error, this.state.errorType)}
            </p>

            {this.state.retryCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Retry attempt {this.state.retryCount} of {this.maxRetries}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {this.getRecoveryActions(this.state.errorType)}
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {this.state.errorId}
                </p>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for hooks
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <DatabaseErrorBoundary {...props} />;
}

// Specialized error boundaries for different parts of the app
export function SyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Sync operation failed:', error);
      }}
      fallback={(error, errorType, retry) => (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Sync Issue</h3>
          </div>
          <p className="text-sm text-orange-700 mb-4">
            Unable to sync your changes to the cloud. Your data is safely stored locally.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={retry} variant="outline">
              Retry Sync
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
              Continue Offline
            </Button>
          </div>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function DatabaseErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Database operation failed:', error);
      }}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}
