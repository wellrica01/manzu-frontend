'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Suspense, useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import ConsentModal from '@/components/ConsentModal';
import SearchBar from '@/components/search/MedSearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';
import { Pill, MessageCircle, Phone, ChevronDown, Sparkles, Zap, Shield, Globe, Star, Clock, TrendingUp, Users, Award, Box, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'react-error-boundary';

const CONFIG = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+2348012345678',
  ussdCode: process.env.NEXT_PUBLIC_USSD_CODE || '*123*456#',
  images: {
    heroBackground: process.env.NEXT_PUBLIC_HERO_IMAGE || '/images/hero-bg.jpg',
  }
};

function SectionErrorFallback({ error }) {
  return (
    <div className="p-8 text-center bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl border-2 border-red-200/50 shadow-xl" role="alert">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white mb-4 shadow-lg">
        <Sparkles className="h-8 w-8" />
      </div>
      <p className="text-red-800 font-bold text-lg mb-2">Unable to load this section</p>
      <p className="text-red-600 text-sm">Please refresh the page or try again later</p>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="relative h-80 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-3xl mb-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
    </div>
    <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl w-3/4 mx-auto mb-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
    </div>
    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl w-1/2 mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
    </div>
  </div>
);

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
  }, [i18n, onLanguageChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
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
    <div className="flex justify-center mt-4 mb-8 px-2" role="region" aria-label="Language selection">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-3 px-3 py-2 sm:px-6 sm:py-3 rounded-2xl border-2 border-white/40 text-white bg-white/15 hover:bg-white/25 backdrop-blur-xl focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 font-bold"
          aria-label={`Select language. Current language: ${currentLang?.name}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-lg sm:text-2xl drop-shadow-lg" aria-hidden="true">{currentLang?.flag}</span>
          <span className="font-black text-sm sm:text-lg">{currentLang?.name}</span>
          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
        
        {isOpen && (
          <ul 
            className="absolute right-0 top-full mt-3 bg-white/98 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-[#1ABA7F]/30 py-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300 w-56 overflow-hidden"
            role="listbox"
            aria-label="Available languages"
          >
            {languages.map((lang) => (
              <li key={lang.code} role="option" aria-selected={selectedLang === lang.code}>
                <button
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full px-4 py-2 sm:px-6 sm:py-4 text-left hover:bg-gradient-to-r hover:from-[#1ABA7F]/15 hover:to-[#225F91]/10 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                    selectedLang === lang.code 
                      ? 'bg-gradient-to-r from-[#1ABA7F]/20 to-[#225F91]/20 text-[#225F91] font-black' 
                      : 'text-gray-700 font-semibold'
                  }`}
                  aria-label={`Switch to ${lang.name}`}
                >
                  {selectedLang === lang.code && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1ABA7F] to-[#225F91]" />
                  )}
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300" aria-hidden="true">{lang.flag}</span>
                  <span className="text-base">{lang.name}</span>
                  {selectedLang === lang.code && (
                    <span className="ml-auto w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#1ABA7F] to-[#225F91] animate-pulse shadow-lg" />
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

const StatsSection = memo(() => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    const currentRef = statsRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const stats = [
    { icon: Pill, value: '7800+', label: 'Genuine Medications', color: 'from-[#225F91] to-[#1a4a73]' },
    { icon: Award, value: '150+', label: 'Partner Pharmacies', color: 'from-[#FF6B6B] to-[#ee5a5a]' },
    { icon: Box, value: '60K+', label: 'Orders Fulfilled', color: 'from-[#1ABA7F] to-[#16a876]' },
    { icon: TrendingUp, value: '99%', label: 'Customer Satisfaction', color: 'from-[#FFA500] to-[#ff8c00]' },
  ];

  return (
    <div ref={statsRef} className="py-20 px-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#1ABA7F]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#225F91]/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
            Trusted by Thousands
          </h2>
          <div className="h-2 w-32 mx-auto rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#225F91]" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group relative flex flex-col justify-center items-center bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-[#1ABA7F]/30 overflow-hidden ${
                isVisible ? 'animate-in zoom-in-50 fade-in opacity-100' : 'opacity-0 scale-90'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#1ABA7F]/10 to-transparent rounded-bl-full" />
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl blur-xl opacity-50 animate-pulse`} />
                <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className="h-4 sm:h-8 w-4 sm:w-8" strokeWidth={2.5} />
                </div>
              </div>

              {/* Value */}
              <div className={`text-3xl sm:text-5xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300`}>
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-gray-600 text-sm sm:text-base font-bold text-center px-2">
                {stat.label}
              </div>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

StatsSection.displayName = 'StatsSection';

const HeroSection = memo(({ onSearchClick, onUploadClick }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const currentRef = heroRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
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
      className="relative text-center mt-1 px-3 sm:px-6 py-12 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Image */}
      <Image
        src={CONFIG.images.heroBackground}
        alt=""
        fill
        className="object-cover"
        priority
        sizes="100vw"
        quality={90}
      />
      
      {/* Enhanced Multi-layer Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#225F91]/95 via-[#1a4a73]/90 to-[#0f2942]/95" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#225F91]/50 via-transparent to-[#1ABA7F]/50" aria-hidden="true" />
      
      {/* Animated Mesh Gradient with more dramatic effects */}
      <div className="absolute inset-0 opacity-40" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#1ABA7F] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#225F91] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-[#76D1F3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Decorative Floating Pills with glow */}
      <FloatingElement delay={0} className="absolute top-20 left-10 opacity-20">
        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-full blur-2xl" />
          <Pill className="relative w-20 h-20 text-white rotate-45" strokeWidth={2} />
        </div>
      </FloatingElement>
      <FloatingElement delay={1} className="absolute bottom-20 right-10 opacity-20">
        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-full blur-2xl" />
          <Pill className="relative w-24 h-24 text-white -rotate-12" strokeWidth={2} />
        </div>
      </FloatingElement>
      <FloatingElement delay={2} className="absolute top-40 right-20 opacity-15">
        <div className="relative">
          <div className="absolute inset-0 bg-[#1ABA7F] rounded-full blur-2xl" />
          <Shield className="relative w-16 h-16 text-white rotate-12" strokeWidth={2} />
        </div>
      </FloatingElement>

      <div className="relative z-10 max-w-6xl mx-auto">
        <LanguageToggle />
        
        {/* Enhanced Trust Badge */}
        <div
          className={`inline-flex items-center gap-3 mb-8 px-4 sm:px-8 py-2 sm:py-4 rounded-2xl bg-white/25 backdrop-blur-xl text-white text-sm sm:text-base font-black shadow-2xl border-2 border-white/40 transition-all duration-700 hover:scale-110 hover:bg-white/35 ${
            isVisible ? 'animate-in zoom-in-50 fade-in opacity-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#1ABA7F] rounded-full blur-lg animate-pulse" />
            <Shield className="relative w-5 sm:w-6 h-5 sm:h-6 text-[#1ABA7F]" aria-hidden="true" strokeWidth={3} />
          </div>
          <span className="bg-gradient-to-r from-white via-gray-50 to-white bg-clip-text text-transparent font-black tracking-wide">
            {t('hero.trusted_platform')}
          </span>
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" aria-hidden="true" />
        </div>

        {/* Main Title with Ultra Premium Gradient */}
        <h1
          className={`text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] transition-all duration-1000 mb-8 ${
            isVisible ? 'animate-in slide-in-from-top fade-in opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="inline-block hover:scale-105 transition-transform duration-300 drop-shadow-2xl">
            {t('hero.title')}
          </span>
          <br />
          <span className="relative inline-block mt-4">
            <span className="bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#1ABA7F] bg-clip-text text-transparent animate-gradient bg-300% font-black drop-shadow-2xl">
              Manzu
            </span>
            <div className="absolute -top-4 -right-12 w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center shadow-xl animate-bounce">
              <Sparkles className="h-6 w-6 text-[#225F91]" aria-hidden="true" strokeWidth={3} />
            </div>
            <div className="absolute -bottom-3 left-0 right-0 h-3 bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#1ABA7F] rounded-full blur-md animate-gradient bg-300% shadow-2xl" />
          </span>
        </h1>

        {/* Enhanced Subtitle */}
        <p
          className={`mt-8 text-base sm:text-2xl md:text-3xl text-gray-50 font-bold max-w-4xl mx-auto leading-relaxed drop-shadow-lg transition-all duration-1000 delay-300 ${
            isVisible ? 'animate-in slide-in-from-bottom fade-in opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          {t('hero.subtitle')}
        </p>

        {/* Ultra Premium CTA Buttons */}
        <div
          className={`mt-10 sm:mt-14 flex flex-col sm:flex-row justify-center items-center gap-5 transition-all duration-1000 delay-500 ${
            isVisible ? 'animate-in zoom-in-50 fade-in opacity-100' : 'opacity-0 scale-95'
          }`}
        >
          <Button
            onClick={onSearchClick}
            className="group relative h-14 sm:h-16 px-10 sm:px-12 text-base sm:text-lg font-black rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white hover:from-[#16a876] hover:to-[#1ABA7F] shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden hover:scale-110 border-2 border-white/30"
            aria-label={t('hero.find_medications')}
          >
            <span className="relative z-10 flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Pill className="w-6 h-6" aria-hidden="true" strokeWidth={3} />
              </div>
              {t('hero.find_medications')}
            </span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
          
          <Button
            onClick={onUploadClick}
            className="group relative h-14 sm:h-16 px-10 sm:px-12 text-base sm:text-lg font-black rounded-2xl bg-white/15 backdrop-blur-xl border-2 border-white/60 text-white hover:bg-white/25 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden hover:scale-110"
            aria-label={t('hero.upload_prescription')}
          >
            <span className="relative z-10 flex items-center gap-3">
              <div className="p-1.5 bg-yellow-300/80 rounded-lg">
                <Zap className="w-6 h-6 text-[#225F91]" aria-hidden="true" strokeWidth={3} />
              </div>
              {t('hero.upload_prescription')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>

        {/* Enhanced Alternative Access Methods */}
        <details
          className={`mt-12 group transition-all duration-1000 delay-700 ${
            isVisible ? 'animate-in slide-in-from-bottom fade-in opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          <summary className="text-sm sm:text-base text-gray-100 cursor-pointer hover:text-white transition-colors duration-200 flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-white/50 rounded-2xl px-6 py-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 w-fit mx-auto font-bold shadow-lg">
            <Globe className="w-5 h-5" aria-hidden="true" />
            <span>{t('hero.other_access_methods')}</span>
            <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-5 animate-in slide-in-from-top fade-in duration-300">
            <Button
              asChild
              onClick={handleWhatsAppClick}
              className="group h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-black rounded-2xl bg-[#25D366] text-white hover:bg-[#20B85A] shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-2 border-white/30"
            >
              <a 
                href={`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent('Find medication')}`}
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={t('hero.whatsapp_search')}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <MessageCircle className="h-6 w-6" aria-hidden="true" />
                  {t('hero.whatsapp_search')}
                </span>
              </a>
            </Button>

            <Button
              onClick={handleUSSDClick}
              className="group h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-black rounded-2xl bg-white/15 backdrop-blur-xl border-2 border-white/60 text-white hover:bg-white/25 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
              aria-label={`${t('hero.ussd_search')} ${CONFIG.ussdCode}`}
            >
              <span className="relative z-10 flex items-center gap-3">
                <Phone className="h-6 w-6" aria-hidden="true" />
                {t('hero.ussd_search')} ({CONFIG.ussdCode})
              </span>
            </Button>
          </div>
        </details>
      </div>

      {/* Enhanced Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/10 to-transparent" aria-hidden="true" />
    </header>
  );
});

HeroSection.displayName = 'HeroSection';

const ServiceCard = memo(({ title, icon: Icon, children, isActive = false, gradient = "from-[#1ABA7F] to-[#225F91]" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const currentRef = cardRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <Card 
      ref={cardRef}
      className={`relative bg-white/98 backdrop-blur-xl border-0 rounded-[2rem] mt-8 sm:mt-20 mb-20 pt-10 pb-28 shadow-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-3xl sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto group ${
        isVisible ? 'animate-in slide-in-from-bottom fade-in opacity-100' : 'opacity-0 translate-y-8'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered 
          ? '0 30px 60px -15px rgba(26, 186, 127, 0.3), 0 0 0 3px rgba(26, 186, 127, 0.15)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Animated Border Gradient with glow */}
      <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[3px]`} aria-hidden="true">
        <div className="w-full h-full bg-white rounded-[2rem]" />
      </div>

      {/* Enhanced Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 transition-opacity duration-300 ${
        isHovered ? 'opacity-15' : ''
      }`} aria-hidden="true" />

      {/* Premium Decorative Elements */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[#1ABA7F]/15 to-transparent rounded-br-full" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-[#225F91]/15 to-transparent rounded-tl-full" aria-hidden="true" />
      
      {/* Animated Dots with glow */}
      <div className="absolute top-8 right-8 flex gap-3" aria-hidden="true">
        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradient} animate-pulse shadow-lg`} />
        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradient} animate-pulse delay-75 shadow-lg`} />
        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradient} animate-pulse delay-150 shadow-lg`} />
      </div>
      
      <CardHeader className="p-6 sm:p-10 relative z-10">
        <div className="flex items-center justify-between mb-8">
          {Icon && (
            <div className="relative">
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} blur-2xl opacity-50 animate-pulse`} />
              <div className={`relative p-3 sm:p-5 rounded-3xl bg-gradient-to-br ${gradient} shadow-2xl transition-all duration-500 ${
                isHovered ? 'scale-110 rotate-3' : ''
              }`}>
                <Icon className="w-8 sm:w-10 h-8 sm:h-10 text-white" aria-hidden="true" strokeWidth={2.5} />
                <div className={`absolute inset-0 rounded-3xl bg-white opacity-0 group-hover:opacity-25 transition-opacity duration-300 ${
                  isHovered ? 'animate-pulse' : ''
                }`} />
              </div>
            </div>
          )}
          {isActive && (
            <Badge className={`bg-gradient-to-r ${gradient} text-white border-0 px-5 py-2.5 rounded-2xl text-sm font-black shadow-2xl hover:scale-110 transition-transform duration-300`}>
              <Star className="h-4 w-4 mr-1.5 fill-current" aria-hidden="true" />
              Popular
            </Badge>
          )}
        </div>
        <CardTitle className="text-3xl sm:text-6xl font-black text-[#225F91] tracking-tight text-center mb-4">
          {title}
        </CardTitle>
        <div className={`h-2 w-32 mx-auto rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 shadow-lg ${
          isHovered ? 'w-40' : ''
        }`} aria-hidden="true" />
      </CardHeader>
      
      <CardContent className="px-3 sm:px-10 relative z-10">
        {children}
      </CardContent>

      {/* Enhanced Shine Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
        isHovered ? 'animate-shine' : ''
      }`} aria-hidden="true" />
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

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
      className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-12 pb-24 sm:py-8 relative overflow-hidden transition-all duration-1000 ${
        isPageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Enhanced Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#1ABA7F] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-[#225F91] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-[#76D1F3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="mx-auto flex-1 flex-col relative z-10">
        <HeroSection onSearchClick={handleSearchClick} onUploadClick={handleUploadClick} />

        {/* Stats Section */}
        <StatsSection />

        <div className="px-2 relative z-10">
          {visibleSection === "search" && (
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<LoadingSkeleton />}>
                <ServiceCard
                  title={t("services.search_medications")}
                  icon={Pill}
                  isActive={true}
                  gradient="from-[#1ABA7F] to-[#16a876]"
                >
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-[#1ABA7F]/15 to-[#16a876]/15 text-[#1ABA7F] text-sm sm:text-base font-black mb-6 border-2 border-[#1ABA7F]/30 shadow-lg">
                      <Sparkles className="h-6 w-6 animate-pulse" aria-hidden="true" />
                      {t('services.most_popular', 'Most Popular')}
                    </div>
                    <p className="text-gray-600 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto font-bold">
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
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-[#225F91]/15 to-[#1a4a73]/15 text-[#225F91] text-sm sm:text-base font-black mb-6 border-2 border-[#225F91]/30 shadow-lg">
                      <Clock className="h-6 w-6 animate-pulse" aria-hidden="true" />
                      {t('services.processing_time', '24-Hour Processing')}
                    </div>
                    <p className="text-gray-600 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto font-bold">
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
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
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
          animation: shine 1.5s ease-in-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
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

export default function HomePage() {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4" role="alert">
          <div className="text-center max-w-md bg-white rounded-3xl p-10 shadow-3xl border-2 border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-br-full" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-6 shadow-2xl">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] mb-4">
              Unable to load page
            </h1>
            <p className="text-gray-600 font-semibold mb-8 leading-relaxed">
              We are having trouble loading this page. Please try again.
            </p>
            <Button 
              onClick={resetErrorBoundary} 
              className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Loader2 className="mr-2 h-5 w-5" />
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