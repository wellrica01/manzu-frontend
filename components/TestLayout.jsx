'use client';

import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Facebook, Instagram, Microscope } from 'lucide-react';
import Image from 'next/image';
import { useBooking } from '@/hooks/useBooking';

export default function TestLayout({ children }) {
  const { bookingItemCount, fetchBookings } = useBooking();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchBookings(); // Initial fetch, cached by react-query
  }, [fetchBookings]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/95">
      <nav
        className="sticky top-0 bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-md z-50 border-b border-gray-100/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-top-0 duration-300"
        role="navigation"
        aria-label="Test navigation"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center transition-transform duration-300 hover:scale-110"
            aria-label="Manzu Homepage"
          >
            <Image
              src="/logo_1.png"
              alt="Manzu Logo"
              width={120}
              height={48}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/"
              className="text-lg font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-4 py-2 rounded-full transition-all duration-200"
              aria-label="Home"
            >
              Home
            </Link>
            <Link
              href="/test"
              className="text-lg font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-4 py-2 rounded-full transition-all duration-200"
              aria-label="Test Services"
            >
              Test Services
            </Link>
            <Link
              href="/test/track"
              className="text-lg font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-4 py-2 rounded-full transition-all duration-200"
              aria-label="Track Test"
            >
              Track Test
            </Link>
            <Link
              href="/test/booking"
              className="text-lg font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-4 py-2 rounded-full relative flex items-center gap-2 transition-all duration-200"
              aria-label={`Booking with ${bookingItemCount} items`}
            >
              <Microscope className="h-5 w-5" aria-hidden="true" />
              {bookingItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {bookingItemCount}
                </span>
              )}
            </Link>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-all duration-200"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-primary" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[260px] sm:w-[320px] bg-white/95 backdrop-blur-md border-l border-gray-100/30"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">Test Navigation</SheetTitle>
                <Button
                  variant="ghost"
                  className="absolute top-4 right-4 p-2 bg-gray-100/50 rounded-full hover:bg-gray-200/50"
                  aria-label="Close menu"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5 text-primary" aria-hidden="true" />
                </Button>
              </SheetHeader>
              <div className="flex flex-col gap-3 mt-10 px-4">
                <Link
                  href="/"
                  className="text-lg font-semibold text-primary hover:bg-primary/10 px-4 py-3 rounded-full transition-all duration-200"
                  aria-label="Home"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/test"
                  className="text-lg font-semibold text-primary hover:bg-primary/10 px-4 py-3 rounded-full transition-all duration-200"
                  aria-label="Test Services"
                  onClick={() => setIsOpen(false)}
                >
                  Test Services
                </Link>
                <Link
                  href="/test/booking"
                  className="text-lg font-semibold text-primary hover:bg-primary/10 px-4 py-3 rounded-full relative transition-all duration-200"
                  aria-label={`Booking with ${bookingItemCount} items`}
                  onClick={() => setIsOpen(false)}
                >
                  <Microscope className="h-5 w-5 inline-block mr-2" aria-hidden="true" />
                  Booking
                  {bookingItemCount > 0 && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {bookingItemCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/test/track"
                  className="text-lg font-semibold text-primary hover:bg-primary/10 px-4 py-3 rounded-full transition-all duration-200"
                  aria-label="Track Test"
                  onClick={() => setIsOpen(false)}
                >
                  Track Test
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="bg-gradient-to-r from-primary to-green-700 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex justify-center gap-6">
              <a
                href="https://twitter.com/manzu_pharmacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-200 transition-all duration-300 hover:scale-125"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://facebook.com/manzu_pharmacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-200 transition-all duration-300 hover:scale-125"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com/manzu_pharmacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-200 transition-all duration-300 hover:scale-125"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
            <p className="text-sm text-white/80 font-medium">
              © 2025 Manzu. Powered by WellRica.
            </p>
            <div className="flex flex-col items-center sm:flex-row justify-center gap-4 sm:gap-8">
              <Link
                href="/about"
                className="text-white hover:text-gray-200 text-base font-medium transition-all duration-200 hover:underline"
                aria-label="About"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-white hover:text-gray-200 text-base font-medium transition-all duration-200 hover:underline"
                aria-label="Contact"
              >
                Contact
              </Link>
              <Link
                href="/privacy-policy"
                className="text-white hover:text-gray-200 text-base font-medium transition-all duration-200 hover:underline"
                aria-label="Privacy Policy"
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
            background: 'rgba(255,255,255,0.95)',
            color: 'var(--foreground)',
            border: '1px solid rgba(209,213,219,0.5)',
            borderRadius: '1rem',
            boxShadow: '0 4px 20px rgba(59,130,246,0.2)',
            padding: '1rem',
            backdropFilter: 'blur(8px)',
          },
          error: {
            style: {
              background: 'rgba(239,68,68,0.95)',
              color: 'white',
              border: '1px solid rgba(220,38,38,0.5)',
              boxShadow: '0 4px 20px rgba(220,38,38,0.2)',
            },
          },
        }}
      />
    </div>
  );
}