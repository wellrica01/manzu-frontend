import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

const HeroSection = ({ prescriptionMetadata, medications }) => {
  const contactInfo = prescriptionMetadata?.email || prescriptionMetadata?.phone;

  return (
    <div className="text-center mb-12 pt-8">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 mb-6">
        <CheckCircle className="h-5 w-5" strokeWidth={2} />
        <span className="text-sm font-bold">PRESCRIPTION READY</span>
      </div>

      <div className="space-y-4 mb-6">
        {contactInfo && (
          <h2 className="text-2xl font-bold text-gray-700">
            Hi {contactInfo},
          </h2>
        )}
        <h1 className="text-5xl font-black text-[#225F91]">
          Your Prescription is Ready!
        </h1>
      </div>

      <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-[#1ABA7F] to-[#225F91] mb-6" />

      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Your prescription is <span className="font-bold text-[#1ABA7F]">verified</span> and ready. 
        Review the <span className="font-bold text-[#1ABA7F]">{medications?.length || 0}</span> prescribed 
        medication{medications?.length !== 1 ? 's' : ''} below and order with{' '}
        <span className="font-bold text-[#225F91]">fast delivery</span>.
      </p>
    </div>
  );
};

export default HeroSection;
