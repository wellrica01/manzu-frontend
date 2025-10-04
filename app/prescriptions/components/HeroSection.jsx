import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

const HeroSection = ({ userName, prescriptionMetadata, medications }) => {
  const availableMeds = medications.filter(med => med.availability?.length > 0).length;

  return (
    <div className="relative mb-10 pt-16 pb-12 text-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-top duration-700">
        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl backdrop-blur-xl text-xs sm:text-base font-black shadow-2xl border-2 bg-green-100/80 border-green-300 text-green-800">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-lg animate-pulse bg-green-500" />
              <CheckCircle className="relative h-6 w-6" strokeWidth={3} />
            </div>
            <span className="tracking-wide">PRESCRIPTION READY</span>
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] tracking-tight leading-tight px-4">
          {userName && (
            <span className="block text-3xl sm:text-4xl mb-3 text-gray-700 font-bold">
              Hi {userName},
            </span>
          )}
          <span className="block">Your Prescription is Ready!</span>
        </h1>

        {/* Decorative line */}
        <div className="flex justify-center">
          <div className="h-1 sm:h-2 w-32 sm:w-40 rounded-full bg-gradient-to-r from-[#1ABA7F] via-green-400 to-[#1ABA7F] shadow-lg animate-gradient bg-300%" />
        </div>

        {/* Subtitle */}
        <p className="text-base sm:text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-bold px-4">
          Your prescription is <span className="text-[#1ABA7F] font-black">verified </span> 
          and ready. Review <span className="text-[#1ABA7F] font-black">{medications.length} </span> 
          prescribed medications below and order with{' '}
          <span className="text-[#225F91] font-black">fast delivery</span>.
        </p>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .bg-300\% {
          background-size: 300% 300%;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
