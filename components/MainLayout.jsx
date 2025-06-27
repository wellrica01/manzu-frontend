'use client';

import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Instagram, Facebook, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useOrder } from '@/hooks/useOrder';

export const metadata = {
  title: 'Manzu - Trusted Healthcare for Every Nigerian',
  description: 'Discover medications and diagnostic services with ease across Nigeria.',
  openGraph: {
    title: 'Manzu',
    description: 'Discover medications and diagnostic services with ease across Nigeria.',
    url: 'https://manzu.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Manzu Platform' }],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function MainLayout({ children }) {
  const { orderItemCount, fetchOrder } = useOrder();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Order', href: '/order', icon: ShoppingCart },
    { name: 'Track Order', href: '/track-order' },
    { name: 'Results', href: '/results' },
    { name: 'Check Status', href: '/check-status' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#1ABA7F]/10">
      <nav
        className="sticky top-0 bg-white/15 z-50 border-b border-[#1ABA7F]/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(26,186,127,0.15)] animate-in slide-in-from-top duration-300"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F]"
            aria-label="Manzu Homepage"
          >
            <Image
              src="/logo_1.png"
              alt="Manzu Logo"
              width={120}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-base font-medium text-[#225F91] hover:text-[#1ABA7F] hover:bg-[#1ABA7F]/20 px-4 py-2 rounded-full transition-all duration-300 hover:shadow-sm relative flex items-center gap-2"
                aria-label={item.name === 'Order' ? `Order with ${orderItemCount} items` : item.name}
              >
                {item.icon && <item.icon className="h-5 w-5" aria-hidden="true" />}
                {item.name}
                {item.name === 'Order' && orderItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1ABA7F] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {orderItemCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden p-2 bg-[#1ABA7F]/20 rounded-full hover:bg-[#1ABA7F]/40 transition-all duration-300"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-[#225F91]" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] sm:w-[340px] bg-white/45 backdrop-blur-lg border-l border-[#1ABA7F]/20"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <Button
                  variant="ghost"
                  className="absolute top-4 right-4 p-2 bg-[#1ABA7F]/20 rounded-full hover:bg-[#1ABA7F]/30"
                  aria-label="Close menu"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-6 w-6 text-[#225F91]" aria-hidden="true" />
                </Button>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-12 px-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium text-[#225F91] hover:bg-[#1ABA7F]/20 hover:text-[#1ABA7F] px-4 py-3 rounded-full transition-all duration-300 relative"
                    aria-label={item.name === 'Order' ? `Order with ${orderItemCount} items` : item.name}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon && <item.icon className="h-5 w-5 inline-block mr-2" aria-hidden="true" />}
                    {item.name}
                    {item.name === 'Order' && orderItemCount > 0 && (
                      <span className="absolute top-4 right-4 bg-[#1ABA7F] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {orderItemCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <Image
                src="/logo_1.png"
                alt="Manzu Logo"
                width={120}
                height={48}
                className="h-10 w-auto object-contain mb-4"
              />
              <p className="text-sm text-white/80 font-medium max-w-xs">
                Manzu: Your trusted platform for medications and diagnostic services across Nigeria.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              {['About', 'Contact', 'Privacy Policy', 'How It Works'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(' ', '-')}`}
                  className="text-white/90 hover:text-white text-base font-medium transition-all duration-200 hover:underline"
                  aria-label={item}
                >
                  {item}
                </Link>
              ))}
            </div>
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
              <div className="flex justify-center md:justify-start gap-4">
                {[
                  { name: 'Twitter', href: 'https://twitter.com/manzu_pharmacy', icon: Twitter },
                  { name: 'Instagram', href: 'https://instagram.com/manzu_pharmacy', icon: Instagram },
                  { name: 'Facebook', href: 'https://facebook.com/manzu.pharmacy', icon: Facebook },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#1ABA7F] hover:bg-[#225F91]/20 p-2 rounded-full transition-all duration-300 hover:scale-110"
                    aria-label={social.name}
                  >
                    <social.icon className="h-6 w-6" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#1ABA7F]/20 text-center">
            <p className="text-sm text-white/80 font-medium">
              © 2025 Manzu. Powered by WellRica.
            </p>
          </div>
        </div>
      </footer>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.95)',
            color: '#225F91',
            border: '1px solid rgba(26,186,127,0.3)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 20px rgba(26,186,127,0.2)',
            padding: '1rem',
            backdropFilter: 'blur(8px)',
          },
          error: {
            style: {
              background: 'rgba(255,85,85,0.95)',
              color: '#ffffff',
              border: '1px solid rgba(34,95,145,0.3)',
              boxShadow: '0 4px 20px rgba(34,95,145,0.2)',
            },
          },
        }}
      />
    </div>
  );
}