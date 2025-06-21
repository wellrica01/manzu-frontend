'use client';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


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
      <body>
        <QueryClientProvider client={queryClient}>
        {children} 
        </QueryClientProvider>
        </body>
    </html>
  );
}