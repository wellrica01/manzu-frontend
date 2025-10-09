'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConsentModal from '@/components/ConsentModal';
import Link from 'next/link';
import { Pill, ChevronDown, Zap, Shield, Clock, Award, MapIcon, FileText, Check, ArrowRight, TrendingUp, Users, Building2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import SearchBar from '@/components/search/MedSearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';

const CONFIG = {
  images: {
    heroBackground: '/images/hero-bg.jpg',
  }
};

const LanguageToggle = ({ onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  
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

  const currentLang = useMemo(() => 
    languages.find(lang => lang.code === selectedLang),
    [languages, selectedLang]
  );

  return (
    <div className="flex justify-center mb-6 sm:mb-8">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white hover:bg-white/25 transition-all duration-300 shadow-lg hover:shadow-xl"
          aria-label={`Current language: ${currentLang?.name}`}
        >
          {/* 🌐 Flag — hidden on mobile */}
          <span className="text-lg hidden sm:inline">{currentLang?.flag}</span>

          {/* Language Name — always visible */}
          <span className="font-semibold text-sm">{currentLang?.name}</span>

          {/* Dropdown Icon */}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />

          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        
        {isOpen && (
          <div className="absolute top-full mt-3 right-0 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-[180px] z-50 animate-in slide-in-from-top-2 fade-in duration-200">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-all duration-200 ${
                  selectedLang === lang.code ? 'bg-[#1ABA7F]/5 text-[#225F91] font-bold' : 'text-gray-700 font-medium'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
                {selectedLang === lang.code && (
                  <Check className="h-4 w-4 ml-auto text-[#1ABA7F]" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HeroSection = ({ onSearchClick, onUploadClick }) => {
  const { t } = useTranslation();

return (
  <header className="relative bg-gradient-to-br from-[#225F91] via-[#1a4a73] to-[#0f2942] text-white overflow-hidden">
    {/* Sophisticated Background Pattern */}
    <div className="absolute inset-0">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1ABA7F]/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#76D1F3]/20 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>

    {/* 🌐 Language Toggle - Fixed at top right */}
    <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-10">
      <div className="scale-90 sm:scale-100">
        <LanguageToggle />
      </div>
    </div>


    {/* Main Content */}
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 sm:pb-24">
      {/* Premium Trust Badges */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-6 sm:mb-10">
        <div className="group relative px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="w-4 h-4 text-[#1ABA7F]" strokeWidth={2.5} />
            Trusted Platform
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#76D1F3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="text-center max-w-5xl mx-auto mb-10 sm:mb-14">
        <div className="inline-block mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#76D1F3] blur-2xl opacity-40 animate-pulse" />
          <h1 className="relative text-7xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
            Find Your
            <span className="block mt-2 bg-gradient-to-r from-[#1ABA7F] via-[#76D1F3] to-[#1ABA7F] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-flow">
              Medications
            </span>
          </h1>
        </div>
        
        <p className="text-lg sm:text-2xl text-gray-200 font-light leading-relaxed max-w-3xl mx-auto mb-4">
          Nigeria`s first medication discovery platform connecting patients with 
          <span className="text-[#1ABA7F] font-semibold"> trusted pharmacies nationwide</span>
        </p>
      </div>

      {/* Refined CTA Section */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={onSearchClick}
            className="group relative h-14 px-10 text-base font-bold rounded-xl bg-[#1ABA7F] hover:bg-[#16a876] text-white shadow-2xl hover:shadow-[#1ABA7F]/30 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Pill className="w-5 h-5" strokeWidth={2.5} />
              Find Medications
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
          
          <Button 
            onClick={onUploadClick}
            className="group relative h-14 px-10 text-base font-bold rounded-xl bg-white/15 backdrop-blur-md border-2 border-white/30 hover:bg-white/25 hover:border-white/40 text-white shadow-xl transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5" strokeWidth={2.5} />
              Upload Prescription
            </span>
          </Button>
        </div>

        {/* Quick Access Links */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm sm:text-base">
          <Link 
            href="/track-order" 
            className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200"
          >
            <MapIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" strokeWidth={2} />
            <span className="font-medium">Track Order</span>
          </Link>
          <div className="w-1 h-1 rounded-full bg-gray-500" />
          <Link 
            href="/check-prescription-status" 
            className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200"
          >
            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" strokeWidth={2} />
            <span className="font-medium">Prescription Status</span>
          </Link>
        </div>
      </div>
    </div>

    {/* Elegant Bottom Transition */}
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
  </header>
);

};

const StatsSection = () => {
  const stats = [
    { 
      icon: Pill, 
      value: '10,000+', 
      label: 'Medications',
      description: 'NAFDAC-approved medicines',
      gradient: 'from-[#1ABA7F] to-[#16a876]'
    },
    { 
      icon: Building2, 
      value: '500+', 
      label: 'Pharmacies',
      description: 'Target by end of 2025',
      gradient: 'from-[#225F91] to-[#1a4a73]'
    },
    { 
      icon: MapIcon, 
      value: '10 States', 
      label: 'Coverage',
      description: 'Expanding nationwide',
      gradient: 'from-[#76D1F3] to-[#5bc0de]'
    },
    { 
      icon: Globe, 
      value: '774 LGAs', 
      label: 'Vision',
      description: 'Complete national reach',
      gradient: 'from-[#FF6B6B] to-[#ee5a5a]'
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1ABA7F]/10 text-[#1ABA7F] font-bold text-sm mb-6">
            <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
            Our Impact
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#225F91] mb-4 sm:mb-6 tracking-tight">
            Transforming Healthcare Access
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Building the infrastructure that connects every Nigerian with the medications they need
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
          <div 
            key={i} 
            className="group relative bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 
                      hover:border-[#1ABA7F]/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
                      flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
              <stat.icon className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2} />
            </div>

            {/* Value */}
            <div className={`text-2xl sm:text-4xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent mb-1 sm:mb-2`}>
              {stat.value}
            </div>

            {/* Label */}
            <div className="text-sm sm:text-base font-bold text-gray-800 mb-0.5 sm:mb-1">
              {stat.label}
            </div>

            {/* Description */}
            <div className="text-[11px] sm:text-sm text-gray-500 font-medium leading-snug">
              {stat.description}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1ABA7F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          ))}
        </div>
      </div>
    </section>
  );
};



const FeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Verified & Secure',
      description: 'Every pharmacy is NAFDAC-registered and thoroughly verified for your complete safety and peace of mind',
      color: 'text-[#1ABA7F]',
      bg: 'bg-[#1ABA7F]/10'
    },
    {
      icon: Clock,
      title: 'Real-Time Inventory',
      description: 'Live stock updates ensure you never waste time searching for medications that aren`t available',
      color: 'text-[#225F91]',
      bg: 'bg-[#225F91]/10'
    },
    {
      icon: TrendingUp,
      title: 'Best Prices',
      description: 'Compare prices transparently across multiple pharmacies to always get the best value for your money',
      color: 'text-[#76D1F3]',
      bg: 'bg-[#76D1F3]/10'
    },
    {
      icon: Users,
      title: 'Trusted Platform',
      description: 'Join thousands of satisfied Nigerians who trust Manzu for their healthcare needs every day',
      color: 'text-[#FF6B6B]',
      bg: 'bg-[#FF6B6B]/10'
    }
  ];

  return (
    
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1ABA7F05_0%,transparent_50%),radial-gradient(circle_at_70%_80%,#225F9105_0%,transparent_50%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-6xl font-black text-[#225F91] mb-6 tracking-tight">
            Why Choose Manzu?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            We`ve reimagined how Nigerians access healthcare. Here`s what makes us different.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className="group relative bg-white rounded-3xl p-10 border-2 border-gray-100 hover:border-[#1ABA7F]/30 transition-all duration-300 hover:shadow-2xl"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-[#225F91] mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed font-light text-lg">{feature.description}</p>
              
              {/* Number badge */}
              <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-sm">
                {String(i + 1).padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MissionSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-[#225F91] via-[#1a4a73] to-[#0f2942] 
                        rounded-3xl p-6 sm:p-16 text-white overflow-hidden">
          
          {/* Background accents */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-[#1ABA7F]/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-[#76D1F3]/15 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] sm:bg-[size:32px_32px]" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                              bg-white/10 backdrop-blur-sm border border-white/20 mb-6 sm:mb-8">
                <Award className="w-4 h-4 text-[#1ABA7F]" strokeWidth={2.5} />
                <span className="text-xs sm:text-sm font-bold">Our Mission</span>
              </div>

              <h2 className="text-3xl sm:text-6xl font-black mb-6 sm:mb-8 leading-tight">
                Making Every Medication
                <span className="block mt-1 sm:mt-2">Findable & Accessible</span>
              </h2>

              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-[#1ABA7F] to-[#76D1F3] mb-6 sm:mb-8" />

              <p className="text-base sm:text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed font-light">
                We’re not just another pharmacy app. We’re building 
                <span className="font-bold text-white"> Nigeria’s medication discovery infrastructure</span> — 
                ensuring no patient ever goes without their needed medication.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {[
                { icon: '🎯', title: 'Patient-First', desc: 'Your health access is our priority' },
                { icon: '💎', title: 'Transparency', desc: 'Real prices, real availability' },
                { icon: '🚀', title: 'Innovation', desc: 'Technology solving real problems' },
              ].map((value, i) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center text-center relative 
                             bg-white/10 backdrop-blur-sm rounded-2xl 
                             p-6 sm:p-8 border border-white/20 
                             hover:bg-white/15 transition-all duration-300"
                >
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    {value.icon}
                  </div>
                  <div className="text-base sm:text-lg font-bold mb-2 sm:mb-3">{value.title}</div>
                  <div className="text-xs sm:text-sm text-gray-200 font-light leading-relaxed">
                    {value.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ServiceCard = ({ title, icon: Icon, children, description, isActive = false }) => {
  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-500 group">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/5 via-transparent to-[#225F91]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="relative z-10 p-2 sm:p-14">
        <div className='p-3'>
        <div className="flex items-start justify-between mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1ABA7F] to-[#16a876] text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-8 w-8" strokeWidth={2} />
          </div>
          {isActive && (
            <Badge className="bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-0 px-5 py-2 rounded-full text-sm font-bold shadow-lg">
              Most Popular
            </Badge>
          )}
        </div>

        <h3 className="text-4xl sm:text-5xl font-black text-[#225F91] mb-6 tracking-tight">
          {title}
        </h3>

        <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#1ABA7F] to-[#16a876] mb-8 group-hover:w-32 transition-all duration-300" />

        <p className="text-lg text-gray-600 mb-10 font-light leading-relaxed">
          {description}
        </p>
        </div>


        {children}
      </CardContent>
    </Card>
  );
};

const smoothScrollTo = (element, offset = 100) => {
  if (!element) return;
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: targetPosition, behavior: 'smooth' });
};

function HomePageContent() {
  const { t } = useTranslation();
  const [visibleSection, setVisibleSection] = useState(null);
  const searchRef = useRef(null);
  const uploadRef = useRef(null);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);



      useEffect(() => {
      const hasConsent = localStorage.getItem('manzu_consent');
      if (!hasConsent) {
        setIsConsentOpen(true);
      }
      
      const timer = setTimeout(() => setIsPageLoaded(true), 100);
      return () => clearTimeout(timer);
    }, []);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleConsentClose = useCallback((accepted = false) => {
    setIsConsentOpen(false);
    if (accepted) {
      localStorage.setItem('manzu_consent', 'true');
    }
  }, []);


  const handleSearchClick = useCallback(() => {
    setVisibleSection("search");
    setTimeout(() => {
      if (searchRef.current) {
        smoothScrollTo(searchRef.current, 120);
      }
    }, 100);
  }, []);

  const handleUploadClick = useCallback(() => {
    setVisibleSection("upload");
    setTimeout(() => {
      if (uploadRef.current) {
        smoothScrollTo(uploadRef.current, 120);
      }
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection onSearchClick={handleSearchClick} onUploadClick={handleUploadClick} />
      
      <StatsSection />
      
      <FeaturesSection />
      
      <MissionSection />

      {/* Service Sections */}
      {visibleSection && (
        <div className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-5xl mx-auto px-2 sm:px-6">
            {visibleSection === "search" && (
              <div ref={searchRef}>
                <ServiceCard
                  title="Find Your Medications"
                  icon={Pill}
                  isActive={true}
                  description="Search thousands of NAFDAC-approved medications and compare prices across verified pharmacies in real-time"
                >
                  {/* SearchBar component integration */}
                  <SearchBar />

                </ServiceCard>
              </div>
            )}

            {visibleSection === "upload" && (
              <div ref={uploadRef}>
                <ServiceCard
                  title="Upload Your Prescription"
                  icon={Zap}
                  description="Upload your prescription and we'll process it quickly with our verified pharmacy partners across Nigeria"
                >
                  {/* PrescriptionUploadForm component integration */}
                  <PrescriptionUploadForm />
                
                </ServiceCard>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1ABA7F05_0%,transparent_50%)]" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-6xl font-black text-[#225F91] mb-6 tracking-tight">
            Ready to Find Your Medications?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join thousands of Nigerians who trust Manzu for seamless, transparent healthcare access
          </p>
          <Button 
            onClick={handleSearchClick}
            className="group relative h-14 sm:h-16 px-8 sm:px-12 text-lg font-bold rounded-xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white shadow-2xl hover:shadow-[#1ABA7F]/30 transition-all duration-300"
          >
            <span className="flex items-center gap-3">
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
            </span>
          </Button>
        </div>
      </section>

      <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(0.95); }
        }
        
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 20s ease-in-out infinite;
        }
        
        .animate-gradient-flow {
          animation: gradient-flow 3s ease infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-float-delayed,
          .animate-gradient-flow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePageContent;