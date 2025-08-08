'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Instagram, Facebook, ShoppingCart, Home, FileText, MapPin, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from 'react-i18next';

export default function MainLayout({ children }) {
  const { cartItemCount, fetchCart, cart, isPending } = useCart();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navRef = useRef(null);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 50);
    setShowScrollTop(currentScrollY > 200);
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsNavVisible(false);
    } else {
      setIsNavVisible(true);
    }
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  const fetchCartWithRetry = useCallback(async () => {
    try {
      await fetchCart();
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, [fetchCart]);

  useEffect(() => {
    fetchCartWithRetry();
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [fetchCartWithRetry, handleScroll]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navItems = [
    { label: t('nav.home'), icon: Home, href: '/', badge: null },
    { label: t('nav.check_status'), icon: FileText, href: '/check-prescription-status', badge: null },
    { label: t('nav.track_order'), icon: MapPin, href: '/track-order', badge: null },
    { label: t('nav.cart'), icon: ShoppingCart, href: '/cart', badge: cartItemCount > 0 ? cartItemCount : null },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#1ABA7F]/5 min-w-[320px]">
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 border-b border-[#1ABA7F]/20 transition-transform duration-300 ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        } ${isScrolled ? 'shadow-md' : ''}`}
        role="navigation"
        aria-label={t('nav.medication_navigation')}
      >
        <div className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-[90vw] xl:max-w-[85vw] mx-auto px-1 sm:px-2 py-3 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] rounded-md p-1"
            aria-label={t('nav.homepage')}
          >
            <Image
              src="/logo_1.png"
              alt="Manzu Logo"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative p-2 text-[#225F91] hover:text-[#1ABA7F] focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] rounded-md"
              aria-label={cartItemCount > 0 ? `${t('nav.cart')} with ${cartItemCount} items` : t('nav.cart')}
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#1ABA7F] text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 text-[#225F91] hover:text-[#1ABA7F] focus:ring-2 focus:ring-[#1ABA7F]"
                  aria-label={t('nav.toggle_menu')}
                >
                  {isOpen ? <X className="h-6 w-6 sm:h-6 sm:w-6" /> : <Menu className="h-6 w-6 sm:h-6 sm:w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[60vw] max-w-[360px] bg-white/95 p-4">
                <div className="flex flex-col gap-2 mt-7">
                  {navItems.map(({ label, icon: Icon, href, badge }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center gap-3 px-4 py-3 text-sm sm:text-base font-medium text-[#225F91] hover:bg-[#1ABA7F]/10 hover:text-[#1ABA7F] rounded-lg transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                      aria-label={badge ? `${label} with ${badge} items` : label}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{label}</span>
                      {badge && (
                        <span className="bg-[#1ABA7F] text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                          {badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {navItems.map(({ label, icon: Icon, href, badge }) => (
              <Link
                key={label}
                href={href}
                className="relative flex items-center gap-2 text-sm sm:text-base font-medium text-[#225F91] hover:text-[#1ABA7F] hover:bg-[#1ABA7F]/10 px-3 py-2 rounded-md transition-colors duration-200"
                aria-label={badge ? `${label} with ${badge} items` : label}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{label}</span>
                {badge && (
                  <span className="absolute -top-1 -right-1 bg-[#1ABA7F] text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full mx-auto px-1 sm:px-2 pt-[50px] sm:pt-[68px] max-w-[95vw] sm:max-w-3xl lg:max-w-[90vw] xl:max-w-[85vw]">
        {children}
      </main>

      <footer className="bg-[#225F91] text-white">
        <div className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-[90vw] xl:max-w-[85vw] mx-auto px-1 sm:px-2 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/logo_1.png"
                alt="Manzu Logo"
                width={100}
                height={32}
                className="h-8 w-auto object-contain mb-4 mx-auto"
              />
              <p className="text-xs sm:text-sm text-white/80 max-w-xs w-full leading-relaxed">
                {t('footer.description')}
              </p>
              <div className="mt-4 space-y-2 w-full">
                <p className="text-xs sm:text-sm text-white/80 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                  {t('footer.ussd')} <span className="font-bold">*123*456#</span>
                </p>
                <p className="text-xs sm:text-sm text-white/80 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                  {t('footer.whatsapp')} <a href="https://wa.me/+2341234567890" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#1ABA7F]">+2341234567890</a>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-3 flex items-center justify-center gap-2">
                <span className="w-1 h-5 bg-[#1ABA7F] rounded-full" />
                {t('footer.quick_links')}
              </h3>
              <div className="space-y-2 w-full">
                {['About', 'Contact', 'Privacy Policy'].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-white/90 hover:text-[#1ABA7F] text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                    aria-label={t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                  >
                    <span className="w-1 h-1 bg-[#1ABA7F] rounded-full" />
                    {t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-3 flex items-center justify-center gap-2">
                <span className="w-1 h-5 bg-[#1ABA7F] rounded-full" />
                {t('footer.connect')}
              </h3>
              <div className="flex justify-center gap-3 w-full">
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
                    className="text-white hover:text-[#1ABA7F] p-2 rounded-full transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#1ABA7F]/20 text-center">
            <p className="text-xs sm:text-sm text-white/80 w-full">
              © 2025 Manzu. {t('footer.powered_by')}
            </p>
          </div>
        </div>
      </footer>

      <Button
        onClick={scrollToTop}
        className={`fixed bottom-4 right-4 z-50 p-2 bg-[#1ABA7F] text-white rounded-full shadow-md hover:bg-[#1A4971] transition-all duration-300 h-10 w-10 flex items-center justify-center ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
        aria-label={t('nav.scroll_to_top')}
      >
        <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.95)',
            color: '#225F91',
            border: '1px solid rgba(26,186,127,0.2)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 16px rgba(26,186,127,0.1)',
            padding: '0.75rem',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: '0.5rem',
          },
          error: {
            style: {
              background: 'rgba(239,68,68,0.95)',
              color: 'white',
              border: '1px solid rgba(34,95,145,0.2)',
              boxShadow: '0 4px 16px rgba(34,95,145,0.1)',
            },
          },
          success: {
            style: {
              background: 'rgba(34,197,94,0.95)',
              color: 'white',
              border: '1px solid rgba(26,186,127,0.2)',
              boxShadow: '0 4px 16px rgba(26,186,127,0.1)',
            },
          },
        }}
      />
    </div>
  );
}