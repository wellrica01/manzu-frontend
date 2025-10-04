'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Instagram, Facebook, ShoppingCart, Home, FileText, MapPin, ChevronUp, Sparkles, Globe, Heart } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'react-error-boundary';

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

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4" role="alert">
      <div className="text-center max-w-md bg-white rounded-3xl p-10 shadow-3xl border-2 border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/15 to-transparent rounded-bl-full" />
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-6 shadow-2xl border-4 border-white">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 font-semibold mb-8 leading-relaxed">{error.message}</p>
        <Button 
          onClick={resetErrorBoundary} 
          className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

const CartBadge = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <span 
      className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-[#FF6B6B] to-[#ee5a5a] text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center shadow-2xl animate-pulse border-2 border-white"
      aria-label={`${count} items in cart`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const NavigationItems = ({ items, onClick, isMobile = false }) => {
  return (
    <>
      {items.map(({ label, icon: Icon, href, badge }) => (
        <Link
          key={href}
          href={href}
          className={
            isMobile
              ? 'group flex items-center gap-4 px-5 py-4 text-base font-black text-[#225F91] hover:bg-gradient-to-r hover:from-[#1ABA7F]/15 hover:to-[#225F91]/10 hover:text-[#1ABA7F] rounded-2xl transition-all duration-300 hover:translate-x-2 relative overflow-hidden'
              : 'group relative flex items-center gap-3 text-base font-black text-[#225F91] hover:text-[#1ABA7F] hover:bg-gradient-to-r hover:from-[#1ABA7F]/15 hover:to-transparent px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105'
          }
          onClick={onClick}
          aria-label={badge ? `${label} with ${badge} items` : label}
        >
          {isMobile && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1ABA7F] to-[#225F91] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
          <div className={`p-2 rounded-xl bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 group-hover:from-[#1ABA7F]/20 group-hover:to-[#225F91]/20 transition-all duration-300 ${
            isMobile ? 'group-hover:scale-110' : 'group-hover:rotate-12'
          }`}>
            <Icon className="h-5 w-5 transition-transform duration-300" aria-hidden="true" strokeWidth={2.5} />
          </div>
          <span className="relative">
            {label || '---'}
            <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] group-hover:w-full transition-all duration-300 rounded-full" />
          </span>
          {!isMobile && <CartBadge count={badge} />}
          {isMobile && badge > 0 && (
            <span className="bg-gradient-to-br from-[#FF6B6B] to-[#ee5a5a] text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center ml-auto shadow-xl border-2 border-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </Link>
      ))}
    </>
  );
};

function MainLayoutContent({ children }) {
  const { cartItemCount, fetchCart } = useCart();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navRef = useRef(null);

  const navItems = useMemo(() => [
    { label: t('nav.home'), icon: Home, href: '/', badge: 0 },
    { label: t('nav.check_status'), icon: FileText, href: '/check-prescription-status', badge: 0 },
    { label: t('nav.track_order'), icon: MapPin, href: '/track-order', badge: 0 },
    { label: t('nav.cart'), icon: ShoppingCart, href: '/cart', badge: cartItemCount },
  ], [t, cartItemCount]);



  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 50);
    setShowScrollTop(currentScrollY > 200);
    setIsNavVisible(currentScrollY <= lastScrollY.current || currentScrollY <= 100);
    lastScrollY.current = currentScrollY;
  }, []);



  useEffect(() => {
    const onScroll = () => requestAnimationFrame(handleScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);


  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 min-w-[320px] relative overflow-hidden">
      {/* Enhanced Animated Background */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-[#1ABA7F]/10 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#225F91]/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-[300px] h-[300px] bg-[#76D1F3]/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
    </div>



      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-8 focus:py-4 focus:bg-gradient-to-r focus:from-[#1ABA7F] focus:to-[#16a876] focus:text-white focus:rounded-2xl focus:shadow-2xl focus:font-black"
      >
        Skip to main content
      </a>

      {/* Ultra Premium Navigation */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/90 transition-all duration-500 ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        } ${isScrolled ? 'shadow-2xl border-b-2 border-[#1ABA7F]/30' : 'border-b-2 border-transparent'}`}
        role="navigation"
        aria-label={t('nav.medication_navigation')}
      >
        <div className="w-full mx-auto px-3 sm:px-6 py-1 sm:py-2 flex justify-between items-center">
          <Link
            href="/"
            className="group flex items-center focus:outline-none focus:ring-4 focus:ring-[#1ABA7F]/30 rounded-2xl p-3 transition-all duration-300 hover:scale-105"
            aria-label={t('nav.homepage')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <Image
                src={CONFIG.images.logo}
                alt="Manzu Logo"
                width={120}
                height={48}
                className="relative h-8 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div className="ml-3 hidden sm:flex flex-col">
              <span className="text-xl font-black bg-gradient-to-r from-[#1ABA7F] to-[#225F91] bg-clip-text text-transparent">
                Your Health Partner
              </span>
            </div>
          </Link>

          {/* Mobile Menu */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/cart"
              className="relative p-3 text-[#225F91] hover:text-[#1ABA7F] focus:outline-none focus:ring-4 focus:ring-[#1ABA7F]/30 rounded-2xl hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent transition-all duration-300 hover:scale-110"
              aria-label={cartItemCount > 0 ? `${t('nav.cart')} with ${cartItemCount} items` : t('nav.cart')}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
              <CartBadge count={cartItemCount} />
            </Link>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-3 text-[#225F91] hover:text-[#1ABA7F] focus:ring-4 focus:ring-[#1ABA7F]/30 rounded-2xl hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-transparent transition-all duration-300"
                  aria-label={isOpen ? t('nav.close_menu') : t('nav.open_menu')}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <X className="h-6 w-6" aria-hidden="true" strokeWidth={2.5} /> : <Menu className="h-6 w-6" aria-hidden="true" strokeWidth={2.5} />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] max-w-[350px] bg-white/98 backdrop-blur-2xl p-0 border-l-2 border-[#1ABA7F]/30 shadow-2xl">
                <VisuallyHidden>
                  <SheetTitle>{t('nav.menu')}</SheetTitle>
                </VisuallyHidden>
                
                {/* Premium Mobile Menu Header */}
                <div className="relative p-6 border-b-2 border-gradient-to-r from-[#1ABA7F]/30 to-transparent bg-gradient-to-br from-[#225F91]/5 to-transparent">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#1ABA7F]/10 to-transparent rounded-bl-full" />
                  <Image
                    src={CONFIG.images.logo}
                    alt="Manzu Logo"
                    width={100}
                    height={40}
                    className="h-10 w-auto object-contain relative z-10"
                  />
                </div>

                <nav className="flex flex-col gap-2 p-4" aria-label="Mobile navigation">
                  <NavigationItems items={navItems} onClick={handleMobileMenuToggle} isMobile />
                </nav>

                {/* Premium Mobile Menu Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t-2 border-gray-100 bg-gradient-to-t from-white via-gray-50/50 to-transparent backdrop-blur-sm">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-400">
                      © {new Date().getFullYear()} Manzu
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Premium Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Desktop navigation">
            <NavigationItems items={navItems} />
          </nav>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="w-full mx-auto pt-1 sm:pt-6 flex-1 relative z-10">
        {children}
      </main>

      {/* Ultra Premium Pharmacy CTA */}
      <section className="relative overflow-hidden text-center mb-1 shadow-2xl" aria-labelledby="pharmacy-cta-title">
        <Image 
          src={CONFIG.images.pharmacyCTA}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />

      <div className="absolute inset-0 bg-gradient-to-br from-[#225F91]/80 via-[#1a4a73]/70 to-[#0f2942]/80" aria-hidden="true" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#1ABA7F]/10 rounded-full mix-blend-multiply filter blur-2xl animate-blob" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#76D1F3]/10 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000" />


        <div className="relative z-10 py-14 sm:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl bg-white/15 text-white text-base font-black mb-8 border-2 border-white/30 shadow-2xl">
              <div className="p-1.5 bg-[#1ABA7F] rounded-lg">
                <Sparkles className="w-5 h-5 text-white animate-pulse" strokeWidth={3} />
              </div>
              Partner Opportunity
            </div>

            <h2 id="pharmacy-cta-title" className="text-4xl sm:text-6xl text-white font-black mb-6 leading-tight drop-shadow-2xl">
              {t('footer.pharmacy_invite_title', 'Are you a Pharmacy?')}
            </h2>
            
            <p className="text-lg sm:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto font-bold leading-relaxed drop-shadow-lg">
              {t('footer.pharmacy_invite_text', 'Join Manzu and connect with verified customers in your area.')}
            </p>

            <Button
              asChild
              className="group relative h-14 sm:h-16 px-12 sm:px-14 text-lg font-black rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white hover:from-[#16a876] hover:to-[#1ABA7F] shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden hover:scale-110 border-2 border-white/40"
            >
              <Link href="/pharmacy/register">
                <span className="relative z-10 flex items-center gap-3">
                  {t('footer.join_us', 'Join Us Now')}
                  <ChevronUp className="w-6 h-6 rotate-90 group-hover:translate-x-2 transition-transform duration-300" strokeWidth={3} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#225F91] to-transparent" aria-hidden="true" />
      </section>

      {/* Ultra Premium Footer */}
      <footer className="relative bg-gradient-to-br from-[#225F91] via-[#1a4a73] to-[#0f2942] text-white overflow-hidden" role="contentinfo">
        {/* Decorative Background with glow */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#1ABA7F]/10 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#76D1F3]/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      </div>


        {/* Top gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F] animate-gradient bg-300%" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            {/* Brand Section */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#1ABA7F] rounded-full blur-md opacity-50" />
                <Image
                  src={CONFIG.images.logo}
                  alt="Manzu Logo"
                  width={140}
                  height={56}
                  className="relative h-10 sm:h-12 w-auto object-contain"
                />
              </div>
              <p className="text-base text-gray-300 max-w-xs leading-relaxed font-semibold">
                Your trusted partner for healthcare solutions across Nigeria.
              </p>
            </div>

            {/* Quick Links */}
            <nav className="flex flex-col items-center" aria-labelledby="footer-links-title">
              <h3 id="footer-links-title" className="text-lg font-black text-white mb-2 sm:mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-[#1ABA7F] to-transparent rounded-full" aria-hidden="true" />
                {t('footer.quick_links')}
              </h3>
              <div className="space-y-4 w-full max-w-xs">
                {['About', 'Contact', 'Privacy Policy'].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                    className="group flex items-center justify-center gap-1 sm:gap-3 text-gray-300 hover:text-[#1ABA7F] text-base font-semibold transition-all duration-300 hover:translate-x-2"
                  >
                    <span className="w-2 h-2 bg-[#1ABA7F] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg" aria-hidden="true" />
                    {t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Social Media */}
            <div className="flex flex-col items-center md:items-end">
              <h3 className="text-lg font-black text-white mb-3 sm:mb-6 flex items-center gap-3">
                {t('footer.connect')}
                <span className="w-2 h-8 bg-gradient-to-b from-[#1ABA7F] to-transparent rounded-full" aria-hidden="true" />
              </h3>
              <div className="flex gap-4">
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
                    className={`group relative p-2 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-sm text-white ${social.color} transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#1ABA7F]/30 hover:scale-110 hover:shadow-2xl border-2 border-white/20`}
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    <social.icon className="relative h-6 w-6 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 sm:mt-16 pt-8 sm:pt-10 border-t-2 border-white/10 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm sm:text-base text-gray-300 font-semibold mb-3">
              <p className="flex items-center gap-3">
                © {new Date().getFullYear()} Manzu
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1ABA7F] shadow-lg" aria-hidden="true" />
                {t('footer.powered_by')}
              </p>
              <div className="relative">
                <div className="absolute inset-0 bg-[#1ABA7F] rounded-full blur-md opacity-50" />
                <Image 
                  src={CONFIG.images.logo} 
                  alt="" 
                  width={24} 
                  height={24} 
                  className="relative inline-block opacity-80"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="text-sm text-gray-400 font-medium">
              {t('footer.rights_reserved')}
            </p>
          </div>
        </div>
      </footer>

      {/* Ultra Premium Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-2 sm:p-4 bg-gradient-to-br from-[#1ABA7F] to-[#16a876] text-white rounded-2xl shadow-2xl transition-all duration-300 
        ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        aria-label={t('nav.scroll_to_top')}
      >
        <ChevronUp className="h-7 w-7" strokeWidth={3} />
      </Button>


      {/* Ultra Premium Toast Notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(16px)',
            color: '#225F91',
            border: '2px solid rgba(26,186,127,0.3)',
            borderRadius: '1.25rem',
            boxShadow: '0 20px 50px rgba(26,186,127,0.25)',
            padding: '1.25rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: '700',
            margin: '0.75rem',
          },
          error: {
            style: {
              background: 'rgba(239,68,68,0.98)',
              color: 'white',
              border: '2px solid rgba(220,38,38,0.4)',
              boxShadow: '0 20px 50px rgba(239,68,68,0.35)',
            },
          },
          success: {
            style: {
              background: 'rgba(34,197,94,0.98)',
              color: 'white',
              border: '2px solid rgba(22,163,74,0.4)',
              boxShadow: '0 20px 50px rgba(34,197,94,0.35)',
            },
          },
        }}
      />

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(15px, -25px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

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

export default function MainLayout({ children }) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => setResetKey(prev => prev + 1)}
      onError={(error, errorInfo) => {
        if (process.env.NODE_ENV === 'production') {
          console.error('Layout Error:', error, errorInfo);
        }
      }}
    >
      <MainLayoutContent key={resetKey}>{children}</MainLayoutContent>
    </ErrorBoundary>
  );
}