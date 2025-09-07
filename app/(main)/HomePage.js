'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import ConsentModal from '@/components/ConsentModal';
import SearchBar from '@/components/search/MedSearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';
import { Pill, MessageCircle, Phone, ChevronDown, Sparkles, Zap, Shield, Globe, ArrowRight, Star, Users, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Enhanced Language Toggle
const LanguageToggle = ({ onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const dropdownRef = useRef(null);
  
  const languages = [
    { code: 'en', name: 'English', flag: 'EN' },
    { code: 'ha', name: 'Hausa', flag: 'HA' },
    { code: 'yo', name: 'Yoruba', flag: 'YO' },
    { code: 'ig', name: 'Igbo', flag: 'IG' }
  ];

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(lang => lang.code === selectedLang);

  return (
    <div className="flex justify-center mb-6 sm:mb-6 px-1 sm:px-2" role="region" aria-label="Language selection">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[#1ABA7F]/20 text-[#225F91] bg-white/95 hover:bg-white focus:ring-2 focus:ring-[#1ABA7F] transition-all duration-300 shadow-sm text-sm sm:text-base"
          aria-label="Select language"
        >
          <span className="text-base sm:text-lg">{currentLang?.flag}</span>
          <span className="font-medium hidden sm:inline">{currentLang?.name}</span>
          <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in slide-in-from-top-2 duration-200 w-32 sm:w-40">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-3 py-1.5 sm:px-4 sm:py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 text-sm sm:text-base ${
                  selectedLang === lang.code ? 'bg-[#1ABA7F]/10 text-[#1ABA7F]' : 'text-gray-700'
                }`}
              >
                <span className="text-base sm:text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Hero Section
const HeroSection = ({ onSearchClick, onUploadClick }) => {
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
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  return (
<header 
  ref={heroRef} 
  className="relative text-center mt-2 px-4 sm:px-6 py-16 sm:py-20 lg:py-28 overflow-hidden"
>
  {/* Background image */}
  <img
    src="https://xhfkqugxrkvqspsuthmq.supabase.co/storage/v1/object/public/pharmacies/images/c0c0bc97-043e-400c-a575-a3a3f5ba1017.jpg"
    alt="Hero background"
    className="absolute inset-0 w-full h-full object-cover"
  />
  
  {/* Overlay for readability */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/60" />

  {/* Hero Content */}
  <div className="relative z-10">
    <LanguageToggle />
    {/* Trusted badge */}
    <div
      className={`inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1ABA7F]/20 text-[#1ABA7F] text-xs sm:text-sm font-semibold transition-all duration-500 ${
        isVisible ? 'animate-in zoom-in-50 opacity-100' : 'opacity-0 scale-95'
      }`}
    >
      <Shield className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
      {t('hero.trusted_platform')}
    </div>

    {/* Title */}
    <h1
      className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight transition-all duration-1000 ${
        isVisible ? 'animate-in slide-in-from-top opacity-100' : 'opacity-0 translate-y-8'
      }`}
    >
      {t('hero.title')}{" "}
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1ABA7F] to-[#76D1F3] relative">
        Manzu
        <Sparkles className="absolute -top-1 sm:-top-2 -right-4 sm:-right-8 w-4 h-4 sm:w-6 sm:h-6 text-[#1ABA7F] animate-pulse" />
      </span>
    </h1>

    {/* Subtitle */}
    <p
      className={`mt-4 text-base sm:text-lg md:text-xl text-gray-200 font-medium max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto transition-all duration-1000 delay-300 ${
        isVisible ? 'animate-in slide-in-from-bottom opacity-100' : 'opacity-0 translate-y-8'
      }`}
    >
      {t('hero.subtitle')}
    </p>

    {/* Buttons */}
    <div
      className={`mt-10 sm:mt-12 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 transition-all duration-1000 delay-500 ${
        isVisible ? 'animate-in zoom-in-50 opacity-100' : 'opacity-0 scale-95'
      }`}
    >
      <Button
        onClick={onSearchClick}
        className="group h-12 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-lg bg-[#225F91]  text-white hover:bg-[#1A4971] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
        aria-label={t('hero.find_medications')}
      >
        <span className="relative z-10 flex items-center gap-1 sm:gap-2">
          <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
          {t('hero.find_medications')}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A4971] to-[#225F91] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>
      
      <Button
        onClick={onUploadClick}
        className="group h-12 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-lg bg-transparent border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
        aria-label={t('hero.upload_prescription')}
      >
        <span className="relative z-10 flex items-center gap-1 sm:gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          {t('hero.upload_prescription')}
        </span>
        <div className="absolute inset-0 bg-[#1ABA7F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>
    </div>

    {/* Extra options */}
    <details
      className={`mt-6 group transition-all duration-1000 delay-700 ${
        isVisible ? 'animate-in slide-in-from-bottom opacity-100' : 'opacity-0 translate-y-8'
      }`}
    >
      <summary className="text-xs sm:text-sm text-gray-300 cursor-pointer hover:text-[#1ABA7F] transition-colors duration-200 flex items-center justify-center gap-1">
        <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
        {t('hero.other_access_methods')} 
        <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="mt-5 sm:mt-4 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-in slide-in-from-top duration-300">
        <Button
          asChild
          className="group h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-semibold rounded-full bg-[#25D366] text-white hover:bg-[#20B85A] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
          aria-label={t('hero.whatsapp_search')}
        >
          <a href="https://wa.me/+2341234567890?text=Find%20medication" target="_blank" rel="noopener noreferrer">
            <span className="relative z-10 flex items-center gap-1 sm:gap-2">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              {t('hero.whatsapp_search')}
            </span>
            <div className="absolute inset-0 bg-[#20B85A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
        </Button>

        <Button
          className="group h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
          aria-label={t('hero.ussd_search')}
        >
          <span className="relative z-10 flex items-center gap-1 sm:gap-2">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
            {t('hero.ussd_search')} (*123*456#)
          </span>
          <div className="absolute inset-0 bg-[#1A4971] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </div>
    </details>
  </div>
</header>

  );
};

// Enhanced Service Card
const ServiceCard = ({ title, icon: Icon, children, ref, className = "", isActive = false, gradient = "from-[#1ABA7F] to-[#225F91]" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  return (
    <Card 
      ref={ref || cardRef} 
      className={`relative bg-white/95 border-0 rounded-2xl mt-16 mb-16 sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-xl sm:hover:shadow-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto ring-2 ring-[#1ABA7F]/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 transition-opacity duration-300 ${
        isHovered ? 'opacity-10' : ''
      }`} />
      <div className="absolute top-0 left-0 w-8 sm:w-12 h-8 sm:h-12 bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 rounded-br-2xl sm:rounded-br-3xl" />
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full animate-pulse" />
      </div>
      
      <CardHeader className="p-4 sm:p-6 relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          {Icon && (
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 transition-all duration-300 ${
              isHovered ? 'scale-105 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20' : ''
            }`}>
              <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-[#1ABA7F] transition-all duration-300 ${
                isHovered ? 'scale-105' : ''
              }`} aria-hidden="true" />
            </div>
          )}
          {isActive && (
            <Badge variant="secondary" className="bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white border-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
              <Star className="h-2.5 w-2.5 sm:h-3 w-3 mr-1" />
              Popular
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl sm:text-4xl font-bold text-[#225F91] tracking-tight text-center">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6 relative z-10">
        {children}
      </CardContent>
    </Card>
  );
};


export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // NEW: which section to show ("search", "upload", or null)
  const [visibleSection, setVisibleSection] = useState(null);

  const searchRef = useRef(null);
  const uploadRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('manzu_consent')) {
      setIsConsentOpen(true);
    }
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleConsentClose = useCallback(() => {
    setIsConsentOpen(false);
  }, []);

  const handleSearchClick = useCallback(() => {
    setVisibleSection("search");
    setTimeout(() => {
      searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  const handleUploadClick = useCallback(() => {
    setVisibleSection("upload");
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 pt-12 pb-24 sm:py-8 relative overflow-hidden transition-all duration-1000 ${
        isPageLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none animate-pulse sm:block" aria-hidden="true" />

      <div className="mx-auto flex-1 flex-col">
        
        <HeroSection onSearchClick={handleSearchClick} onUploadClick={handleUploadClick} />

        <div className="px-3 relative z-10">
          {visibleSection === "search" && (
            <ServiceCard
              title={t("services.search_medications")}
              icon={Pill}
              isActive={true}
              gradient="from-[#1ABA7F] to-[#225F91]"
            >
            <div className="text-center">
            <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#1ABA7F]/10 text-[#1ABA7F] text-xs sm:text-sm font-medium mb-2 sm:mb-3">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Most Popular
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-full sm:max-w-md mx-auto">
              Find medications instantly and compare prices from verified pharmacies
            </p>
          </div>
          <div className='mt-10' >
              <SearchBar ref={searchRef}/>
          </div>
            </ServiceCard>
          )}

          {visibleSection === "upload" && (
            <ServiceCard
              title={t("services.upload_prescription")}
              icon={Zap}
              gradient="from-[#225F91] to-[#1A4971]"
            >
          <div ref={uploadRef} className="text-center">
            <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#225F91]/10 text-[#225F91] text-xs sm:text-sm font-medium mb-2 sm:mb-3">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              24-Hour Processing
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-full sm:max-w-md mx-auto">
              Upload your prescription and get your medications ready within 24 hours
            </p>
          </div>
          <div className='mt-10'>
              <PrescriptionUploadForm />
              </div>
            </ServiceCard>
          )}
          
        </div>

        <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
      </div>
    </div>
  );
}
