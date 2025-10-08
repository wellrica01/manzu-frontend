'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Suspense, useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import ConsentModal from '@/components/ConsentModal';
import SearchBar from '@/components/search/MedSearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';
import { Pill, ChevronDown, Sparkles, Zap, Shield, Star, Clock, TrendingUp, Award, Box, Loader2, MapIcon, FileText } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'react-error-boundary';
import { IconDirection } from '@tabler/icons-react';

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
    <div className="flex justify-center mt-1 mb-8 px-2" role="region" aria-label="Language selection">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-3 px-2 py-1 sm:px-4 sm:py-2 rounded-2xl border-2 border-white/40 text-white bg-white/15 hover:bg-white/25  focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 font-bold"
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
                  className={`w-full px-3 py-1 sm:px-6 sm:py-4 text-left hover:bg-gradient-to-r hover:from-[#1ABA7F]/15 hover:to-[#225F91]/10 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
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
                  <span className="text-sm sm:text-base">{lang.name}</span>
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
      ([entry]) => { if(entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    const currentRef = statsRef.current;
    if(currentRef) observer.observe(currentRef);
    return () => currentRef && observer.unobserve(currentRef);
  }, []);

const stats = [
  { 
    icon: Pill, 
    value: '10,000+', 
    label: 'Medications Listed', 
    color: 'from-[#225F91] to-[#1a4a73]',
    description: 'NAFDAC-approved medicines'
  },
  { 
    icon: Award, 
    value: '500+', 
    label: 'Target Pharmacies', 
    color: 'from-[#FF6B6B] to-[#ee5a5a]',
    description: 'By end of 2025'
  },
  { 
    icon: MapIcon, 
    value: '10 States', 
    label: 'Platform Coverage', 
    color: 'from-[#1ABA7F] to-[#16a876]',
    description: 'Expanding nationwide'
  },
  { 
    icon: TrendingUp, 
    value: '774 LGAs', 
    label: 'National Reach', 
    color: 'from-[#FFA500] to-[#ff8c00]',
    description: 'Complete coverage goal'
  },
];

  return (
    <div ref={statsRef} className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto relative z-10">
<div className="text-center mb-16 space-y-4">
  <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
    Transforming Healthcare Access in Nigeria
  </h2>
  
  <p className="text-gray-600 text-lg font-semibold max-w-2xl mx-auto">
    Building the infrastructure that connects patients with medications across all 774 LGAs
  </p>
  
  <div className="h-2 w-32 mx-auto rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#225F91]" />
</div>

<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat, i) => (
    <div key={i} className={`group flex flex-col justify-center items-center bg-white/95 rounded-3xl p-8 shadow-xl transition-all duration-500 ${
      isVisible ? 'animate-in zoom-in-50 fade-in opacity-100' : 'opacity-0 scale-90'
    }`} style={{ animationDelay: `${i*100}ms` }}>
      <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg mb-6`}>
        <stat.icon className="h-8 w-8" strokeWidth={2.5} />
      </div>
      <div className={`text-3xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-2`}>
        {stat.value}
      </div>
      <div className="text-gray-700 text-sm font-bold text-center mb-1">{stat.label}</div>
      <div className="text-gray-500 text-xs font-medium text-center">{stat.description}</div>
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
    return () => currentRef && observer.unobserve(currentRef);
  }, []);

  return (
    <header ref={heroRef} className="relative text-center mt-1 px-3 sm:px-6 py-12 sm:py-24 lg:py-32 overflow-hidden">
      {/* Hero background */}
      <Image
        src={CONFIG.images.heroBackground}
        alt=""
        fill
        className="object-cover"
        priority
        sizes="100vw"
        quality={90}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#225F91]/90 via-[#1a4a73]/85 to-[#0f2942]/90" aria-hidden="true" />

      {/* Optimized floating blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#1ABA7F]/40 rounded-full blur-2xl animate-float" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#225F91]/40 rounded-full blur-2xl animate-float animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <LanguageToggle />

{/* Trust badges container */}
<div className="flex flex-col items-center mb-3">
  {/* 🥇 Primary badge (now first / on top) */}
  <div
    className={`flex w-fit items-center gap-2 mb-5 px-4 py-2 rounded-2xl bg-white/25  text-white font-bold border border-white/30 shadow-xl transition-all duration-700 delay-75 ${
      isVisible ? 'animate-in zoom-in-50 fade-in opacity-100' : 'opacity-0 scale-95'
    }`}
  >
    <Award className="w-5 h-5 text-[#1ABA7F]" />
    <span>Nigeria&apos;s First Medication Discovery Platform</span>
    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
  </div>

  {/* 🛡️ Secondary badge (now below) */}
  <div
    className={`flex w-fit items-center gap-3 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#1ABA7F]/20 to-[#225F91]/20 text-white font-black text-sm shadow-2xl border-2 border-white/40 transition-all duration-700 delay-150 ${
      isVisible ? 'animate-in zoom-in-50 fade-in opacity-100' : 'opacity-0 scale-95'
    }`}
  >
    <Shield className="w-4 h-4 text-[#1ABA7F]" />
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-50 to-white font-black">
      {t('hero.trusted_platform')}
    </span>
  </div>
</div>



        {/* Main title */}
        <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 transition-all duration-1000 ${
          isVisible ? 'animate-in slide-in-from-top fade-in opacity-100' : 'opacity-0 translate-y-8'
        }`}>
          {t('hero.title')} <br />
          <span className="bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#1ABA7F] bg-clip-text text-transparent font-black animate-gradient bg-300%">
            Manzu
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`mt-6 text-base sm:text-2xl md:text-3xl text-gray-50 font-bold max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${
          isVisible ? 'animate-in slide-in-from-bottom fade-in opacity-100' : 'opacity-0 translate-y-8'
        }`}>
          {t('hero.subtitle')}
        </p>

        {/* CTA buttons */}
        <div className={`mt-8 flex flex-col sm:flex-row justify-center items-center gap-5 transition-all duration-1000 delay-500 ${
          isVisible ? 'animate-in zoom-in-50 fade-in opacity-100' : 'opacity-0 scale-95'
        }`}>
          <Button onClick={onSearchClick} className="h-14 sm:h-16 px-10 text-base sm:text-lg font-black rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
             <div className="p-1.5 bg-white/20 rounded-lg">
                <Pill className="w-6 h-6" aria-hidden="true" strokeWidth={3} />
              </div>
            {t('hero.find_medications')}
          </Button>
          <Button onClick={onUploadClick} className="h-14 sm:h-16 px-10 text-base sm:text-lg font-black rounded-2xl bg-white/15 border-2 border-white/60 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
             <div className="p-1.5 bg-yellow-300/80 rounded-lg">
                <Zap className="w-6 h-6 text-[#225F91]" aria-hidden="true" strokeWidth={3} />
              </div>
            {t('hero.upload_prescription')}
          </Button>
        </div>

      {/* Enhanced Alternative Access Methods */}
        <details
          className={`mt-8 group transition-all duration-1000 delay-700 ${
            isVisible ? 'animate-in slide-in-from-bottom fade-in opacity-100' : 'opacity-0 translate-y-8'
          }`}
        >
          <summary className="text-sm sm:text-base text-gray-100 cursor-pointer hover:text-white transition-colors duration-200 flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-white/50 rounded-2xl px-4 py-2 backdrop-blur-xl bg-white/10 hover:bg-white/20 w-fit mx-auto font-bold shadow-lg">
            <IconDirection className="w-5 h-5" aria-hidden="true" />
            <span>Other Links</span>
            <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-5 animate-in slide-in-from-top fade-in duration-300">

          <Button
            asChild
            className="w-fit group h-12 sm:h-16 px-6 text-base sm:text-lg font-black rounded-2xl bg-white/15 border-2 border-white/60 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          >
            <Link href="/track-order">
              <span className="relative z-10 flex items-center gap-3">
                <div className="p-1.5 bg-yellow-300/80 rounded-lg">
                  <MapIcon className="h-6 w-6 text-[#225F91]" aria-hidden="true" strokeWidth={3}/>
                </div>
                Track Order
              </span>
            </Link>
          </Button>

          <Button
              asChild
              className="w-fit group h-12 sm:h-16 px-6 text-base sm:text-lg font-black rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/check-prescription-status">
                <span className="relative z-10 flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                  <FileText className="h-6 w-6" aria-hidden="true" strokeWidth={3}/>
                  </div>
                  Check Prescription Status
                </span>
              </Link>
            </Button>
          </div>
        </details>
      </div>
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
        ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
        { threshold: 0.1, rootMargin: '50px' }
      );
      const currentRef = cardRef.current;
      if (currentRef) observer.observe(currentRef);
      return () => currentRef && observer.unobserve(currentRef);
    }, []);

    return (
      <Card
        ref={cardRef}
        className={`
          relative bg-white/95 border-0 rounded-[2rem] mt-8 sm:mt-20 mb-20 pt-10 pb-28 shadow-2xl
          transition-transform duration-500 ease-in-out hover:-translate-y-2 sm:hover:-translate-y-3 sm:hover:shadow-2xl
          sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto group
          ${isVisible ? 'animate-in slide-in-from-bottom fade-in opacity-100' : 'opacity-0 translate-y-8'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          boxShadow: isHovered 
            ? '0 20px 40px -10px rgba(26, 186, 127, 0.25)' 
            : '0 15px 30px -8px rgba(0,0,0,0.15)'
        }}
      >
        {/* Gradient overlay is ALWAYS visible now */}
        <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${gradient} opacity-40`} />

        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-br from-[#1ABA7F]/15 to-transparent rounded-br-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-gradient-to-tl from-[#225F91]/15 to-transparent rounded-tl-full pointer-events-none" />

        {/* Content */}
        <CardHeader className="p-4 sm:p-10 relative z-10">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            {Icon && (
              <div className="relative">
                <div className={`relative p-3 sm:p-5 rounded-3xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-500 ${isHovered ? 'scale-105' : ''}`}>
                  <Icon className="w-8 sm:w-10 h-8 sm:h-10 text-white" strokeWidth={2.5} />
                </div>
              </div>
            )}
            {isActive && (
              <Badge className={`bg-gradient-to-r ${gradient} text-white border-0 px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg transition-transform duration-300`}>
                <Star className="h-4 w-4 mr-1.5 fill-current" /> Popular
              </Badge>
            )}
          </div>

          <CardTitle className="text-3xl sm:text-5xl font-black text-[#225F91] tracking-tight text-center mb-4">
            {title}
          </CardTitle>

          {/* Gradient underline */}
          <div className={`h-1.5 w-28 mx-auto rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 shadow-sm ${isHovered ? 'w-36' : ''}`} />
        </CardHeader>

        <CardContent className="px-3 sm:px-10 relative z-10">
          {children}
        </CardContent>

        {/* Shine effect stays on hover */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      </Card>
    );
  });

  ServiceCard.displayName = 'ServiceCard';

  // Improved scroll utility function with better easing
  const smoothScrollTo = (element, offset = 100, duration = 800) => {
    if (!element) return;

    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    // Easing function for smoother animation (ease-in-out-cubic)
    const easeInOutCubic = (t) => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };



  function HomePageContent() {
    const router = useRouter();
    const { t } = useTranslation();
    const [isConsentOpen, setIsConsentOpen] = useState(false);
    const [isPageLoaded, setIsPageLoaded] = useState(false);
    const [visibleSection, setVisibleSection] = useState(null);

    const searchRef = useRef(null);
    const uploadRef = useRef(null);

    const pathname = usePathname();


    useEffect(() => {
      const hasConsent = localStorage.getItem('manzu_consent');
      if (!hasConsent) {
        setIsConsentOpen(true);
      }
      
      const timer = setTimeout(() => setIsPageLoaded(true), 100);
      return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
      // Scroll to top when this page first loads (refresh or direct visit)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // Prevent browser restoring scroll position (Safari/Chrome behavior)
      const handleBeforeUnload = () => window.scrollTo(0, 0);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // When navigating back to this page via router (client-side navigation)
    useEffect(() => {
      if (pathname === "/") {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    }, [pathname]);


    const handleConsentClose = useCallback(() => {
      setIsConsentOpen(false);
      localStorage.setItem('manzu_consent', 'true');
    }, []);

  const handleSearchClick = useCallback(() => {
    setVisibleSection("search");
    
    if (process.env.NODE_ENV === 'production') {
      // window.analytics?.track('search_section_opened');
    }
    
    // Longer delay to ensure content is rendered
    setTimeout(() => {
      if (searchRef.current) {
        // Use custom smooth scroll with better offset
        smoothScrollTo(searchRef.current, 120, 1000);
        
        // Focus search input after scroll completes (on desktop only)
        setTimeout(() => {
          const searchInput = searchRef.current?.querySelector('input');
          if (searchInput && window.innerWidth >= 768) {
            searchInput.focus();
          }
        }, 1000);
      }
    }, 150);
  }, []);



  const handleUploadClick = useCallback(() => {
    setVisibleSection("upload");
    
    if (process.env.NODE_ENV === 'production') {
      // window.analytics?.track('upload_section_opened');
    }
    
    setTimeout(() => {
      if (uploadRef.current) {
        // Use custom smooth scroll with better offset
        smoothScrollTo(uploadRef.current, 120, 1000);
        
        // Focus upload button after scroll completes
        setTimeout(() => {
          const uploadButton = uploadRef.current?.querySelector('button');
          uploadButton?.focus();
        }, 1000);
      }
    }, 150);
  }, []);


    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-12 pb-24 sm:py-8 relative transition-all duration-1000 ${
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


          {/* Vision Statement Section - ADD THIS ENTIRE BLOCK */}
  <Suspense fallback={<LoadingSkeleton />}>
    <div className="py-16 px-4 relative">
    <div className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-[#225F91] to-[#1a4a73] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1ABA7F]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#76D1F3]/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-4">
            <Sparkles className="w-5 h-5 text-[#1ABA7F]" />
            <span className="text-sm font-bold">Our Mission</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black leading-tight">
            Making Every Medication Findable and Accessible
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-100 font-medium max-w-3xl mx-auto leading-relaxed">
      We&apos;re not just another pharmacy app. We&apos;re building Nigeria&apos;s medication discovery infrastructure        </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl mb-3">🎯</div>
              <div className="font-bold mb-2">Patient-First</div>
              <div className="text-sm text-gray-200">Your health access is our priority</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl mb-3">💎</div>
              <div className="font-bold mb-2">Transparency</div>
              <div className="text-sm text-gray-200">Real prices, real availability</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl mb-3">🚀</div>
              <div className="font-bold mb-2">Innovation</div>
              <div className="text-sm text-gray-200">Technology solving real problems</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </Suspense>

        <div className="px-2 relative z-10">
          {visibleSection === "search" && (
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<LoadingSkeleton />}>
                <div ref={searchRef} className="scroll-mt-32">
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
                    <div className='mt-12'>
                      <SearchBar />
                    </div>
                  </ServiceCard>
                </div>
              </Suspense>
            </ErrorBoundary>
          )}

          {visibleSection === "upload" && (
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<LoadingSkeleton />}>
                <div ref={uploadRef} className="scroll-mt-32">
                  <ServiceCard
                    title={t("services.upload_prescription")}
                    icon={Zap}
                    gradient="from-[#1ABA7F] to-[#16a876]"
                  >
                    <div className="text-center mb-10">
                      <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-[#1ABA7F]/15 to-[#16a876]/15 text-[#1ABA7F] text-sm sm:text-base font-black mb-6 border-2 border-[#1ABA7F]/30 shadow-lg">
                        <Clock className="h-6 w-6 animate-pulse" aria-hidden="true" />
                        {t('services.processing_time', 'Fast Processing')}
                      </div>
                      <p className="text-gray-600 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto font-bold">
                        {t('services.upload_description', 'Upload your prescription and get your medications ready instantly')}
                      </p>
                    </div>
                    <div className='mt-12'>
                      <PrescriptionUploadForm />
                    </div>
                  </ServiceCard>
                </div>
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
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 8rem;
        }
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
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
          <div className="text-center max-w-md bg-white rounded-3xl p-10 shadow-3xl border-2 border-gray-100 relative">
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