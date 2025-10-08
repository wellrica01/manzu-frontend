'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Hooks
import { useStatusCheck } from '@/hooks/useStatusCheck';
import { useGuestId } from '@/hooks/useGuestId';

// Components
import StatusCheckForm from './StatusCheckForm';
import StatusLoading from './StatusLoading';
import StatusSuccess from './StatusSuccess';
import StatusUnderReview from './StatusUnderReview';
import StatusNoMedications from './StatusNoMedications';
import StatusError from './StatusError';

export default function StatusCheck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = useGuestId();
  
  const [identifier, setIdentifier] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Status check mutation
  const {
    mutate: checkStatus,
    data: prescription,
    isPending,
    isError,
    error,
    reset
  } = useStatusCheck(guestId);

  // Auto-check if userIdentifier is in URL
  useEffect(() => {
    const userIdentifier = searchParams.get('userIdentifier');
    if (userIdentifier && guestId) {
      checkStatus({ identifier: userIdentifier, isDirectFetch: true });
    }
  }, [searchParams, guestId, checkStatus]);

  const handleSubmit = (formData) => {
    setIdentifier(formData.identifier);
    checkStatus({ identifier: formData.identifier, isDirectFetch: false });
  };

  const handleReset = () => {
    reset();
    setIdentifier('');
    setShouldFetch(false);
  };

  const handleBackToHome = () => router.push('/');

  // Handle redirect after success animation
  const handleRedirect = useCallback(() => {
    if (prescription?.redirectUrl) {
      // Add a fade-out effect to the entire page
      document.body.style.transition = 'opacity 0.5s ease-out';
      document.body.style.opacity = '0';
      
      setTimeout(() => {
        window.location.href = prescription.redirectUrl;
      }, 500);
    }
  }, [prescription?.redirectUrl]);

  // Determine current status
  const getStatus = () => {
    if (isPending) return 'loading';
    if (isError) return 'error';
    if (prescription) {
      if (prescription.shouldRedirect) {
        return 'success';
      }
      if (['PENDING', 'PENDING_ADMIN', 'PENDING_ACTION'].includes(prescription.status)) {
        return 'under_review';
      }
      return 'no_medications';
    }
    return 'idle';
  };

  const status = getStatus();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden transition-opacity duration-500">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 flex-1 py-12 px-4">
        {/* Header - Only show on idle */}
        {status === 'idle' && (
          <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-top duration-700">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
              Check Prescription Status
            </h1>
            <p className="text-base text-gray-600 font-medium max-w-2xl mx-auto">
              Enter your email or phone number to view your prescription status and order details
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Loading State */}
          {status === 'loading' && <StatusLoading />}

          {/* Success State - NEW */}
          {status === 'success' && (
            <StatusSuccess
              prescription={prescription}
              guestId={prescription?.guestId || identifier}
              onRedirect={handleRedirect}
            />
          )}

          {/* Idle State - Form */}
          {status === 'idle' && (
            <StatusCheckForm
              onSubmit={handleSubmit}
              onBackToHome={handleBackToHome}
              isLoading={isPending}
            />
          )}

          {/* Under Review State */}
          {status === 'under_review' && (
            <StatusUnderReview
              prescription={prescription}
              onReset={handleReset}
              onBackToHome={handleBackToHome}
            />
          )}

          {/* No Medications State */}
          {status === 'no_medications' && (
            <StatusNoMedications
              prescription={prescription}
              onReset={handleReset}
              onBackToHome={handleBackToHome}
            />
          )}

          {/* Error State */}
          {status === 'error' && (
            <StatusError
              error={error?.message || 'An error occurred'}
              onReset={handleReset}
              onBackToHome={handleBackToHome}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white py-6 px-4 mt-12">
        <div className="text-center">
          <p className="text-sm opacity-90">&copy; {new Date().getFullYear()} Manzu. Powered by WellRica.</p>
        </div>
      </footer>
    </div>
  );
}