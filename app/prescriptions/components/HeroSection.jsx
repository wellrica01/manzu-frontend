import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const HeroSection = ({ userName, prescriptionMetadata, medications }) => {
const availableMeds = medications.filter(med => med.availability?.length > 0).length;

  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-2 animate-in slide-in-from-top-2 duration-500">
        {userName ? `Hi ${userName}, ` : ''}
        {prescriptionMetadata?.status === 'VERIFIED' ? 'Your Prescription is Ready!' : 'Your Prescription is Under Review'}
      </h1>
      <p className="text-gray-600 mt-4 text-base sm:text-lg max-w-2xl mx-auto animate-in fade-in-20 duration-700">
        {prescriptionMetadata?.status === 'VERIFIED'
          ? `Review ${medications.length} prescribed medications below and order with fast delivery.`
          : `Your ${medications.length} medications are being reviewed. We'll notify you soon.`}
      </p>
    </div>
  );
};

export default HeroSection;