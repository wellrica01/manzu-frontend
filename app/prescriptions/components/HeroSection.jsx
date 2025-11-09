import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

const HeroSection = ({ prescriptionMetadata, medications }) => {
  const contactInfo = prescriptionMetadata?.email || prescriptionMetadata?.phone;
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center mb-12 sm:mb-16 pt-10 sm:pt-12 relative overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-56 sm:w-80 md:w-96 h-56 sm:h-80 md:h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '3s' }}
        />
        <div
          className="absolute top-0 right-1/4 w-56 sm:w-80 md:w-96 h-56 sm:h-80 md:h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s', animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10 px-4 sm:px-0">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 mb-6 sm:mb-8 animate-in zoom-in-95 duration-500">
          <div className="relative">
            <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" strokeWidth={2.5} />
            {isAnimating && (
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md animate-ping" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wider">
            Prescription Ready
          </span>
          <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-amber-500 animate-pulse" strokeWidth={2.5} />
        </div>

        {/* Greeting + Title */}
        <div
          className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: '200ms' }}
        >
          {contactInfo && (
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-700">
              Hi <span className="text-emerald-600">{contactInfo}</span>,
            </h2>
          )}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-gradient-to-r from-[#225F91] via-emerald-600 to-cyan-600 bg-clip-text leading-tight px-2 sm:px-0">
            Your Prescription
            <span className="block mt-1 sm:mt-2">is Ready!</span>
          </h1>
        </div>

        {/* Gradient Separator */}
        <div
          className="relative w-24 sm:w-32 h-1.5 sm:h-2 mx-auto mb-6 sm:mb-8 animate-in zoom-in-50 duration-700"
          style={{ animationDelay: '400ms' }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 blur-sm opacity-50" />
        </div>

        {/* Description */}
        <p
          className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed animate-in fade-in duration-700 px-2"
          style={{ animationDelay: '600ms' }}
        >
          Your prescription is{' '}
          <span className="font-black text-emerald-600">verified</span> and ready.
          Review the{' '}
          <span className="font-black text-cyan-600">{medications?.length || 0}</span> prescribed
          medication{medications?.length !== 1 ? 's' : ''} below and order with{' '}
          <span className="font-black text-[#225F91]">fast delivery</span>.
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
