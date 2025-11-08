'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Menu, X, Twitter, Instagram, Facebook, ShoppingCart, Home, FileText, 
  MapPin, ChevronUp, Shield, Award, Clock, Phone, Mail, Sparkles, 
  Building2, Users, Heart, TrendingUp, Zap, ExternalLink, CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import { useCartData } from '@/hooks/useCartData';
import { useTranslation } from 'react-i18next';

const CONFIG = {
  socialMedia: {
    twitter: 'https://twitter.com/manzu_pharmacy',
    instagram: 'https://instagram.com/manzu_pharmacy',
    facebook: 'https://facebook.com/manzu.pharmacy',
  },
  images: {
    logo: '/logo_1.png',
  },
  contact: {
    phone: '+234 900 000 1111',
    email: 'support@manzu.ng'
  }
};

const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Enhanced Cart Badge
const CartBadge = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <span 
      className="absolute -top-2 -right-2 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 border-white animate-pulse"
      aria-label={`${count} items in cart`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Navigation Items Component
const NavigationItems = ({ items, onClick, isMobile = false }) => {
  return (
    <>
      {items.map(({ label, icon: Icon, href, badge, description }) => (
        <Link
          key={href}
          href={href}
          className={
            isMobile
              ? 'group flex items-center gap-4 px-5 py-4 text-sm font-semibold text-gray-700 hover:text-[#225F91] hover:bg-gradient-to-r hover:from-emerald-50 hover:to-cyan-50 rounded-2xl transition-all'
              : 'group relative flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#225F91] px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all'
          }
          onClick={onClick}
          aria-label={badge ? `${label} with ${badge} items` : label}
        >
          <div className={isMobile ? "p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-emerald-100 group-hover:to-cyan-100 transition-colors" : ""}>
            <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>{label}</span>
              {!isMobile && <CartBadge count={badge} />}
            </div>
            {isMobile && description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {isMobile && badge > 0 && (
            <Badge className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}
        </Link>
      ))}
    </>
  );
};

function MainLayoutContent({ children }) {
  const { itemCount, refetch } = useCartData(guestId, apiUrl);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navRef = useRef(null);

  const navItems = useMemo(() => [
    { 
      label: t('nav.home'), 
      icon: Home, 
      href: '/', 
      badge: 0,
      description: 'Find medications instantly'
    },
    { 
      label: t('nav.check_status'), 
      icon: FileText, 
      href: '/check-prescription-status', 
      badge: 0,
      description: 'Track prescription status'
    },
    { 
      label: t('nav.track_order'), 
      icon: MapPin, 
      href: '/track-order', 
      badge: 0,
      description: 'Live order tracking'
    },
    { 
      label: t('nav.cart'), 
      icon: ShoppingCart, 
      href: '/cart', 
      badge: itemCount,
      description: 'Review your items'
    },
  ], [t, itemCount]);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 20);
    setShowScrollTop(currentScrollY > 400);
  }, []);

  useEffect(() => {
    const onScroll = () => requestAnimationFrame(handleScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Enhanced Trust Bar */}
      <div className="bg-gradient-to-r from-[#225F91] via-[#1a4a73] to-[#225F91] text-white py-2.5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-8 text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Shield className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
              <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-sm animate-pulse" />
            </div>
            <span>NAFDAC Verified</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Award className="h-4 w-4 text-cyan-400" strokeWidth={2.5} />
            <span>Trusted Platform</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
            <span>24/7 Support</span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" strokeWidth={2.5} />
            <span>Instant Results</span>
          </div>
        </div>
      </div>

      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-8 focus:py-4 focus:bg-gradient-to-r focus:from-emerald-500 focus:to-cyan-500 focus:text-white focus:rounded-2xl focus:shadow-2xl focus:font-bold"
      >
        Skip to main content
      </a>

      {/* Enhanced Navigation */}
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          isScrolled ? 'shadow-lg border-b border-gray-100' : 'border-b border-gray-100'
        }`}
        role="navigation"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Manzu Homepage"
          >
            <Image
              src={CONFIG.images.logo}
              alt="Manzu"
              width={140}
              height={56}
              className="h-8 sm:h-10 w-auto group-hover:scale-105 transition-transform"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            <NavigationItems items={navItems} />
            
            <div className="ml-4 pl-4 border-l border-gray-200">
              <Link
                href="/pharmacy-register"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
              >
                <Building2 className="w-4 h-4" strokeWidth={2} />
                <span className="hidden xl:inline">For Pharmacies</span>
                <span className="xl:hidden">Pharmacies</span>
              </Link>
            </div>
          </nav>

          {/* Mobile Cart & Menu */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/cart"
              className="relative p-2.5 text-gray-700 hover:text-[#225F91] hover:bg-gray-50 rounded-xl transition-all"
              aria-label={itemCount > 0 ? `${t('nav.cart')} with ${itemCount} items` : t('nav.cart')}
            >
              <ShoppingCart className="h-6 w-6" strokeWidth={2} />
              <CartBadge count={itemCount} />
            </Link>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2.5 hover:bg-gray-50 rounded-xl"
                  aria-label={isOpen ? 'Close menu' : 'Open menu'}
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] max-w-md bg-white p-0">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                
                {/* Mobile Menu Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <Image
                    src={CONFIG.images.logo}
                    alt="Manzu"
                    width={120}
                    height={48}
                    className="h-9 w-auto mb-3"
                  />
                  <p className="text-sm text-gray-600 font-medium">
                    Nigeria's trusted medication platform
                  </p>
                </div>

                {/* Mobile Menu Items */}
                <nav className="flex flex-col gap-2 p-4">
                  <NavigationItems items={navItems} onClick={() => setIsOpen(false)} isMobile />
                  
                  <div className="my-4 border-t border-gray-200" />
                  
                  <Link
                    href="/pharmacy-register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-5 py-4 text-sm font-semibold text-white bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] rounded-2xl transition-all shadow-lg"
                  >
                    <div className="p-2 rounded-xl bg-white/20">
                      <Building2 className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div>For Pharmacies</div>
                      <p className="text-xs text-white/80 mt-0.5">Join our network</p>
                    </div>
                  </Link>
                </nav>

                {/* Mobile Menu Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center font-medium">
                    © {new Date().getFullYear()} Manzu. All rights reserved.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Image
                src={CONFIG.images.logo}
                alt="Manzu"
                width={160}
                height={64}
                className="h-12 w-auto mb-6 brightness-0 invert"
              />
              <p className="text-lg text-white/70 mb-8 max-w-md leading-relaxed">
                Nigeria's first medication discovery platform, connecting patients with verified pharmacies nationwide. Making healthcare accessible, transparent, and efficient.
              </p>
            
              
              {/* Social Links */}
              <div className="flex gap-3">
                {[
                  { name: 'Twitter', href: CONFIG.socialMedia.twitter, icon: Twitter },
                  { name: 'Instagram', href: CONFIG.socialMedia.instagram, icon: Instagram },
                  { name: 'Facebook', href: CONFIG.socialMedia.facebook, icon: Facebook },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                Quick Links
              </h3>
              <nav className="space-y-3">
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'How It Works', href: '/how-it-works' },
                  { label: 'For Pharmacies', href: '/pharmacy-register' },
                  { label: 'FAQs', href: '/faqs' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'Careers', href: '/careers' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group block text-white/70 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                    </span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400" strokeWidth={2} />
                Get in Touch
              </h3>
              <div className="space-y-4">
                <a 
                  href={`tel:${CONFIG.contact.phone}`} 
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                    <Phone className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-xs text-white/60 font-semibold">Call Us</div>
                    <div className="font-bold text-sm">{CONFIG.contact.phone}</div>
                  </div>
                </a>
                
                <a 
                  href={`mailto:${CONFIG.contact.email}`} 
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                    <Mail className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-xs text-white/60 font-semibold">Email Us</div>
                    <div className="font-bold text-sm">{CONFIG.contact.email}</div>
                  </div>
                </a>

                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                    <span className="text-xs font-bold text-emerald-400">Available 24/7</span>
                  </div>
                  <p className="text-xs text-white/70">
                    Our support team is always here to help you
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <p className="text-sm text-white/50 font-medium">
                © {new Date().getFullYear()} Manzu. All rights reserved. Making healthcare accessible to every Nigerian.
              </p>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: 'Privacy Policy', href: '/privacy-policy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/cookies' },
                ].map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className="text-sm text-white/50 hover:text-white transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all ${
          showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-6 w-6" strokeWidth={2.5} />
      </Button>

      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'rounded-2xl border-2',
        }}
      />
    </div>
  );
}

export default MainLayoutContent;