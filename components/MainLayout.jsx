'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, Twitter, Instagram, Facebook, ShoppingCart, Home, FileText, MapPin, ChevronUp, Shield, Award, Clock, Phone, Mail, Sparkles, Globe, Heart } from 'lucide-react';
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
    pharmacyCTA: '/images/pharmacy-cta.jpg',
    logo: '/logo_1.png',
  },
  contact: {
    phone: '+234 900 000 1111',
    email: 'support@manzu.ng'
  }
};

const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const CartBadge = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <span 
      className="absolute -top-2 -right-2 bg-gradient-to-br from-[#1ABA7F] to-[#16a876] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white"
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
              ? 'group flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-gray-700 hover:text-[#225F91] hover:bg-gray-50 rounded-xl transition-all duration-200'
              : 'group relative flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#225F91] px-4 py-2 rounded-lg transition-all duration-200'
          }
          onClick={onClick}
          aria-label={badge ? `${label} with ${badge} items` : label}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
          <span>{label}</span>
          {!isMobile && <CartBadge count={badge} />}
          {isMobile && badge > 0 && (
            <span className="bg-[#1ABA7F] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-auto">
              {badge > 99 ? '99+' : badge}
            </span>
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
    { label: t('nav.home'), icon: Home, href: '/', badge: 0 },
    { label: t('nav.check_status'), icon: FileText, href: '/check-prescription-status', badge: 0 },
    { label: t('nav.track_order'), icon: MapPin, href: '/track-order', badge: 0 },
    { label: t('nav.cart'), icon: ShoppingCart, href: '/cart', badge: itemCount },
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
      {/* Premium Trust Bar */}
      <div className="bg-gradient-to-r from-[#225F91] via-[#1a4a73] to-[#225F91] text-white py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[#1ABA7F]" strokeWidth={2.5} />
            <span>NAFDAC Verified</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Award className="h-3.5 w-3.5 text-[#76D1F3]" strokeWidth={2.5} />
            <span>Nigeria's Premier Platform</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#1ABA7F]" strokeWidth={2.5} />
            <span>Available 24/7</span>
          </div>
        </div>
      </div>

      {/* Skip to main content */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-[#1ABA7F] focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Refined Navigation */}
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          isScrolled ? 'shadow-md' : 'border-b border-gray-100'
        }`}
        role="navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Manzu Homepage"
          >
            <div className="relative">
              <Image
                src={CONFIG.images.logo}
                alt="Manzu"
                width={120}
                height={48}
                className="h-8 sm:h-10 w-auto object-contain"
                priority
              />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-lg font-bold text-[#225F91]">Manzu</span>
              <span className="text-xs text-gray-500 font-medium">Your Health Partner</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavigationItems items={navItems} />
          </nav>

          {/* Mobile Menu */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/cart"
              className="relative p-3 text-gray-700 hover:text-[#225F91] rounded-lg"
              aria-label={itemCount > 0 ? `${t('nav.cart')} with ${itemCount} items` : t('nav.cart')}
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={2} />
              <CartBadge count={itemCount} />
            </Link>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2"
                  aria-label={isOpen ? 'Close menu' : 'Open menu'}
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm bg-white p-0">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                
                <div className="p-6 border-b border-gray-100">
                  <Image
                    src={CONFIG.images.logo}
                    alt="Manzu"
                    width={100}
                    height={40}
                    className="h-10 w-auto"
                  />
                </div>

                <nav className="flex flex-col gap-1 p-4">
                  <NavigationItems items={navItems} onClick={() => setIsOpen(false)} isMobile />
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center">
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

      {/* Premium Pharmacy CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#225F91] via-[#1a4a73] to-[#0f2942] text-white py-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1ABA7F]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#76D1F3]/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Award className="w-4 h-4 text-[#1ABA7F]" strokeWidth={2.5} />
            <span className="text-sm font-bold">Partner Opportunity</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black mb-6 leading-tight tracking-tight">
            Are You a Pharmacy?
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-100 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join Nigeria's first medication discovery platform and connect with verified customers across the nation.
          </p>

          <Button
            asChild
            className="group relative h-14 sm:h-16 px-8 sm:px-12 text-lg font-bold rounded-xl bg-[#1ABA7F] hover:bg-[#16a876] text-white shadow-2xl hover:shadow-[#1ABA7F]/30 transition-all duration-300 overflow-hidden"
          >
            <Link href="/pharmacy/register">
              <span className="relative z-10 flex items-center gap-3">
                Join Manzu Network
                <ChevronUp className="w-5 h-5 rotate-90 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Refined Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-white border-t-2 border-gray-100" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Image
                src={CONFIG.images.logo}
                alt="Manzu"
                width={140}
                height={56}
                className="h-12 w-auto mb-6"
              />
              <p className="text-base text-gray-600 mb-6 max-w-md leading-relaxed font-light">
                Nigeria's first medication discovery platform, connecting patients with trusted pharmacies nationwide.
              </p>
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
                    className="group p-3 rounded-xl bg-white border-2 border-gray-200 hover:border-[#1ABA7F] hover:bg-[#1ABA7F] text-gray-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Company</h3>
              <nav className="space-y-2">
                {['About', 'Contact', 'Careers'].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase()}`}
                    className="block text-base text-gray-600 hover:text-[#225F91] transition-colors font-medium"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Contact</h3>
              <div className="space-y-3">
                <a 
                  href={`tel:${CONFIG.contact.phone}`} 
                  className="flex items-center gap-3 text-base text-gray-600 hover:text-[#225F91] transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-[#1ABA7F]/10 transition-colors">
                    <Phone className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <span className="font-medium">{CONFIG.contact.phone}</span>
                </a>
                <a 
                  href={`mailto:${CONFIG.contact.email}`} 
                  className="flex items-center gap-3 text-base text-gray-600 hover:text-[#225F91] transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-[#1ABA7F]/10 transition-colors">
                    <Mail className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <span className="font-medium">{CONFIG.contact.email}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 font-medium">
              © {new Date().getFullYear()} Manzu. All rights reserved.
            </p>
            <div className="flex gap-8">
              <Link href="/privacy-policy" className="text-sm text-gray-500 hover:text-[#225F91] font-medium transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-[#225F91] font-medium transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Refined Scroll to Top */}
      <Button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 bg-[#225F91] hover:bg-[#1a4a73] text-white rounded-full shadow-lg transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" strokeWidth={2} />
      </Button>
    </div>
  );
}

export default MainLayoutContent;