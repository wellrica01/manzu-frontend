'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Instagram, Facebook, ShoppingCart, Home, FileText, MapPin, ChevronUp, Bell, Search, User } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from 'react-i18next';

export default function MainLayout({ children }) {
  const { cartItemCount, fetchCart, cart, isPending } = useCart();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navRef = useRef(null);
  const scrollTopRef = useRef(null);

  // Enhanced scroll handling with performance optimizations
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollThreshold = 100;
    
    setIsScrolled(currentScrollY > scrollThreshold);
    setShowScrollTop(currentScrollY > 300);
    
    // Hide/show nav based on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 200) {
      setIsNavVisible(false);
    } else {
      setIsNavVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  // Enhanced cart fetching with error handling
  const fetchCartWithRetry = useCallback(async () => {
    try {
      await fetchCart();
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, [fetchCart]);

  useEffect(() => {
    fetchCartWithRetry();
    
    // Enhanced scroll listener with throttling
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
    
    // Intersection observer for nav visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (navRef.current) {
      observer.observe(navRef.current);
    }

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      observer.disconnect();
    };
  }, [fetchCartWithRetry, handleScroll]);

  // Ensure cart is fetched on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Smooth scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Enhanced navigation items with better UX
  const navItems = [
    { label: t('nav.home'), icon: Home, href: '/', badge: null },
    { label: t('nav.check_status'), icon: FileText, href: '/check-prescription-status', badge: null },
    { label: t('nav.track_order'), icon: MapPin, href: '/track-order', badge: null },
    { 
      label: t('nav.cart'), 
      icon: ShoppingCart, 
      href: '/cart', 
      badge: cartItemCount > 0 ? cartItemCount : null 
    },
  ];

  // Debug cart count
  console.log('Cart item count:', cartItemCount, 'Cart data:', cart, 'Is pending:', isPending);
  
  // Debug badge values
  navItems.forEach(item => {
    if (item.badge !== null) {
      console.log('Badge for', item.label, ':', item.badge);
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#1ABA7F]/10 relative">
      {/* Enhanced Navigation with scroll effects */}
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-[#1ABA7F]/30' 
            : 'bg-white/15 backdrop-blur-lg border-b border-[#1ABA7F]/20'
        } ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="navigation"
        aria-label={t('nav.medication_navigation')}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Enhanced Logo with hover effects */}
          <Link
            href="/"
            className="flex items-center transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1ABA7F] rounded-lg p-1"
            aria-label={t('nav.homepage')}
          >
            <div className="relative group">
              <Image
                src="/logo_1.png"
                alt="Manzu Logo"
                width={120}
                height={48}
                className="h-10 w-auto object-contain transition-all duration-300 group-hover:brightness-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(({ label, icon: Icon, href, badge }) => (
              <Link
                key={label}
                href={href}
                className={`group relative text-base font-medium text-[#225F91] hover:text-[#1ABA7F] hover:bg-[#1ABA7F]/20 px-4 py-2 rounded-full transition-all duration-300 hover:shadow-sm flex items-center gap-2 ${
                  label === t('nav.cart') ? 'pr-6' : ''
                }`}
                aria-label={badge ? `${label} ${t('nav.with')} ${badge} ${t('nav.items')}` : label}
              >
                <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                {label !== t('nav.cart') && (
                  <span className="relative z-10">{label}</span>
                )}
                
                {/* Enhanced badge with animation */}
                {badge && (
                  <span className="absolute -top-2 -right-2 bg-[#1ABA7F] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse z-10 border-2 border-white shadow-lg">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {/* Debug: Always show badge for testing */}
                {label === t('nav.cart') && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center z-20 border-2 border-white shadow-lg">
                    {cartItemCount}
                  </span>
                )}
                {/* Loading indicator for cart */}
                {isPending && !badge && (
                  <span className="absolute -top-2 -right-2 bg-[#1ABA7F]/50 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse z-10 shadow-lg">
                    ...
                  </span>
                )}
                
                {/* Enhanced hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              </Link>
            ))}
            
            {/* Enhanced Search Button */}
            <Button
              variant="ghost"
              className="p-2 bg-[#1ABA7F]/10 rounded-full hover:bg-[#1ABA7F]/20 transition-all duration-300 group"
              aria-label={t('nav.search')}
            >
              <Search className="h-5 w-5 text-[#225F91] group-hover:text-[#1ABA7F] transition-colors duration-300" />
            </Button>
            
            {/* Enhanced Notification Button */}
            <Button
              variant="ghost"
              className="p-2 bg-[#1ABA7F]/10 rounded-full hover:bg-[#1ABA7F]/20 transition-all duration-300 group relative"
              aria-label={t('nav.notifications')}
            >
              <Bell className="h-5 w-5 text-[#225F91] group-hover:text-[#1ABA7F] transition-colors duration-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#1ABA7F] rounded-full animate-pulse" />
            </Button>
          </div>

          {/* Enhanced Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden p-2 bg-[#1ABA7F]/20 rounded-full hover:bg-[#1ABA7F]/40 transition-all duration-300 group"
                aria-label={t('nav.open_menu')}
              >
                <Menu className="h-6 w-6 text-[#225F91] group-hover:text-[#1ABA7F] transition-colors duration-300" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] sm:w-[340px] bg-white/95 backdrop-blur-lg border-l border-[#1ABA7F]/20"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">{t('nav.medication_navigation')}</SheetTitle>
                <Button
                  variant="ghost"
                  className="absolute top-4 right-4 p-2 bg-[#1ABA7F]/20 rounded-full hover:bg-[#1ABA7F]/30 transition-all duration-300"
                  aria-label={t('nav.close_menu')}
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-6 w-6 text-[#225F91]" aria-hidden="true" />
                </Button>
              </SheetHeader>
              
              {/* Enhanced Mobile Menu Items */}
              <div className="flex flex-col gap-4 mt-12 px-4">
                {navItems.map(({ label, icon: Icon, href, badge }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group text-lg font-medium text-[#225F91] hover:bg-[#1ABA7F]/20 hover:text-[#1ABA7F] px-4 py-3 rounded-full transition-all duration-300 relative flex items-center gap-3"
                    aria-label={badge ? `${label} ${t('nav.with')} ${badge} ${t('nav.items')}` : label}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    
                    {/* Enhanced mobile badge */}
                    {badge && (
                      <span className="bg-[#1ABA7F] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                    {/* Loading indicator for mobile cart */}
                    {isPending && !badge && (
                      <span className="bg-[#1ABA7F]/50 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse">
                        ...
                      </span>
                    )}
                    
                    {/* Enhanced mobile hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                  </Link>
                ))}
                
                {/* Enhanced Mobile Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-[#1ABA7F]/20">
                  <Button
                    variant="ghost"
                    className="flex-1 p-3 bg-[#1ABA7F]/10 rounded-full hover:bg-[#1ABA7F]/20 transition-all duration-300 group"
                    aria-label={t('nav.search')}
                  >
                    <Search className="h-5 w-5 text-[#225F91] group-hover:text-[#1ABA7F] transition-colors duration-300" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 p-3 bg-[#1ABA7F]/10 rounded-full hover:bg-[#1ABA7F]/20 transition-all duration-300 group relative"
                    aria-label={t('nav.notifications')}
                  >
                    <Bell className="h-5 w-5 text-[#225F91] group-hover:text-[#1ABA7F] transition-colors duration-300" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#1ABA7F] rounded-full animate-pulse" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Enhanced Main Content */}
      <main className="flex-grow relative">
        {children}
      </main>

      {/* Enhanced Footer with better visual hierarchy */}
      <footer className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] py-12 relative overflow-hidden">
        {/* Enhanced background pattern */}
        <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10" aria-hidden="true" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Mobile Footer Layout */}
          <div className="lg:hidden">
            {/* Brand Section - Mobile */}
            <div className="text-center mb-8">
              <div className="group mb-4">
                <Image
                  src="/logo_1.png"
                  alt="Manzu Logo"
                  width={120}
                  height={48}
                  className="h-12 w-auto object-contain transition-all duration-300 group-hover:brightness-110 mx-auto"
                />
              </div>
              <p className="text-sm text-white/80 font-medium leading-relaxed max-w-sm mx-auto mb-6">
                {t('footer.description')}
              </p>
              
              {/* Contact Info - Mobile */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-center gap-3 bg-white/10 rounded-full px-4 py-2">
                  <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                  <span className="text-sm text-white/90 font-medium">{t('footer.ussd')}</span>
                  <span className="font-bold text-white">*123*456#</span>
                </div>
                <div className="flex items-center justify-center gap-3 bg-white/10 rounded-full px-4 py-2">
                  <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                  <span className="text-sm text-white/90 font-medium">{t('footer.whatsapp')}</span>
                  <a href="https://wa.me/+2341234567890" target="_blank" rel="noopener noreferrer" className="font-bold text-white underline hover:text-[#1ABA7F] transition-colors duration-200">+2341234567890</a>
                </div>
              </div>
            </div>
            
                         {/* Quick Links - Mobile */}
             <div className="mb-8">
               <h3 className="text-lg font-semibold text-white mb-4 text-center flex items-center justify-center gap-2">
                 <span className="w-1 h-6 bg-[#1ABA7F] rounded-full" />
                 {t('footer.quick_links')}
               </h3>
               <div className="flex justify-center gap-2 px-4">
                 {['About', 'Contact', 'Privacy Policy'].map((item) => (
                   <Link
                     key={item}
                     href={`/${item.toLowerCase().replace(' ', '-')}`}
                     className="text-white/90 hover:text-white text-sm font-medium transition-all duration-200 hover:bg-white/10 px-4 py-2 rounded-full text-center group whitespace-nowrap"
                     aria-label={t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                   >
                     {t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                   </Link>
                 ))}
               </div>
             </div>
            
            {/* Social Links - Mobile */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 text-center flex items-center justify-center gap-2">
                <span className="w-1 h-6 bg-[#1ABA7F] rounded-full" />
                {t('footer.connect')}
              </h3>
              <div className="flex justify-center gap-6">
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
                    className="text-white hover:text-[#1ABA7F] hover:bg-[#225F91]/20 p-4 rounded-full transition-all duration-300 hover:scale-110 group"
                    aria-label={social.name}
                  >
                    <social.icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Tablet Footer Layout */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-2 gap-8 text-center">
              {/* Brand Section - Tablet */}
              <div className="flex flex-col items-center">
                <div className="group mb-4">
                  <Image
                    src="/logo_1.png"
                    alt="Manzu Logo"
                    width={120}
                    height={48}
                    className="h-10 w-auto object-contain transition-all duration-300 group-hover:brightness-110"
                  />
                </div>
                <p className="text-sm text-white/80 font-medium leading-relaxed max-w-xs mb-4">
                  {t('footer.description')}
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-white/80 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                    {t('footer.ussd')} <span className="font-bold">*123*456#</span>
                  </p>
                  <p className="text-sm text-white/80 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                    {t('footer.whatsapp')} <a href="https://wa.me/+2341234567890" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#1ABA7F] transition-colors duration-200">+2341234567890</a>
                  </p>
                </div>
              </div>
              
              {/* Quick Links & Social - Tablet */}
              <div className="space-y-6">
                {/* Quick Links - Tablet */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                    <span className="w-1 h-6 bg-[#1ABA7F] rounded-full" />
                    {t('footer.quick_links')}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['About', 'Contact', 'Privacy Policy'].map((item) => (
                      <Link
                        key={item}
                        href={`/${item.toLowerCase().replace(' ', '-')}`}
                        className="text-white/90 hover:text-white text-sm font-medium transition-all duration-200 hover:bg-white/10 px-4 py-2 rounded-full text-center group"
                        aria-label={t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                      >
                        {t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Social Links - Tablet */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                    <span className="w-1 h-6 bg-[#1ABA7F] rounded-full" />
                    {t('footer.connect')}
                  </h3>
                  <div className="flex justify-center gap-4">
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
                        className="text-white hover:text-[#1ABA7F] hover:bg-[#225F91]/20 p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                        aria-label={social.name}
                      >
                        <social.icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Footer Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8 text-left">
            {/* Enhanced Brand Section */}
            <div className="flex flex-col items-start">
              <div className="group mb-4">
                <Image
                  src="/logo_1.png"
                  alt="Manzu Logo"
                  width={120}
                  height={48}
                  className="h-10 w-auto object-contain transition-all duration-300 group-hover:brightness-110"
                />
              </div>
              <p className="text-sm text-white/80 font-medium max-w-xs leading-relaxed">
                {t('footer.description')}
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-white/80 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                  {t('footer.ussd')} <span className="font-bold">*123*456#</span>
                </p>
                <p className="text-sm text-white/80 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#1ABA7F] rounded-full" />
                  {t('footer.whatsapp')} <a href="https://wa.me/+2341234567890" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#1ABA7F] transition-colors duration-200">+2341234567890</a>
                </p>
              </div>
            </div>
            
            {/* Enhanced Quick Links */}
            <div className="flex flex-col items-start">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#1ABA7F] rounded-full" />
                {t('footer.quick_links')}
              </h3>
              <div className="space-y-3">
                {['About', 'Contact', 'Privacy Policy'].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-white/90 hover:text-white text-base font-medium transition-all duration-200 hover:bg-white/10 hover:underline px-4 py-2 rounded-lg flex items-center gap-2 group"
                    aria-label={t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                  >
                    <span className="w-1 h-1 bg-[#1ABA7F] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {t(`footer.${item.toLowerCase().replace(' ', '_')}`)}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Enhanced Social Links */}
            <div className="flex flex-col items-start">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#1ABA7F] rounded-full" />
                {t('footer.connect')}
              </h3>
              <div className="flex gap-4">
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
                    className="text-white hover:text-[#1ABA7F] hover:bg-[#225F91]/20 p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                    aria-label={social.name}
                  >
                    <social.icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Enhanced Copyright Section */}
          <div className="mt-8 pt-8 border-t border-[#1ABA7F]/20 text-center">
            <p className="text-sm text-white/80 font-medium">
              © 2025 Manzu. {t('footer.powered_by')}
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Scroll to Top Button */}
      <Button
        ref={scrollTopRef}
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-3 bg-[#1ABA7F] text-white rounded-full shadow-lg hover:bg-[#1A4971] hover:shadow-xl transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label={t('nav.scroll_to_top')}
      >
        <ChevronUp className="h-5 w-5" />
      </Button>

      {/* Enhanced Toaster with better styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.95)',
            color: '#225F91',
            border: '1px solid rgba(26,186,127,0.3)',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 32px rgba(26,186,127,0.2)',
            padding: '1rem',
            backdropFilter: 'blur(12px)',
            fontSize: '0.875rem',
            fontWeight: '500',
          },
          error: {
            style: {
              background: 'rgba(239,68,68,0.95)',
              color: 'white',
              border: '1px solid rgba(34,95,145,0.3)',
              boxShadow: '0 8px 32px rgba(34,95,145,0.2)',
            },
          },
          success: {
            style: {
              background: 'rgba(34,197,94,0.95)',
              color: 'white',
              border: '1px solid rgba(26,186,127,0.3)',
              boxShadow: '0 8px 32px rgba(26,186,127,0.2)',
            },
          },
        }}
      />
    </div>
  );
}