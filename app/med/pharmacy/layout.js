import { Toaster } from '@/components/ui/sonner';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Manzu - Pharmacy Portal',
  description: 'Manage your pharmacy with Manzu’s professional tools.',
};

export default function PharmacyLayout({ children }) {
  return (
<div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95">
  <header className="sticky top-0 z-50 bg-gradient-to-r from-white/95 to-gray-50/95 border-b border-gray-100/20 backdrop-blur-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
    <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 hover:animate-pulse">
          Manzu Pharmacy
        </span>
      </h1>
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          asChild
          className="h-12 px-4 text-base font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] rounded-full transition-all duration-300"
          aria-label="Navigate to Dashboard"
        >
          <Link href="/pharmacy/dashboard">Dashboard</Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          className="h-12 px-4 text-base font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] rounded-full transition-all duration-300"
          aria-label="Navigate to Inventory"
        >
          <Link href="/pharmacy/inventory">Inventory</Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          className="h-12 px-4 text-base font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] rounded-full transition-all duration-300"
          aria-label="Navigate to Profile"
        >
          <Link href="/pharmacy/profile">Profile</Link>
        </Button>
      </div>
    </nav>
  </header>
  <main
    className="flex-1 container mx-auto px-6 py-12 max-w-7xl"
    role="main"
    aria-label="Pharmacy dashboard content"
  >
    <Suspense
      fallback={
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" aria-hidden="true" />
          <p className="text-gray-600 text-lg font-medium mt-4">Loading content...</p>
        </div>
      }
    >
      {children}
    </Suspense>
  </main>
  <Toaster
    position="top-right"
    toastOptions={{
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        color: 'var(--card-foreground)',
        border: '1px solid rgba(209, 213, 219, 0.3)',
        borderRadius: '1rem',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
        padding: '1.25rem',
        backdropFilter: 'blur(8px)',
      },
    }}
  />
</div>
  );
}