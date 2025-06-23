'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getGuestId } from '@/lib/utils';

export default function ConsentModal({ isOpen, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getGuestId(); // This will ensure guestId exists
  }, []);

  const handleConsent = async () => {
    const guestId = getGuestId();

    // If consent already granted, just close
    if (localStorage.getItem('manzu_consent') === 'granted') {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientIdentifier: guestId,
          consentType: 'data_collection',
          granted: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record consent');
      }

      localStorage.setItem('manzu_consent', 'granted');
      onClose();
    } catch (error) {
      console.error('Consent error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8 border border-[#1ABA7F]/20 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl animate-in slide-in-from-top duration-500" aria-describedby="privacy-description">
        <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#225F91]">
            Data Privacy Consent
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p id="privacy-description" className="text-sm text-gray-600">
            Manzu collects your email, phone, location, and prescription data to process orders,
            in compliance with Nigeria’s Data Protection Regulation (NDPR). Do you consent to this?
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-[#225F91] mt-2 font-medium">{errorMessage}</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            asChild
            variant="outline"
            className="h-10 px-4 text-sm font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
            aria-label="Learn more about privacy policy"
          >
            <Link href="/privacy-policy">Learn More</Link>
          </Button>
          <Button
            onClick={handleConsent}
            disabled={isSubmitting}
            className="h-10 px-4 text-sm font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Consent to data collection"
          >
            {isSubmitting ? 'Submitting...' : 'I Consent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}