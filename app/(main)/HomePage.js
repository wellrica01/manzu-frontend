'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Suspense, useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import ConsentModal from '@/components/ConsentModal';
import SearchBar from '@/components/search/MedSearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';
import { Pill, MessageCircle, Phone, ChevronDown, Sparkles, Zap, Shield, Globe, Star, Clock, TrendingUp, Users, Award, Box } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'react-error-boundary';

// Environment configuration
const CONFIG = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+2348012345678',
  ussdCode: process.env.NEXT_PUBLIC_USSD_CODE || '*123*456#',
  images: {
    heroBackground: process.env.NEXT_PUBLIC_HERO_IMAGE || '/images/hero-bg.jpg',
  }
};

// Error Fallback for sections
function SectionErrorFallback({ error }) {
  return (
    <div className="p-8 text-center bg-red-50 rounded-lg" role="alert">
      <p className="text-red-600">Unable to load this section. Please refresh the page.</p>
    </div>
  );
}

// Loading skeleton with gradient animation
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl mb-4 animate-shimmer" style={{
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite'
    }} />
    <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-3/4 mx-auto mb-2" />
    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-1/2 mx-auto" />
  </div>
);

// Floating Animation Component for decorative elements
const FloatingElement = memo(({ delay = 0, duration = 3, children, className = "" }) => (
  <div 
    className={`animate-float ${className}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    {children}
  </div>
));

FloatingElement.displayName = 'FloatingElement';

// Memoized Language Toggle Component with enhanced design
const LanguageToggle = memo(({ onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const dropdownRef = useRef(null);
  
  const languages = useMemo(() => [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' }
  ], []);

  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
    setSelectedLang(lng);
    setIsOpen(false);
    onLanguageChange?.(lng);
    
    if (process.env.NODE_ENV === 'production') {
      // window.analytics?.track('language_changed', { language: lng });
    }
  }, [i18n, onLanguageChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const currentLang = useMemo(() => 
    languages.find(lang => lang.code === selectedLang),
    [languages, selectedLang]
  );

  return (
    <div className="flex justify-center mb-8 px-2" role="region" aria-label="Language selection">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-3 sm:px-6 py-1.5 sm:py-2.5  rounded-lg sm:rounded-xl border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md focus:ring-2 focus:ring-[#1ABA7F] transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base hover:scale-105"
          aria-label={`Select language. Current language: ${currentLang?.name}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-xl" aria-hidden="true">{currentLang?.flag}</span>
          <span className="font-semibold">{currentLang?.name}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        
        {isOpen && (
          <ul 
            className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-[#1ABA7F]/20 py-2 z-50 animate-in slide-in-from-top-2 duration-200 w-48 overflow-hidden"
            role="listbox"
            aria-label="Available languages"
          >
            {languages.map((lang) => (
              <li key={lang.code} role="option" aria-selected={selectedLang === lang.code}>
                <button
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-[#1ABA7F]/10 hover:to-[#225F91]/10 transition-all duration-200 flex items-center gap-3 text-sm sm:text-base group ${
                    selectedLang === lang.code ? 'bg-gradient-to-r from-[#1ABA7F]/20 to-[#225F91]/20 text-[#225F91] font-semibold' : 'text-gray-700'
                  }`}
                  aria-label={`Switch to ${lang.name}`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-200" aria-hidden="true">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {selectedLang === lang.code && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#1ABA7F] animate-pulse" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

LanguageToggle.displayName = 'LanguageToggle';

// Stats Section Component
const StatsSection = memo(() => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const currentRef = statsRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const stats = [
    { icon: Pill, value: '7800+', label: 'Genuine Medications', color: 'from-[#225F91] to-[#1a4a73]' },
    { icon: Award, value: '150+', label: 'Patner Pharmacies', color: 'from-[#FF6B6B] to-[#ee5a5a]' },
    { icon: Box, value: '60K+', label: 'Orders Fullfilled', color: 'from-[#1ABA7F] to-[#16a876]' },
    { icon: TrendingUp, value: '99%', label: 'Customer Satisfaction', color: 'from-[#FFA500] to-[#ff8c00]' },
  ];

  return (
    <div ref={statsRef} className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group relative flex flex-col justify-center items-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-transparent overflow-hidden ${
                isVisible ? 'animate-in zoom-in-50 opacity-100' : 'opacity-0 scale-90'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-6 w-6" />
              </div>

              <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>

              <div className="text-gray-600 text-sm font-medium text-center">
                {stat.label}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>
          ))}

        </div>
      </div>
    </div>
  );
});

StatsSection.displayName = 'StatsSection';

// Enhanced Hero Section Component
const HeroSection = memo(({ onSearchClick, onUploadClick }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const currentRef = heroRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const handleWhatsAppClick = useCallback(() => {
    if (process.env.NODE_ENV === 'production') {
      // window.analytics?.track('whatsapp_search_clicked');
    }
  }, []);

  const handleUSSDClick = useCallback(() => {
    if (process.env.NODE_ENV === 'production') {
      // window.analytics?.track('ussd_search_clicked');
    }
  }, []);
  
  return (
    <header 
      ref={heroRef} 
      className="relative text-center mt-1 px-4 sm:px-6 py-12 sm:py-20 lg:py-28 overflow-hidden"
    >
      {/* Background Image */}
      <Image
        src={CONFIG.images.heroBackground}
        alt=""
        fill
        className="object-cover"
        priority
        sizes="100vw"
        quality={85}
      />
      
      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#225F91]/90 via-[#1a4a73]/85 to-[#0f2942]/90" aria-hidden="true" />
      
      {/* Animated Mesh Gradient */}
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1ABA7F] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#225F91] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#76D1F3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Decorative Floating Pills */}
      <FloatingElement delay={0} className="absolute top-20 left-10 opacity-10">
        <Pill className="w-16 h-16 text-white rotate-45" />
      </FloatingElement>
      <FloatingElement delay={1} className="absolute bottom-20 right-10 opacity-10">
        <Pill className="w-20 h-20 text-white -rotate-12" />
      </FloatingElement>
      <FloatingElement delay={2} className="absolute top-40 right-20 opacity-10">
        <Shield className="w-12 h-12 text-white rotate-12" />
      </FloatingElement>

      <div className="relative z-10 max-w-6xl mx-auto">
        <LanguageToggle />
        
        {/* Trust Badge */}
        <div
          className={`inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-semibold shadow-lg border border-white/30 transition-all duration-700 hover:scale-105 hover:bg-white/30 ${
            isVisible ? 'animate-in zoom-in-50 opacity-100' : 'opacity-0 scale-95'
          }`}
        >
          <Shield className="w-5 h-5 text-[#1ABA7F]" aria-hidden="true" />
          <span className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent font-bold">
            {t('hero.trusted_platform')}
          </span>
          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" aria-hidden="true" />
        </div>

        {/* Main Title with Enhanced Gradient */}
        <h1
          className={`text-4xl sm:text-6xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] transition-all duration-1000 mb-6 ${
            isVisible ? 'animate-in slide-in-from-top opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="inline-block hover:scale-105 transition-transform duration-300">
            {t('hero.title')}
          </span>
          <br />
          <span className="relative inline-block mt-2">
            <span className="bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#1ABA7F] bg-clip-text text-transparent animate-gradient bg-300% font-black">
              Manzu
            </span>
            <Sparkles className="absolute -top-2 -right-10 w-8 h-8 text-[#1ABA7F] animate-pulse" aria-hidden="true" />
            <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#1ABA7F] rounded-full blur-sm animate-gradient bg-300%" />
          </span>
        </h1>

        {/* Subtitle with Better Typography */}
        <p
          className={`mt-6 text-lg sm:text-xl md:text-2xl text-gray-100 font-medium max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${
            isVisible ? 'animate-in slide-in-from-bottom opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          {t('hero.subtitle')}
        </p>

        {/* Enhanced CTA Buttons */}
        <div
          className={`mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 transition-all duration-1000 delay-500 ${
            isVisible ? 'animate-in zoom-in-50 opacity-100' : 'opacity-0 scale-95'
          }`}
        >
          <Button
            onClick={onSearchClick}
            className="group relative h-14 px-10 text-base font-bold rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white hover:from-[#16a876] hover:to-[#1ABA7F] shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 border-2 border-white/20"
            aria-label={t('hero.find_medications')}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Pill className="w-5 h-5" aria-hidden="true" />
              {t('hero.find_medications')}
            </span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
          
          <Button
            onClick={onUploadClick}
            className="group relative h-14 px-10 text-base font-bold rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/50 text-white hover:bg-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105"
            aria-label={t('hero.upload_prescription')}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-300" aria-hidden="true" />
              {t('hero.upload_prescription')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>

        {/* Enhanced Alternative Access Methods */}
        <details
          className={`mt-10 group transition-all duration-1000 delay-700 ${
            isVisible ? 'animate-in slide-in-from-bottom opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          <summary className="text-sm text-gray-200 cursor-pointer hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-xl px-4 py-2 backdrop-blur-sm bg-white/5 hover:bg-white/10 w-fit mx-auto">
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span className="font-semibold">{t('hero.other_access_methods')}</span>
            <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4 animate-in slide-in-from-top duration-300">
            <Button
              asChild
              onClick={handleWhatsAppClick}
              className="group h-12 px-6 text-sm font-bold rounded-xl bg-[#25D366] text-white hover:bg-[#20B85A] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
            >
              <a 
                href={`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent('Find medication')}`}
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={t('hero.whatsapp_search')}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  {t('hero.whatsapp_search')}
                </span>
              </a>
            </Button>

            <Button
              onClick={handleUSSDClick}
              className="group h-12 px-6 text-sm font-bold rounded-xl bg-white/10 backdrop-blur-md border-2 border-white/50 text-white hover:bg-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label={`${t('hero.ussd_search')} ${CONFIG.ussdCode}`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Phone className="h-5 w-5" aria-hidden="true" />
                {t('hero.ussd_search')} ({CONFIG.ussdCode})
              </span>
            </Button>
          </div>
        </details>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1ABA7F]/10 to-transparent" aria-hidden="true" />
    </header>
  );
});

HeroSection.displayName = 'HeroSection';

// Enhanced Service Card Component
const ServiceCard = memo(({ title, icon: Icon, children, isActive = false, gradient = "from-[#1ABA7F] to-[#225F91]" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <Card 
      ref={cardRef}
      className={`relative bg-white border-0 rounded-3xl mt-6 sm:mt-16 mb-16 pt-8 pb-24 shadow-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto group ${
        isVisible ? 'animate-in slide-in-from-bottom opacity-100' : 'opacity-0 translate-y-8'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered 
          ? '0 25px 50px -12px rgba(26, 186, 127, 0.25), 0 0 0 2px rgba(26, 186, 127, 0.1)' 
          : '0 20px 40px -12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Animated Border Gradient */}
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[2px]`} aria-hidden="true">
        <div className="w-full h-full bg-white rounded-3xl" />
      </div>

      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 transition-opacity duration-300 ${
        isHovered ? 'opacity-10' : ''
      }`} aria-hidden="true" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-br-full" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-tl-full" aria-hidden="true" />
      
      {/* Animated Dots */}
      <div className="absolute top-6 right-6 flex gap-2" aria-hidden="true">
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient} animate-pulse`} />
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient} animate-pulse delay-75`} />
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient} animate-pulse delay-150`} />
      </div>
      
      <CardHeader className="p-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          {Icon && (
            <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transition-all duration-300 ${
              isHovered ? 'scale-110 rotate-3' : ''
            }`}>
              <Icon className="w-6 h-6 sm:h-10 sm:w-10  text-white" aria-hidden="true" />
              <div className={`absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                isHovered ? 'animate-pulse' : ''
              }`} />
            </div>
          )}
          {isActive && (
            <Badge className={`bg-gradient-to-r ${gradient} text-white border-0 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform duration-300`}>
              <Star className="h-4 w-4 mr-1 fill-current" aria-hidden="true" />
              Popular
            </Badge>
          )}
        </div>
        <CardTitle className="text-3xl sm:text-5xl font-black text-[#225F91] tracking-tight text-center mb-2">
          {title}
        </CardTitle>
        <div className={`h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 ${
          isHovered ? 'w-32' : ''
        }`} aria-hidden="true" />
      </CardHeader>
      
      <CardContent className="px-2 sm:px-8 relative z-10">
        {children}
      </CardContent>

      {/* Shine Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${
        isHovered ? 'animate-shine' : ''
      }`} aria-hidden="true" />
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

// Main HomePage Component
function HomePageContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [visibleSection, setVisibleSection] = useState(null);

  const searchRef = useRef(null);
  const uploadRef = useRef(null);

  useEffect(() => {
    const hasConsent = localStorage.getItem('manzu_consent');
    if (!hasConsent) {
      setIsConsentOpen(true);
    }
    
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleConsentClose = useCallback(() => {
    setIsConsentOpen(false);
    localStorage.setItem('manzu_consent', 'true');
  }, []);

  const handleSearchClick = useCallback(() => {
    setVisibleSection("search");
    
    if (process.env.NODE_ENV === 'production') {
      // window.analytics?.track('search_section_opened');
    }
    
    setTimeout(() => {
      searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const searchInput = searchRef.current?.querySelector('input');
      searchInput?.focus();
    }, 100);
  }, []);

  const handleUploadClick = useCallback(() => {
    setVisibleSection("upload");
    
    if (process.env.NODE_ENV === 'production') {
      // window.analytics?.track('upload_section_opened');
    }
    
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const uploadButton = uploadRef.current?.querySelector('button');
      uploadButton?.focus();
    }, 100);
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-12 pb-24 sm:py-8 relative overflow-hidden transition-all duration-1000 ${
        isPageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#1ABA7F] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-[#225F91] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#76D1F3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="mx-auto flex-1 flex-col relative z-10">
        <HeroSection onSearchClick={handleSearchClick} onUploadClick={handleUploadClick} />

        {/* Stats Section */}
        <StatsSection />

        <div className="px-3 relative z-10">
          {visibleSection === "search" && (
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<LoadingSkeleton />}>
                <ServiceCard
                  title={t("services.search_medications")}
                  icon={Pill}
                  isActive={true}
                  gradient="from-[#1ABA7F] to-[#16a876]"
                >
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#1ABA7F]/10 to-[#16a876]/10 text-[#1ABA7F] text-sm font-bold mb-4 border border-[#1ABA7F]/20">
                      <Sparkles className="h-5 w-5 animate-pulse" aria-hidden="true" />
                      {t('services.most_popular', 'Most Popular')}
                    </div>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                      {t('services.search_description', 'Find medications instantly and compare prices from verified pharmacies')}
                    </p>
                  </div>
                  <div className='mt-12' ref={searchRef}>
                    <SearchBar />
                  </div>
                </ServiceCard>
              </Suspense>
            </ErrorBoundary>
          )}

          {visibleSection === "upload" && (
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<LoadingSkeleton />}>
                <ServiceCard
                  title={t("services.upload_prescription")}
                  icon={Zap}
                  gradient="from-[#225F91] to-[#1a4a73]"
                >
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#225F91]/10 to-[#1a4a73]/10 text-[#225F91] text-sm font-bold mb-4 border border-[#225F91]/20">
                      <Clock className="h-5 w-5 animate-pulse" aria-hidden="true" />
                      {t('services.processing_time', '24-Hour Processing')}
                    </div>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                      {t('services.upload_description', 'Upload your prescription and get your medications ready within 24 hours')}
                    </p>
                  </div>
                  <div className='mt-12' ref={uploadRef}>
                    <PrescriptionUploadForm />
                  </div>
                </ServiceCard>
              </Suspense>
            </ErrorBoundary>
          )}
        </div>

        <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .bg-300\% {
          background-size: 300% 300%;
        }
        .animate-shine {
          animation: shine 2s ease-in-out;
        }
        .delay-75 {
          animation-delay: 75ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
}

// Export with Error Boundary
export default function HomePage() {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4" role="alert">
          <div className="text-center max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-[#225F91] mb-4">Unable to load page</h1>
            <p className="text-gray-600 mb-6">We are having trouble loading this page. Please try again.</p>
            <Button 
              onClick={resetErrorBoundary} 
              className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Reload Page
            </Button>
          </div>
        </div>
      )}
      onReset={() => setResetKey(prev => prev + 1)}
      onError={(error, errorInfo) => {
        if (process.env.NODE_ENV === 'production') {
          console.error('HomePage Error:', error, errorInfo);
          // window.analytics?.track('homepage_error', { error: error.message });
        }
      }}
    >
      <HomePageContent key={resetKey}/>
    </ErrorBoundary>
  );
}