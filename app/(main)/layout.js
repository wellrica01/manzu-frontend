import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Manzu - Premium Pharmacy Platform',
  description: 'Discover medications and manage prescriptions with ease.',
};

export default function MainLayout({ children }) {
  return (
    <>
        <nav className="sticky top-0 bg-card z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-3xl font-bold text-primary">
              Manzu
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-foreground hover:text-secondary font-medium">
                Home
              </Link>
              <Link href="/cart" className="text-foreground hover:text-secondary font-medium">
                Cart
              </Link>
              <Link href="/track" className="text-foreground hover:text-secondary font-medium">
                Track Order
              </Link>
              <Link href="/pharmacy/dashboard" className="text-foreground hover:text-secondary font-medium">
                Pharmacy Dashboard
              </Link>
              <Link href="/pharmacy/register">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Register Pharmacy
                </Button>
              </Link>
              <Link href="/pharmacy/login">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Pharmacy Login
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <main className="min-h-screen">{children}</main>

        <footer className="bg-primary text-primary-foreground py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>© 2025 Manzu. All rights reserved.</p>
            <div className="mt-4 flex justify-center gap-6">
              <Link href="/about" className="hover:text-secondary">About</Link>
              <Link href="/contact" className="hover:text-secondary">Contact</Link>
              <Link href="/privacy" className="hover:text-secondary">Privacy Policy</Link>
            </div>
          </div>
        </footer>

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
    </>
  );
}