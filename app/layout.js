'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary, { setupGlobalErrorHandlers } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

if (typeof window !== 'undefined') setupGlobalErrorHandlers();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary resetBehavior="reload">
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              {children}
            </I18nextProvider>
          </QueryClientProvider>
        </ErrorBoundary>

        {/* ✅ Our improved Sonner Toaster */}
        <Toaster />
      </body>
    </html>
  );
}
