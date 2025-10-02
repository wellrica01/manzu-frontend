'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Instagram, Facebook, ShoppingCart, Home, FileText, MapPin, ChevronUp, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'react-error-boundary';

// Environment configuration
const CONFIG = {
  socialMedia: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/manzu_pharmacy',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/manzu_pharmacy',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/manzu.pharmacy',
  },
  images: {
    pharmacyCTA: process.env.NEXT_PUBLIC_PHARMACY_CTA_IMAGE || '/images/pharmacy-cta.jpg',
    logo: '/logo_1.png',
  }
};

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4" role="alert">
      <div className="text-center max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-[#225F91] mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <Button 
          onClick={resetErrorBoundary} 
          className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

// Optimized Cart Badge Component
const CartBadge = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <span 
      className="absolute -top-1 -right-1 bg-gradient-to-br from-[#FF6B6B] to-[#ee5a5a] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse border-2 border-white"
      aria-label={`${count} items in cart`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Memoized Navigation Items
const NavigationItems = ({ items, onClick, isMobile = false }) => {
  return (
    <>
      {items.map(({ label, icon: Icon, href, badge }) => (
        <Link
          key={href}
          href={href}
          className={
            isMobile
              ? 'group flex items-center gap-3 px-4 py-3 text-sm sm:text-base font-semibold text-[#225F91] hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-[#225F91]/5 hover:text-[#1ABA7F] rounded-xl transition-all duration-300 hover:translate-x-1'
              : 'group relative flex items-center gap-2 text-sm sm:text-base font-semibold text-[#225F91] hover:text-[#1ABA7F] hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105'
          }
          onClick={onClick}
          aria-label={badge ? `${label} with ${badge} items` : label}
        >
          <Icon className={`h-5 w-5 transition-transform duration-300 ${isMobile ? 'group-hover:scale-110' : 'group-hover:rotate-12'}`} aria-hidden="true" />
          <span className="relative">
            {label || '---'}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] group-hover:w-full transition-all duration-300" />
          </span>
          {!isMobile && <CartBadge count={badge} />}
          {isMobile && badge > 0 && (
            <span className="bg-gradient-to-br from-[#FF6B6B] to-[#ee5a5a] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-auto shadow-lg">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </Link>
      ))}
    </>
  );
};

// Main Layout Component
function MainLayoutContent({ children }) {
  const { cartItemCount, fetchCart, isPending } = useCart();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navRef = useRef(null);

  // Memoized navigation items
  const navItems = useMemo(() => [
    { label: t('nav.home'), icon: Home, href: '/', badge: 0 },
    { label: t('nav.check_status'), icon: FileText, href: '/check-prescription-status', badge: 0 },
    { label: t('nav.track_order'), icon: MapPin, href: '/track-order', badge: 0 },
    { label: t('nav.cart'), icon: ShoppingCart, href: '/cart', badge: cartItemCount },
  ], [t, cartItemCount]);

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

  // Fetch cart on mount only
  useEffect(() => {
    let mounted = true;
    
    const loadCart = async () => {
      try {
        if (mounted) {
          await fetchCart();
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        if (process.env.NODE_ENV === 'production') {
          // window.analytics?.track('cart_fetch_error', { error: error.message });
        }
      }
    };

    loadCart();

    return () => {
      mounted = false;
    };
  }, [fetchCart]);

  useEffect(() => {
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
  }, [handleScroll]);

  useEffect(() => {
    const handleRouteChange = () => setIsOpen(false);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 min-w-[320px] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#1ABA7F]/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#225F91]/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#76D1F3]/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-gradient-to-r focus:from-[#1ABA7F] focus:to-[#16a876] focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold"
      >
        Skip to main content
      </a>

      {/* Enhanced Navigation */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 transition-all duration-500 ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        } ${isScrolled ? 'shadow-2xl border-[#1ABA7F]/30' : 'border-transparent'}`}
        role="navigation"
        aria-label={t('nav.medication_navigation')}
      >
        {/* Gradient Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F] animate-gradient bg-300%" aria-hidden="true" />

        <div className="w-full mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <Link
            href="/"
            className="group flex items-center focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] rounded-xl p-2 transition-all duration-300 hover:scale-105"
            aria-label={t('nav.homepage')}
          >
            <Image
              src={CONFIG.images.logo}
              alt="Manzu Logo"
              width={120}
              height={48}
              className="h-8 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="ml-2 hidden sm:flex flex-col">
              <span className="text-2xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] bg-clip-text text-transparent">
                Your Health Partner
              </span>
            </div>
          </Link>

          {/* Mobile Menu */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/cart"
              className="relative p-2.5 text-[#225F91] hover:text-[#1ABA7F] focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] rounded-xl hover:bg-[#1ABA7F]/10 transition-all duration-300 hover:scale-110"
              aria-label={cartItemCount > 0 ? `${t('nav.cart')} with ${cartItemCount} items` : t('nav.cart')}
            >
              <ShoppingCart className="h-6 w-6" aria-hidden="true" />
              <CartBadge count={cartItemCount} />
            </Link>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2.5 text-[#225F91] hover:text-[#1ABA7F] focus:ring-2 focus:ring-[#1ABA7F] rounded-xl hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent transition-all duration-300"
                  aria-label={isOpen ? t('nav.close_menu') : t('nav.open_menu')}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[75vw] max-w-[320px] bg-white/95 backdrop-blur-xl p-0 border-l-2 border-[#1ABA7F]/20">
                <VisuallyHidden>
                  <SheetTitle>{t('nav.menu')}</SheetTitle>
                </VisuallyHidden>
                
                {/* Mobile Menu Header */}
                <div className="p-6 border-b-2 border-gradient-to-r from-[#1ABA7F]/20 to-transparent">
                  <Image
                    src={CONFIG.images.logo}
                    alt="Manzu Logo"
                    width={100}
                    height={40}
                    className="h-8 w-auto object-contain"
                  />
                </div>

                <nav className="flex flex-col gap-2 p-4" aria-label="Mobile navigation">
                  <NavigationItems items={navItems} onClick={handleMobileMenuToggle} isMobile />
                </nav>

                {/* Mobile Menu Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gradient-to-t from-white to-transparent">
                  <p className="text-xs text-gray-500 text-center">
                    © {new Date().getFullYear()} Manzu
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3" aria-label="Desktop navigation">
            <NavigationItems items={navItems} />
          </nav>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="w-full mx-auto pt-1 sm:pt-6 flex-1 relative z-10">
        {children}
      </main>

      {/* Enhanced Pharmacy CTA */}
      <section className="relative overflow-hidden text-center mb-1 shadow-xl" aria-labelledby="pharmacy-cta-title">
        <Image 
          src={CONFIG.images.pharmacyCTA}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#225F91]/90 via-[#1a4a73]/85 to-[#0f2942]/90" aria-hidden="true" />

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1ABA7F] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#76D1F3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 py-16 sm:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-bold mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-[#1ABA7F] animate-pulse" />
              Partner Opportunity
            </div>

            <h2 id="pharmacy-cta-title" className="text-3xl sm:text-5xl text-white font-black mb-4 leading-tight">
              {t('footer.pharmacy_invite_title', 'Are you a Pharmacy?')}
            </h2>
            
            <p className="text-base sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
              {t('footer.pharmacy_invite_text', 'Join Manzu and connect with verified customers in your area.')}
            </p>

            <Button
              asChild
              className="group relative h-14 px-10 text-base font-bold rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white hover:from-[#16a876] hover:to-[#1ABA7F] shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden hover:scale-105 border-2 border-white/30"
            >
              <Link href="/pharmacy/register">
                <span className="relative z-10 flex items-center gap-2">
                  {t('footer.join_us', 'Join Us Now')}
                  <ChevronUp className="w-5 h-5 rotate-90 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#225F91] to-transparent" aria-hidden="true" />
      </section>

      {/* Enhanced Footer */}
      <footer className="relative bg-gradient-to-br from-[#225F91] via-[#1a4a73] to-[#0f2942] text-white overflow-hidden" role="contentinfo">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#1ABA7F] rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#76D1F3] rounded-full mix-blend-multiply filter blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Brand Section */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <Image
                src={CONFIG.images.logo}
                alt="Manzu Logo"
                width={120}
                height={48}
                className="h-10 w-auto object-contain mb-4"
              />
              <p className="text-sm text-gray-300 max-w-xs leading-relaxed">
                Your trusted partner for healthcare solutions across Nigeria.
              </p>
            </div>

            {/* Quick Links */}
            <nav className="flex flex-col items-center" aria-labelledby="footer-links-title">
              <h3 id="footer-links-title" className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-[#1ABA7F] to-transparent rounded-full" aria-hidden="true" />
                {t('footer.quick_links')}
              </h3>
              <div className="space-y-3 w-full max-w-xs">
                {['About', 'Contact', 'Privacy Policy'].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                    className="group flex items-center justify-center gap-2 text-gray-300 hover:text-[#1ABA7F] text-sm transition-all duration-300 hover:translate-x-1"
                  >
                    <span className="w-1.5 h-1.5 bg-[#1ABA7F] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                    {t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Social Media */}
            <div className="flex flex-col items-center md:items-end">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                {t('footer.connect')}
                <span className="w-1.5 h-6 bg-gradient-to-b from-[#1ABA7F] to-transparent rounded-full" aria-hidden="true" />
              </h3>
              <div className="flex gap-3">
                {[
                  { name: 'Twitter', href: CONFIG.socialMedia.twitter, icon: Twitter, color: 'hover:bg-[#1DA1F2]' },
                  { name: 'Instagram', href: CONFIG.socialMedia.instagram, icon: Instagram, color: 'hover:bg-gradient-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF]' },
                  { name: 'Facebook', href: CONFIG.socialMedia.facebook, icon: Facebook, color: 'hover:bg-[#1877F2]' },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group p-3 rounded-xl bg-white/10 backdrop-blur-sm text-white ${social.color} transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] hover:scale-110 hover:shadow-xl border border-white/20`}
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <social.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t-2 border-white/10 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-300">
              <p className="flex items-center gap-2">
                © {new Date().getFullYear()} Manzu
                <span className="inline-block w-1 h-1 rounded-full bg-[#1ABA7F]" aria-hidden="true" />
                {t('footer.powered_by')}
              </p>
              <Image 
                src={CONFIG.images.logo} 
                alt="" 
                width={20} 
                height={20} 
                className="inline-block opacity-70"
                aria-hidden="true"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t('footer.rights_reserved')}
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-br from-[#1ABA7F] to-[#16a876] text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 h-14 w-14 flex items-center justify-center group border-2 border-white/20 ${
          showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-75 pointer-events-none'
        }`}
        aria-label={t('nav.scroll_to_top')}
      >
        <ChevronUp className="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-1" aria-hidden="true" />
        <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      </Button>

      {/* Enhanced Toast Notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(12px)',
            color: '#225F91',
            border: '2px solid rgba(26,186,127,0.2)',
            borderRadius: '1rem',
            boxShadow: '0 10px 40px rgba(26,186,127,0.2)',
            padding: '1rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            margin: '0.5rem',
          },
          error: {
            style: {
              background: 'rgba(239,68,68,0.98)',
              color: 'white',
              border: '2px solid rgba(220,38,38,0.3)',
              boxShadow: '0 10px 40px rgba(239,68,68,0.3)',
            },
          },
          success: {
            style: {
              background: 'rgba(34,197,94,0.98)',
              color: 'white',
              border: '2px solid rgba(22,163,74,0.3)',
              boxShadow: '0 10px 40px rgba(34,197,94,0.3)',
            },
          },
        }}
      />

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .bg-300\% {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
}

// Export with Error Boundary
export default function MainLayout({ children }) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => setResetKey(prev => prev + 1)}
      onError={(error, errorInfo) => {
        if (process.env.NODE_ENV === 'production') {
          console.error('Layout Error:', error, errorInfo);
          // window.analytics?.track('layout_error', { error: error.message });
        }
      }}
    >
      <MainLayoutContent key={resetKey}>{children}</MainLayoutContent>
    </ErrorBoundary>
  );
}