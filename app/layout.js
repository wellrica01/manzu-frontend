import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import ErrorBoundary, { NetworkErrorBoundary, setupGlobalErrorHandlers } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize global JS error tracking
if (typeof window !== 'undefined') setupGlobalErrorHandlers();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary resetBehavior="reload">
          <NetworkErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <I18nextProvider i18n={i18n}>
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    Loading...
                  </div>
                }>
                  {children}
                </Suspense>
              </I18nextProvider>
            </QueryClientProvider>
          </NetworkErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
