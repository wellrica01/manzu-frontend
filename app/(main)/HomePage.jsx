'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConsentModal from '@/components/ConsentModal';
import Link from 'next/link';
import { 
  Pill, ChevronDown, Zap, Shield, Clock, MapIcon, FileText, 
  Check, ArrowRight, TrendingUp, Star, Activity, Building2, Globe, 
  Sparkles, Target, Search, Upload, Package, Users, Award, ChevronRight,
  Play, Pause, Volume2, VolumeX, X, CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import SearchBar from '@/components/search/MedSearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';

// Advanced Counter with easing
const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (hasAnimated) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          const start = Date.now();
          const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Staggered reveal
const RevealOnScroll = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible 
          ? 'opacity-100 ' 
          : 'opacity-0 translate-y-12 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Live activity with smoother transitions
const LiveActivityTicker = () => {
  const activities = useMemo(() => [
    { name: 'Sarah O.', location: 'Lagos', medication: 'Paracetamol', time: '2 min ago' },
    { name: 'Ahmad K.', location: 'Kano', medication: 'Amoxicillin', time: '5 min ago' },
    { name: 'Chioma E.', location: 'Abuja', medication: 'Ibuprofen', time: '8 min ago' },
    { name: 'Ibrahim M.', location: 'Katsina', medication: 'Vitamin C', time: '12 min ago' },
    { name: 'Fateemah A.', location: 'Yobe', medication: 'Metformin', time: '15 min ago' },
    { name: 'Emeka C.', location: 'Enugu', medication: 'Ciprofloxacin', time: '18 min ago' },
  ], []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [activities.length]);

  const current = activities[currentIndex];

  return (
    <div className="flex items-center justify-center mt-12">
      <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg transition-all duration-300 ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
        <div className="relative">
          <Activity className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-sm animate-pulse" />
        </div>
        <span className="text-sm font-medium text-gray-700">
          <span className="font-bold text-gray-900">{current.name}</span> in {current.location} found{' '}
          <span className="font-bold text-[#225F91]">{current.medication}</span>
        </span>
        <span className="text-xs text-gray-500">{current.time}</span>
      </div>
    </div>
  );
};

// Enhanced Language Toggle
const LanguageToggle = ({ onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  
  const languages = useMemo(() => [
    { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬', native: 'Hausa' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬', native: 'Yorùbá' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬', native: 'Igbo' }
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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-5 py-1 sm:py-2.5 rounded-xl bg-white/95 hover:bg-white backdrop-blur-xl border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm shadow-sm hover:shadow-md transition-all"
        aria-label={`Current language: ${currentLang?.name}`}
      >
        <span className="text-lg">{currentLang?.flag}</span>
        <span className="hidden sm:inline">{currentLang?.native}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 min-w-[200px] z-50 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-all ${
                  selectedLang === lang.code ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{lang.native}</div>
                  <div className="text-xs text-gray-500">{lang.name}</div>
                </div>
                {selectedLang === lang.code && (
                  <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Reimagined Hero
const HeroSection = ({ onSearchClick, onUploadClick }) => {
  const { t } = useTranslation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
<header className="relative bg-gradient-to-br from-[#225F91] via-[#1a4a73] to-[#225F91] text-white overflow-hidden min-h-[85vh] flex items-center">
  {/* Advanced Background */}
  <div className="absolute inset-0">
    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, rgba(26,186,127,0.2) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(118,209,243,0.2) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(139,92,246,0.1) 0%, transparent 70%)
        `,
        transform: `translateY(${scrollY * 0.3}px)`
      }}
    />
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        transform: `translateY(${scrollY * 0.2}px)`
      }}
    />
  </div>

  {/* Floating Nav */}
  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2 sm:gap-3">
    <LanguageToggle />
    <Link
      href="/pharmacy-register"
      className="hidden md:flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 hover:border-white/30 font-semibold text-sm transition-all"
    >
      <Building2 className="w-4 h-4" strokeWidth={2} />
      For Pharmacies
    </Link>
  </div>

  {/* Hero Content */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 w-full">
    <div className="max-w-5xl mx-auto text-center">
      {/* Trust Badge */}
      <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 mb-8 sm:mb-10 group hover:bg-white/15 transition-all">
        <div className="relative">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" strokeWidth={2.5} />
          <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-md animate-pulse" />
        </div>
        <span className="text-xs sm:text-sm font-bold">Nigeria's Trusted Medication Platform</span>
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[1] tracking-tight mb-6 sm:mb-8">
        <span className="block">Find Your</span>
        <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Medications
        </span>
        <span className="block mt-2 sm:mt-3 text-white/90">Instantly</span>
      </h1>

      <p className="text-base sm:text-xl text-white/70 font-light leading-relaxed max-w-2xl sm:max-w-3xl mx-auto mb-10 sm:mb-12">
        Search <span className="font-semibold text-white">10,000+ medications</span> across verified pharmacies.
        <span className="block mt-1 sm:mt-2">Real-time availability. Transparent pricing. Secure ordering.</span>
      </p>

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 max-w-2xl mx-auto mb-8 sm:mb-10">
      <button
        onClick={onSearchClick}
        className="flex-1 group relative py-4 sm:py-5 px-4 sm:px-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg sm:shadow-xl hover:shadow-emerald-500/50 transition-all overflow-hidden flex items-center gap-3 justify-center"
      >
        <Search className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" strokeWidth={2} />
        <div className="flex flex-col text-left">
          <h3 className="text-lg sm:text-xl font-black">Search Medications</h3>
          <p className="text-xs sm:text-sm text-white/90 font-medium">Find any medication instantly</p>
        </div>
      </button>

      <button
        onClick={onUploadClick}
        className="flex-1 group relative py-4 sm:py-5 px-4 sm:px-6 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border-2 border-white/30 hover:border-white/50 text-white shadow-md sm:shadow-lg hover:shadow-2xl transition-all overflow-hidden flex items-center gap-3 justify-center"
      >
        <Upload className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" strokeWidth={2} />
        <div className="flex flex-col text-left">
          <h3 className="text-lg sm:text-xl font-black">Upload Prescription</h3>
          <p className="text-xs sm:text-sm text-white/90 font-medium">Get matched with pharmacies</p>
        </div>
      </button>
    </div>


      {/* Quick Links */}
      <div className="flex flex-grid justify-center items-center gap-3 sm:gap-4 max-w-md mx-auto">
        {[
          { icon: MapIcon, label: 'Track Order', href: '/track-order' },
          { icon: FileText, label: 'Prescription Status', href: '/check-prescription-status' },
        ].map((link, i) => (
          <Link
            key={i}
            href={link.href}
            className="group flex items-center gap-2 sm:gap-2.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white text-sm sm:text-base font-medium transition-all"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <LiveActivityTicker />
    </div>
  </div>

  {/* Decorative Gradient Footer */}
  <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-white to-transparent" />
</header>

  );
};

// Refined Stats with Better Visual Hierarchy
const StatsSection = () => {
  const stats = [
    { 
      icon: Pill, 
      value: 10000, 
      suffix: '+',
      label: 'NAFDAC-Approved Medications',
      description: 'Comprehensive database',
      gradient: 'from-emerald-500 to-teal-500'
    },
    { 
      icon: Building2, 
      value: 500, 
      suffix: '+',
      label: 'Verified Partner Pharmacies',
      description: 'Growing network',
      gradient: 'from-blue-500 to-indigo-500'
    },
    { 
      icon: Globe, 
      value: 774, 
      suffix: '',
      label: 'LGAs Coverage Goal',
      description: 'Nationwide expansion',
      gradient: 'from-cyan-500 to-blue-500'
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <RevealOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 sm:mb-6 bg-emerald-50 text-emerald-700 font-bold px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base">
              Platform Metrics
            </Badge>

            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 mb-3 sm:mb-4 leading-tight">
              Trusted by Thousands
            </h2>

            <p className="text-lg sm:text-xl text-gray-600 font-light max-w-2xl mx-auto px-2">
              Real numbers. Real impact.
            </p>
          </div>
        </RevealOnScroll>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <RevealOnScroll key={i} delay={i * 150}>
              <div className="group relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                {/* Hover gradient accent */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white mb-5 sm:mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <stat.icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
                </div>

                {/* Animated Counter */}
                <div
                  className={`text-5xl sm:text-6xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent mb-2 sm:mb-3`}
                >
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>

                {/* Labels */}
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  {stat.label}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {stat.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

// Premium Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Verified Pharmacies',
      description: 'Every pharmacy undergoes rigorous verification and compliance checks',
      gradient: 'from-emerald-500 to-teal-500',
      metrics: '100% Verified'
    },
    {
      icon: Activity,
      title: 'Real-Time Stock',
      description: 'Live inventory updates ensure you only see medications that are actually in stock',
      gradient: 'from-blue-500 to-indigo-500',
      metrics: 'Updated Every 5min'
    },
    {
      icon: TrendingUp,
      title: 'Price Transparency',
      description: 'Compare prices across multiple pharmacies and choose the best option for you',
      gradient: 'from-cyan-500 to-blue-500',
      metrics: 'Save Up to 40%'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Advanced search algorithms deliver results in under 1 second',
      gradient: 'from-purple-500 to-pink-500',
      metrics: '<1s Search'
    },
    {
      icon: MapIcon,
      title: 'Location-Based',
      description: 'Find pharmacies near you with accurate distance and delivery time estimates',
      gradient: 'from-orange-500 to-red-500',
      metrics: 'GPS Powered'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help with orders and inquiries',
      gradient: 'from-indigo-500 to-purple-500',
      metrics: 'Always Available'
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <RevealOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 sm:mb-6 bg-blue-50 text-blue-700 font-bold px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base">
              Platform Features
            </Badge>

            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 mb-3 sm:mb-4 leading-tight">
              Why Choose Manzu
            </h2>

            <p className="text-lg sm:text-xl text-gray-600 font-light max-w-2xl sm:max-w-3xl mx-auto px-2">
              Advanced technology meets healthcare accessibility
            </p>
          </div>
        </RevealOnScroll>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <RevealOnScroll key={i} delay={i * 100}>
              <div className="group relative p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-500 overflow-hidden">
                {/* Optional background accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl" />

                {/* Header Section: icon left, badge right */}
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <feature.icon className="w-7 h-7" strokeWidth={2} />
                  </div>
                  {feature.metrics && (
                    <Badge className="bg-gray-100 text-gray-700 font-semibold text-xs px-3 py-1">
                      {feature.metrics}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>

  );
};

// Sophisticated Testimonials
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Fatima Labaran',
      role: 'Patient',
      location: 'Kano',
      content: 'After spending hours visiting pharmacies, I found my medication in seconds with Manzu. This is exactly what Nigeria needs.',
      rating: 5,
      avatar: 'FL',
      verified: true,
    },
    {
      name: 'Dr. Mustapha Ibrahim',
      role: 'General Practitioner',
      location: 'Gombe',
      content: 'I recommend Manzu to all my patients. The platform makes medication access seamless and transparent. A game-changer for healthcare.',
      rating: 5,
      avatar: 'MI',
      verified: true,
    },
    {
      name: 'Chidinma Okonkwo',
      role: 'Chronic Patient',
      location: 'Abuja',
      content: 'Managing my condition is so much easier now. I always know which pharmacy has my medication in stock and at what price.',
      rating: 5,
      avatar: 'CO',
      verified: true,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <RevealOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 sm:mb-6 bg-amber-50 text-amber-700 font-bold px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base">
              <Star className="w-4 h-4 inline mr-1" strokeWidth={2.5} />
              Testimonials
            </Badge>
            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 mb-3 sm:mb-4">
              Loved by Patients
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-light">
              Real stories from real users
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, i) => (
            <RevealOnScroll key={i} delay={i * 150}>
              <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-500">
                {/* Stars */}
                <div className="flex gap-1 mb-4 sm:mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400"
                      strokeWidth={2}
                    />
                  ))}
                </div>

                {/* Testimonial Content */}
                <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-base sm:text-lg">
                  “{testimonial.content}”
                </p>

                {/* Footer */}
                <div className="flex items-center gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold text-xs sm:text-sm">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">{testimonial.name}</h4>
                      {testimonial.verified && (
                        <CheckCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-500" strokeWidth={2.5} />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

// Enhanced Service Card (Responsive)
const ServiceCard = ({ title, icon: Icon, children, description }) => {
  return (
    <Card className="relative rounded-3xl sm:rounded-4xl border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-500">
      {/* Subtle decorative gradient glow */}
      <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      
      <CardContent className="relative px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg">
            <Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
          </div>

          <Badge className="bg-emerald-50 text-emerald-700 font-bold text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-1.5">
            Active
          </Badge>
        </div>
        
        <h3 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 sm:mb-4 leading-snug">
          {title}
        </h3>

        <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed">
          {description}
        </p>

        <div className="w-full">
          {children}
        </div>
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
  const searchParams = useSearchParams();

  useEffect(() => {
    const hasConsent = localStorage.getItem('manzu_consent');
    if (!hasConsent) {
      setIsConsentOpen(true);
    }
    
    const urlSearchTerm = searchParams.get('q');
    const urlMedicationId = searchParams.get('medId');
    const urlState = searchParams.get('state');
    const urlLga = searchParams.get('lga');
    
    if (urlSearchTerm || urlMedicationId || urlState || urlLga) {
      setVisibleSection('search');
      setTimeout(() => {
        if (searchRef.current) {
          smoothScrollTo(searchRef.current, 120);
        }
      }, 300);
    }
  }, [searchParams]);

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
      
      <TestimonialsSection />

    {/* Service Section - Enhanced & Responsive */}
    {visibleSection && (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-5xl mx-auto px-2 sm:px-6">
          {visibleSection === "search" && (
            <RevealOnScroll>
              <div ref={searchRef}>
                <ServiceCard
                  title="Search Medications"
                  icon={Search}
                  description="Find any medication across our network of verified pharmacies. Real-time availability, transparent pricing, instant results."
                >
                  <SearchBar />
                </ServiceCard>
              </div>
            </RevealOnScroll>
          )}

          {visibleSection === "upload" && (
            <RevealOnScroll>
              <div ref={uploadRef}>
                <ServiceCard
                  title="Upload Prescription"
                  icon={Upload}
                  description="Upload your prescription and we'll match you with pharmacies that have all your medications in stock. Fast, secure, and NAFDAC compliant."
                >
                  <PrescriptionUploadForm />
                </ServiceCard>
              </div>
            </RevealOnScroll>
          )}
        </div>
      </section>
    )}

    {/* Trust Section - Responsive */}
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <RevealOnScroll>
          <div className="relative p-8 sm:p-16 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-[#225F91] to-[#1a4a73] text-white">
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Content Grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 items-center">
              {/* Left Column */}
              <div>
                <Badge className="mb-4 sm:mb-6 bg-white/20 text-white font-bold px-4 py-2 backdrop-blur-sm text-sm sm:text-base">
                  Our Commitment
                </Badge>

                <h2 className="text-3xl sm:text-5xl font-black mb-4 sm:mb-6 leading-tight">
                  Your Health,
                  <span className="block mt-1 sm:mt-2 text-emerald-400">Our Priority</span>
                </h2>

                <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-8 leading-relaxed">
                  We're not just a platform—we're your healthcare partner. Every pharmacy is verified, every medication is authentic, and every transaction is secure.
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: Shield, text: '100% PCN-verified pharmacies' },
                    { icon: CheckCircle, text: 'Secure payment processing' },
                    { icon: Award, text: 'Quality guarantee on all medications' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                      </div>
                      <span className="text-base sm:text-lg font-semibold">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Metrics */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { value: '99.9', suffix: '%', label: 'Uptime' },
                  { value: '4.8', suffix: '/5', label: 'User Rating' },
                  { value: '24', suffix: '/7', label: 'Support' },
                  { value: '5', suffix: 'min', label: 'Avg. Response' },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-center sm:text-left"
                  >
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1 sm:mb-2">
                      <AnimatedCounter end={parseFloat(metric.value)} suffix={metric.suffix} />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white/80">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>

    {/* How It Works - Process Section */}
    <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <RevealOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 sm:mb-6 bg-purple-50 text-purple-700 font-bold px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base">
              Simple Process
            </Badge>
            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 mb-3 sm:mb-4">
              How Manzu Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-light">
              Three simple steps to get your medications
            </p>
          </div>
        </RevealOnScroll>

        <div className="relative">
          {/* Connection Line (only desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 -translate-y-1/2 opacity-20" />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Search or Upload',
                description:
                  'Type your medication name or upload a prescription. Our AI-powered system searches across all pharmacies instantly.',
                icon: Search,
                gradient: 'from-emerald-500 to-teal-500',
                features: ['10,000+ Medications', 'ATC Classification', 'Smart Suggestions'],
              },
              {
                step: '02',
                title: 'Compare & Choose',
                description:
                  'View real-time availability, prices, and pharmacy ratings. Select the best option for your needs.',
                icon: TrendingUp,
                gradient: 'from-blue-500 to-indigo-500',
                features: ['Price Comparison', 'Live Stock', 'Verified Reviews'],
              },
              {
                step: '03',
                title: 'Order & Track',
                description:
                  'Secure checkout with multiple payment options. Track your order in real-time or schedule pickup.',
                icon: Package,
                gradient: 'from-purple-500 to-pink-500',
                features: ['Secure Payment', 'GPS Tracking', 'Flexible Delivery'],
              },
            ].map((step, i) => (
              <RevealOnScroll key={i} delay={i * 200}>
                <div className="relative group h-full">
                  <div className="relative p-8 sm:p-10 rounded-3xl bg-white border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-2xl transition-all duration-500">
                    {/* Step Badge */}
                    <div className="absolute -top-5 sm:-top-6 left-6 sm:left-8">
                      <div
                        className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${step.gradient} text-white shadow-lg text-lg sm:text-xl font-black`}
                      >
                        {step.step}
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.gradient} text-white mb-5 sm:mb-6 mt-6 sm:mt-8 group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <step.icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-4">
                      {step.title}
                    </h3>

                    <p className="text-gray-600 leading-relaxed mb-5 sm:mb-6 text-base sm:text-lg">
                      {step.description}
                    </p>

                    <div className="space-y-2 pt-5 sm:pt-6 border-t border-gray-200">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" strokeWidth={2} />
                          <span className="text-sm sm:text-base font-semibold">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Final CTA */}
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <RevealOnScroll>
          <div className="relative p-8 sm:p-16 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden text-center">
            {/* Gradient overlay */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_70%),radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
            </div>

            <div className="relative">
              {/* Badge */}
              <Badge className="mb-6 sm:mb-8 bg-white/20 text-white font-bold px-4 sm:px-5 py-2 backdrop-blur-sm text-sm sm:text-base">
                <Sparkles className="w-4 h-4 inline mr-2" strokeWidth={2} />
                Start Your Journey
              </Badge>

              {/* Heading */}
              <h2 className="text-5xl sm:text-6xl font-black mb-4 sm:mb-6 leading-tight">
                Ready to Find Your
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Medications?
                </span>
              </h2>

              {/* Description */}
              <p className="text-lg sm:text-2xl text-white/70 mb-8 sm:mb-12 max-w-3xl mx-auto font-light leading-relaxed px-2">
                Join thousands of Nigerians who trust Manzu for fast, reliable medication access.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-2">
                <Button
                  onClick={handleSearchClick}
                  className="group h-14 sm:h-16 w-full sm:w-auto px-8 sm:px-12 text-base sm:text-lg font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-xl hover:shadow-emerald-500/50 transition-all"
                >
                  <span className="flex items-center justify-center gap-3">
                    Start Searching
                    <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </span>
                </Button>

                <Button
                  onClick={handleUploadClick}
                  className="h-14 sm:h-16 w-full sm:w-auto px-8 sm:px-12 text-base sm:text-lg font-semibold rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 text-white transition-all"
                >
                  <Upload className="w-5 h-5 mr-2" strokeWidth={2} />
                  Upload Prescription
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 sm:mt-12 flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/50 px-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" strokeWidth={2} />
                  <span className="font-medium">Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" strokeWidth={2} />
                  <span className="font-medium">No registration required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" strokeWidth={2} />
                  <span className="font-medium">Instant results</span>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>


      <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePageContent;