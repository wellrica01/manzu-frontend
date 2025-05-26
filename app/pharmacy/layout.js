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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="bg-primary/5 border-b border-border">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Manzu Pharmacy</h1>
          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/pharmacy/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pharmacy/inventory">Inventory</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pharmacy/profile">Profile</Link>
            </Button>
          </div>
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-6 py-8" role="main" aria-label="Pharmacy dashboard content">
        <Suspense fallback={<div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>}>
          {children}
        </Suspense>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            padding: '1rem',
          },
        }}
      />
    </div>
  );
}