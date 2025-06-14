import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Facebook, Instagram } from 'lucide-react';
import Image from 'next/image';

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
    <div className="flex flex-col min-h-screen">
      <nav
        className="sticky top-0 bg-gradient-to-r from-primary/5 to-background z-50 shadow-sm"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center transition-transform hover:scale-105">
            <Image
              src="/logo_2.svg" // Updated to SVG
              alt="Manzu Logo"
              width={100}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-primary hover:text-secondary font-medium text-base transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/cart"
              className="text-primary hover:text-secondary font-medium text-base transition-colors duration-200"
            >
              Cart
            </Link>
            <Link
              href="/track"
              className="text-primary hover:text-secondary font-medium text-base transition-colors duration-200"
            >
              Track Order
            </Link>
            <Link href="/pharmacy/register">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground h-10 px-4 transition-colors duration-200"
              >
                Register Pharmacy
              </Button>
            </Link>
            <Link href="/pharmacy/login">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 transition-colors duration-200"
              >
                Pharmacy Login
              </Button>
            </Link>
          </div>
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden p-2"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px] bg-card">
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <Button
                  variant="ghost"
                  className="absolute top-4 right-4 p-2"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6 text-primary" />
                </Button>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className="text-primary hover:text-secondary font-medium text-base"
                >
                  Home
                </Link>
                <Link
                  href="/cart"
                  className="text-primary hover:text-secondary font-medium text-base"
                >
                  Cart
                </Link>
                <Link
                  href="/track"
                  className="text-primary hover:text-secondary font-medium text-base"
                >
                  Track Order
                </Link>
                <Link href="/pharmacy/register">
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground h-10 transition-colors duration-200"
                  >
                    Register Pharmacy
                  </Button>
                </Link>
                <Link href="/pharmacy/login">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 transition-colors duration-200"
                  >
                    Pharmacy Login
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

     <footer className="bg-primary text-primary-foreground py-12">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-center gap-4">
        <a
          href="https://twitter.com/manzu_pharmacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-50 hover:text-secondary transition-colors duration-200"
          aria-label="Twitter"
        >
          <Twitter className="h-5 w-5" />
        </a>
        <a
          href="https://facebook.com/manzu_pharmacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-50 hover:text-secondary transition-colors duration-200"
          aria-label="Facebook"
        >
          <Facebook className="h-5 w-5" />
        </a>
        <a
          href="https://instagram.com/manzu_pharmacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-50 hover:text-secondary transition-colors duration-200"
          aria-label="Instagram"
        >
          <Instagram className="h-5 w-5" />
        </a>
      </div>
      <p className="text-sm text-neutral-50">© 2025 Manzu. Powered by WellRica.</p>
      <div className="flex flex-col items-center sm:flex-row justify-center gap-4 sm:gap-6">
      <Link
        href="/about"
        className="text-neutral-50 hover:text-secondary text-base transition-colors duration-200"
      >
        About
      </Link>
      <Link
        href="/contact"
        className="text-neutral-50 hover:text-secondary text-base transition-colors duration-200"
      >
        Contact
      </Link>
      <Link
        href="/privacy-policy"
        className="text-neutral-50 hover:text-secondary text-base transition-colors duration-200"
      >
        Privacy Policy
      </Link>
    </div>
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
          error: {
            style: {
              background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              border: '1px solid var(--destructive)',
            },
          },
        }}
      />
    </div>
  );
}