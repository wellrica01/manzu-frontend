import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

const HeroSection = ({ prescriptionMetadata, medications }) => {

  const contactInfo = prescriptionMetadata?.email || prescriptionMetadata?.phone;

  return (
    <div className="relative mb-8 pt-12 pb-8 text-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#1ABA7F]/8 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#225F91]/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-5 px-4">
        {/* Status Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-xl bg-green-100 border-2 border-green-300 text-green-800 shadow-lg">
            <CheckCircle className="h-5 w-5" strokeWidth={2.5} />
            <span className="text-xs sm:text-sm font-black tracking-wide">PRESCRIPTION READY</span>
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>

        {/* Main Title */}
        <div className="space-y-2">
          {contactInfo && (
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-700">
              Hi {contactInfo},
            </h2>
          )}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] tracking-tight leading-tight">
            Your Prescription is Ready!
          </h1>
        </div>

        {/* Decorative line */}
        <div className="flex justify-center py-2">
          <div className="h-1 w-24 sm:w-32 rounded-full bg-gradient-to-r from-[#1ABA7F] via-[#225F91] to-[#1ABA7F]" />
        </div>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
          Your prescription is <span className="text-[#1ABA7F] font-bold">verified</span> and ready. 
          Review the <span className="text-[#1ABA7F] font-bold">{medications?.length || 0}</span> prescribed 
          medication{medications?.length !== 1 ? 's' : ''} below and order with{' '}
          <span className="text-[#225F91] font-bold">fast delivery</span>.
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
