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

// Enhanced Language Toggle with better UX
const LanguageToggle = ({ onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const dropdownRef = useRef(null);
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' }
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
    <div className="flex justify-end mb-6" role="region" aria-label="Language selection">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1ABA7F]/20 text-[#225F91] bg-white/95 hover:bg-white focus:ring-2 focus:ring-[#1ABA7F] transition-all duration-300 shadow-sm"
          aria-label="Select language"
        >
          <span className="text-lg">{currentLang?.flag}</span>
          <span className="font-medium">{currentLang?.name}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in slide-in-from-top-2 duration-200">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 ${
                  selectedLang === lang.code ? 'bg-[#1ABA7F]/10 text-[#1ABA7F]' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Hero Section with advanced animations
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
    <header ref={heroRef} className="text-center mb-16 sm:mb-20 relative z-10">
      {/* Enhanced trust badge with animation */}
      <div className={`inline-block mb-4 px-4 py-2 rounded-full bg-[#1ABA7F]/20 text-[#1ABA7F] text-sm font-semibold transition-all duration-1000 ${
        isVisible ? 'animate-in zoom-in-50 opacity-100' : 'opacity-0 scale-95'
      }`}>
        <Shield className="inline-block w-4 h-4 mr-2" />
        {t('hero.trusted_platform')}
      </div>

      {/* Enhanced title with staggered animation */}
      <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight transition-all duration-1000 ${
        isVisible ? 'animate-in slide-in-from-top opacity-100' : 'opacity-0 translate-y-8'
      }`}>
        {t('hero.title')} {' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1ABA7F] to-[#225F91] relative">
          Manzu
          <Sparkles className="absolute -top-2 -right-8 w-6 h-6 text-[#1ABA7F] animate-pulse" />
        </span>
      </h1>

      {/* Enhanced subtitle with delay */}
      <p className={`mt-4 text-lg sm:text-xl text-gray-600 font-medium max-w-3xl mx-auto transition-all duration-1000 delay-300 ${
        isVisible ? 'animate-in slide-in-from-bottom opacity-100' : 'opacity-0 translate-y-8'
      }`}>
        {t('hero.subtitle')}
      </p>
      
      {/* Enhanced CTAs with staggered animation */}
      <div className={`mt-8 flex flex-col sm:flex-row justify-center gap-4 transition-all duration-1000 delay-500 ${
        isVisible ? 'animate-in zoom-in-50 opacity-100' : 'opacity-0 scale-95'
      }`}>
        <Button
          onClick={onSearchClick}
          className="group h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
          aria-label={t('hero.find_medications')}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Pill className="w-5 h-5" />
            {t('hero.find_medications')}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A4971] to-[#225F91] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
        
        <Button
          onClick={onUploadClick}
          className="group h-12 px-8 text-base font-semibold rounded-full bg-transparent border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
          aria-label={t('hero.upload_prescription')}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t('hero.upload_prescription')}
          </span>
          <div className="absolute inset-0 bg-[#1ABA7F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </div>
      
      {/* Enhanced secondary access methods */}
      <details className={`mt-6 group transition-all duration-1000 delay-700 ${
        isVisible ? 'animate-in slide-in-from-bottom opacity-100' : 'opacity-0 translate-y-8'
      }`}>
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-[#1ABA7F] transition-colors duration-200 flex items-center justify-center gap-1">
          <Globe className="w-4 h-4" />
          {t('hero.other_access_methods')} 
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4 animate-in slide-in-from-top duration-300">
          <Button
            asChild
            className="group h-10 px-6 text-sm font-semibold rounded-full bg-[#25D366] text-white hover:bg-[#20B85A] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            aria-label={t('hero.whatsapp_search')}
          >
            <a href="https://wa.me/+2341234567890?text=Find%20medication" target="_blank" rel="noopener noreferrer">
              <span className="relative z-10 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('hero.whatsapp_search')}
              </span>
              <div className="absolute inset-0 bg-[#20B85A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
          </Button>
          <Button
            className="group h-10 px-6 text-sm font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            aria-label={t('hero.ussd_search')}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('hero.ussd_search')} (*123*456#)
            </span>
            <div className="absolute inset-0 bg-[#1A4971] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </div>
      </details>
    </header>
  );
};

// Enhanced Service Card with better animations and interactions
const ServiceCard = ({ title, icon: Icon, children, ref, className = "", isActive = false, gradient = "from-[#1ABA7F] to-[#225F91]" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  return (
    <Card 
      ref={ref || cardRef} 
      className={`relative bg-white/95 border-0 rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl ${className} ${
        isActive ? 'ring-2 ring-[#1ABA7F]/50 shadow-2xl' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 transition-opacity duration-300 ${
        isHovered ? 'opacity-10' : ''
      }`} />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 rounded-br-3xl" />
      <div className="absolute top-6 right-6">
        <div className="w-3 h-3 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full animate-pulse" />
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-[#1ABA7F]/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#225F91]/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      <CardHeader className="p-8 sm:p-10 relative z-10">
        <div className="flex items-center justify-between mb-6">
          {Icon && (
            <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 transition-all duration-300 ${
              isHovered ? 'scale-110 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20' : ''
            }`}>
              <Icon className={`w-12 h-12 text-[#1ABA7F] transition-all duration-300 ${
                isHovered ? 'scale-110' : ''
              }`} aria-hidden="true" />
            </div>
          )}
          {isActive && (
            <Badge variant="secondary" className="bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white border-0 px-3 py-1 rounded-full">
              <Star className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          )}
        </div>
        <CardTitle className="text-3xl sm:text-4xl font-bold text-[#225F91] tracking-tight text-center mb-2">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-8 sm:p-10 relative z-10">
        {children}
      </CardContent>
      
      {/* Enhanced hover animation */}
      <div className={`absolute inset-0 ring-2 ring-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-3xl opacity-0 transition-all duration-300 ${
        isHovered ? 'opacity-100 scale-105' : 'scale-100'
      }`} />
    </Card>
  );
};

// Enhanced Services Section
const ServicesSection = ({ searchRef, uploadRef }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-12 relative z-10">
            {/* Search Card */}
      <ServiceCard 
        ref={searchRef} 
        title={t('services.search_medications')} 
        icon={Pill}
        isActive={true}
        gradient="from-[#1ABA7F] to-[#225F91]"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1ABA7F]/10 text-[#1ABA7F] text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Most Popular
            </div>
            <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
              Find medications instantly and compare prices from verified pharmacies
            </p>
          </div>
          <SearchBar />
        </div>
      </ServiceCard>
      
      {/* Upload Card */}
      <ServiceCard 
        ref={uploadRef} 
        title={t('services.upload_prescription')}
        icon={Zap}
        gradient="from-[#225F91] to-[#1A4971]"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#225F91]/10 text-[#225F91] text-sm font-medium mb-4">
              <Clock className="h-4 w-4" />
              24-Hour Processing
            </div>
            <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
              Upload your prescription and get your medications ready within 24 hours
            </p>
          </div>
          <PrescriptionUploadForm />
        </div>
      </ServiceCard>
      
      {/* Pharmacy Services Card */}
      <ServiceCard 
        title={t('services.for_pharmacies')}
        icon={Users}
        gradient="from-[#1A4971] to-[#225F91]"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A4971]/10 text-[#1A4971] text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              For Pharmacies
            </div>
            <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto mb-8">
              Join our network and grow your business with verified customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-br from-[#1ABA7F]/5 to-[#1ABA7F]/10 rounded-2xl border border-[#1ABA7F]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#1ABA7F]/20 rounded-xl">
                  <Users className="h-5 w-5 text-[#1ABA7F]" />
                </div>
                <h4 className="font-semibold text-[#225F91]">Reach More Customers</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Connect with customers looking for medications in your area
              </p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-[#225F91]/5 to-[#225F91]/10 rounded-2xl border border-[#225F91]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#225F91]/20 rounded-xl">
                  <Clock className="h-5 w-5 text-[#225F91]" />
                </div>
                <h4 className="font-semibold text-[#225F91]">Manage Orders</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Handle orders efficiently with our management dashboard
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              variant="outline"
              className="group w-full sm:w-auto h-12 px-8 text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-[0_0_15px_rgba(26,186,127,0.3)] transition-all duration-300 relative overflow-hidden"
              aria-label={t('services.register_pharmacy')}
            >
              <Link href="/pharmacy/register" target="_blank" rel="noopener noreferrer">
                <span className="relative z-10 flex items-center gap-2">
                  {t('services.register_pharmacy')}
                  <ArrowRight className="h-4 w-4" />
                </span>
                <div className="absolute inset-0 bg-[#1ABA7F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>
            <Button
              asChild
              className="group w-full sm:w-auto h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.5)] transition-all duration-300 relative overflow-hidden"
              aria-label={t('services.pharmacy_login')}
            >
              <Link href="/pharmacy/login" target="_blank" rel="noopener noreferrer">
                <span className="relative z-10 flex items-center gap-2">
                  {t('services.pharmacy_login')}
                  <ArrowRight className="h-4 w-4" />
                </span>
                <div className="absolute inset-0 bg-[#1A4971] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </ServiceCard>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const searchRef = useRef(null);
  const uploadRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('manzu_consent')) {
      setIsConsentOpen(true);
    }
    
    // Add page load animation
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleConsentClose = useCallback(() => {
    setIsConsentOpen(false);
  }, []);

  const handleSearchClick = useCallback(() => {
    if (searchRef.current) {
      searchRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  const handleUploadClick = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-all duration-1000 ${
      isPageLoaded ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Enhanced background with animated elements */}
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none animate-pulse" aria-hidden="true" />
      
      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-[#1ABA7F]/20 rounded-full animate-bounce" aria-hidden="true" />
      <div className="absolute top-40 right-20 w-6 h-6 bg-[#225F91]/20 rounded-full animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-[#1ABA7F]/30 rounded-full animate-bounce" aria-hidden="true" />
      
      <div className="container mx-auto max-w-6xl">
        <LanguageToggle />
        <HeroSection onSearchClick={handleSearchClick} onUploadClick={handleUploadClick} />
        <ServicesSection searchRef={searchRef} uploadRef={uploadRef} />
        <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
      </div>
    </div>
  );
}