/**
 * Error Boundary Component
 * Place this in: components/ErrorBoundary.jsx
 * 
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Send to error tracking service
    if (typeof window !== 'undefined' && window.errorTracker) {
      window.errorTracker.logComponentError({
        error: error.toString(),
        errorInfo,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }

    // Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 flex items-center justify-center">
          <Card className="relative bg-white/98 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/15 to-transparent rounded-bl-full" />
            
            <div className="relative p-8 sm:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-6 shadow-2xl">
                  <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} aria-hidden="true" />
                </div>
                
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">
                  Something Went Wrong
                </h2>
                
                <p className="text-gray-600 text-base mb-6">
                  We apologize for the inconvenience. An unexpected error occurred.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="text-sm text-red-600 font-mono overflow-auto">
                      <p className="mb-2"><strong>Error:</strong> {this.state.error.toString()}</p>
                      {this.state.errorInfo && (
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={this.handleReset}
                    className="h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white hover:scale-105 shadow-lg transition-all duration-300"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" strokeWidth={2.5} />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="h-12 px-8 rounded-xl font-bold border-2 border-gray-300 hover:border-[#1ABA7F] transition-all duration-300"
                  >
                    Reload Page
                  </Button>
                </div>

                {this.state.errorCount > 2 && (
                  <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800 font-semibold">
                      This error has occurred multiple times. Please contact support if the problem persists.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Hook-based error boundary (for functional components)
 * Note: This doesn't catch render errors, only async errors
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((err) => {
    console.error('Error caught by useErrorHandler:', err);
    setError(err);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, resetError };
};

/**
 * Async Error Boundary for handling promise rejections
 */
export class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  componentDidMount() {
    // Catch unhandled promise rejections
    this.unhandledRejectionHandler = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.setState({
        hasError: true,
        error: event.reason
      });
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AsyncErrorBoundary caught error:', error, errorInfo);
    
    if (typeof window !== 'undefined' && window.errorTracker) {
      window.errorTracker.logAsyncError({
        error: error.toString(),
        errorInfo,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.handleReset)
      ) : (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-600 font-semibold mb-4">
            An async operation failed: {this.state.error?.message || 'Unknown error'}
          </p>
          <Button onClick={this.handleReset} variant="outline">
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Network Error Boundary - specifically for network-related errors
 */
export const NetworkErrorBoundary = ({ children, onNetworkError }) => {
  const [hasNetworkError, setHasNetworkError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(true); // Start as true

  React.useEffect(() => {
    // Set initial online state after mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (hasNetworkError) {
        setHasNetworkError(false);
        setRetryCount(0);
        window.location.reload();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasNetworkError(true);
      if (onNetworkError) {
        onNetworkError();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasNetworkError, onNetworkError]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  // Only show error if we're actually offline
  if (!isOnline || hasNetworkError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 flex items-center justify-center">
        <Card className="relative bg-white/98 backdrop-blur-xl border-2 border-orange-500/30 rounded-3xl shadow-2xl overflow-hidden max-w-lg mx-auto">
          <div className="relative p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mb-6 shadow-2xl">
              <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-4">
              No Internet Connection
            </h2>
            
            <p className="text-gray-600 text-base mb-6">
              Please check your internet connection and try again.
            </p>

            <Button
              onClick={handleRetry}
              className="h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white hover:scale-105 shadow-lg transition-all duration-300"
            >
              <RefreshCw className="h-5 w-5 mr-2" strokeWidth={2.5} />
              Retry {retryCount > 0 && `(${retryCount})`}
            </Button>

            {retryCount > 3 && (
                <p className="mt-4 text-sm text-gray-500">
                Still having trouble? Contact support for assistance.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return children;
};

/**
 * Usage examples in your main component:
 * 
 * 1. Wrap entire app:
 * <ErrorBoundary>
 *   <PrescriptionMedicationsPage />
 * </ErrorBoundary>
 * 
 * 2. Wrap specific sections:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <PharmacyRecommendations ... />
 * </ErrorBoundary>
 * 
 * 3. Network-specific handling:
 * <NetworkErrorBoundary onNetworkError={() => console.log('Network failed')}>
 *   <PrescriptionMedicationsPage />
 * </NetworkErrorBoundary>
 * 
 * 4. Async operations:
 * <AsyncErrorBoundary fallback={(error, reset) => (
 *   <div>Error: {error.message} <button onClick={reset}>Retry</button></div>
 * )}>
 *   <YourAsyncComponent />
 * </AsyncErrorBoundary>
 */

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = (Component, fallback) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

/**
 * Global error handler setup
 * Add this to your _app.js or root layout
 */
export const setupGlobalErrorHandlers = () => {
  if (typeof window === 'undefined') return;

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: event.error?.toString() || 'Unknown error',
        fatal: false
      });
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: event.reason?.toString() || 'Unhandled promise rejection',
        fatal: false
      });
    }
  });
};
