'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'] });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000, // Cache for 5 seconds
      refetchOnWindowFocus: false, // Prevent refetch on focus
    },
  },
});


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            {children}
          </I18nextProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}