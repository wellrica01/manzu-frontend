import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

class SearchErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service (e.g., Sentry)
    console.error('SearchBar Error:', error, errorInfo);
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 sm:p-8 bg-red-50 border border-red-200 rounded-lg sm:rounded-2xl">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We're sorry, but the search component encountered an error.
                Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="text-xs text-left bg-red-100 p-3 rounded overflow-auto max-w-full">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
            <Button
              onClick={this.handleReset}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SearchErrorBoundary;