import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

/**
 * LoadingState Component
 * Displays animated loading screen while prescription data is being fetched
 */
export const LoadingState = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 relative p-1 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-8">
        {/* Animated spinner */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-xl opacity-50 animate-pulse" />
          <div 
            className="relative animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-[#1ABA7F] to-[#225F91] bg-clip-padding" 
            style={{
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '4px'
            }}
          >
            <div className="absolute inset-0 rounded-full border-t-4 border-[#1ABA7F] animate-pulse" />
          </div>
          <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-[#225F91]" aria-hidden="true" />
        </div>

        {/* Loading text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
            Loading Prescription
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4" aria-label="Loading">
            <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[#225F91] rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce delay-200" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-700 { animation-delay: 700ms; }
      `}</style>
    </div>
  );
};

// Default exports for easier importing
export default LoadingState;