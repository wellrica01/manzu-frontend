import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

// Default export for metadata
export const metadata = {
  title: 'Manzu - Premium Pharmacy Platform',
  description: 'Discover medications and manage prescriptions with ease.',
  openGraph: {
    title: 'Manzu',
    description: 'Discover medications and manage prescriptions with ease.',
    url: 'https://manzu.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Platform' }],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function MainLayout({ children }) {
  return (
    <div>
        <nav className="sticky top-0 bg-card z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-3xl font-bold text-primary transition-transform hover:scale-105">
              Manzu
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-foreground hover:text-secondary font-medium transition-colors">
                Home
              </Link>
              <Link href="/cart" className="text-foreground hover:text-secondary font-medium transition-colors">
                Cart
              </Link>
              <Link href="/track" className="text-foreground hover:text-secondary font-medium transition-colors">
                Track Order
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
            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                {/* Accessibility requirement */}
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>

                {/* Your menu items */}
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/" className="text-foreground hover:text-secondary font-medium">
                    Home
                  </Link>
                  <Link href="/cart" className="text-foreground hover:text-secondary font-medium">
                    Cart
                  </Link>
                  <Link href="/track" className="text-foreground hover:text-secondary font-medium">
                    Track Order
                  </Link>
                  <Link href="/pharmacy/register">
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      Register Pharmacy
                    </Button>
                  </Link>
                  <Link href="/pharmacy/login">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Pharmacy Login
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        <main className="min-h-screen">{children}</main>

        <footer className="bg-primary text-primary-foreground py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">© 2025 Manzu. All rights reserved.</p>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/about" className="text-neutral-50 hover:text-secondary transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-neutral-50 hover:text-secondary transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="text-neutral-50 hover:text-secondary transition-colors">
                Privacy Policy
              </Link>
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
    </div>
  );
}