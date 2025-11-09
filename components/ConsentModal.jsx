'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getGuestId } from '@/lib/utils';
import { Shield, Lock, CheckCircle, Loader2, AlertCircle, Info } from 'lucide-react';

export default function ConsentModal({ isOpen, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getGuestId();
  }, []);

  const handleConsent = async () => {
    const guestId = getGuestId();

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
          userIdentifier: guestId,
          consentType: 'DATA_SHARING',
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

  const handleInteractOutside = (event) => {
    event.preventDefault();
  };

  return (
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent
    className="sm:max-w-lg w-full max-h-[80vh] p-3 sm:p-6 border-2 border-[#1ABA7F]/30 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 fade-in duration-500 overflow-auto"
    aria-describedby="privacy-description"
    onInteractOutside={(e) => e.preventDefault()}
  >
    {/* Decorative Background Elements */}
    <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />
    <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-tr from-[#225F91]/20 to-transparent rounded-tr-full" />

    {/* Header Section */}
    <div className="relative bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 p-4 sm:p-8 pb-4 sm:pb-6">
      <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/30 to-[#225F91]/30 rounded-full blur-xl animate-pulse" />
        <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-full flex items-center justify-center shadow-md sm:shadow-lg border-3 border-white">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" strokeWidth={2.5} />
        </div>
      </div>

      <DialogHeader>
        <DialogTitle className="text-xl sm:text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
          Your Privacy Matters
        </DialogTitle>
      </DialogHeader>
    </div>

    {/* Content Section */}
    <div className="relative z-10 p-3 sm:p-4 pt-2 space-y-5 sm:space-y-6">
      {/* Main Description */}
      <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50">
        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Data Collection Notice</h3>
        </div>
        <p id="privacy-description" className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          Manzu collects your email, phone, location, and prescription data to process orders,
          in compliance with Nigeria's Data Protection Regulation (NDPR). Your information is 
          secured and only used for order fulfillment and service improvement.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 rounded-xl border-2 border-red-200/50 animate-in slide-in-from-top duration-300">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-semibold text-red-800 mb-1">Consent Error</p>
            <p className="text-xs text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={handleConsent}
          disabled={isSubmitting}
          className="flex-1 h-10 sm:h-12 p-2 sm:p-3 text-xs sm:text-sm font-bold rounded-lg bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                I Consent
              </>
            )}
          </span>
          {!isSubmitting && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          )}
        </Button>

        <Button
          asChild
          variant="outline"
          className="flex-1 h-10 sm:h-12 p-2 sm:p-3 text-xs sm:text-sm font-bold rounded-xl border-2 border-[#225F91] text-[#225F91] hover:bg-[#225F91]/10 transition-all duration-300"
        >
          <Link href="/privacy-policy" className="flex items-center justify-center gap-1 sm:gap-2">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Learn More
          </Link>
        </Button>
      </div>

      {/* Footer Note */}
      <div className="pt-1 sm:pt-2 border-t border-gray-200">
        <p className="text-[10px] sm:text-xs text-center text-gray-500">
          By consenting, you agree to our data handling practices. You can withdraw consent anytime.
        </p>
      </div>
    </div>
  </DialogContent>
</Dialog>

  );
}