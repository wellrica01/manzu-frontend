'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Suspense, useState, useEffect } from 'react';
import ConsentModal from '@/components/ConsentModal';

export default function HomePage() {
  const router = useRouter();
  const [isConsentOpen, setIsConsentOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('manzu_consent')) {
      setIsConsentOpen(true);
    }
  }, []);

  const handleConsentClose = () => {
    setIsConsentOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <header className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight animate-in slide-in-from-top-10 duration-700">
            Welcome to{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse">
              Manzu
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 font-medium max-w-3xl mx-auto animate-in slide-in-from-top-10 delay-200 duration-700">
            Your trusted platform for medications and diagnostic tests across Nigeria’s 774 LGAs.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading...</p>}>
            <Card className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]">
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  Med Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <p className="text-base sm:text-lg text-gray-600 font-medium mb-6">
                  Find and order safe, authentic medications from verified pharmacies.
                </p>
                <Button
                  onClick={() => router.push('/med')}
                  className="w-full h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
                >
                  Find Medications
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]">
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  Test Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <p className="text-base sm:text-lg text-gray-600 font-medium mb-6">
                  Book lab tests and imaging services from trusted labs with transparent pricing.
                </p>
                <Button
                  onClick={() => router.push('/test')}
                  className="w-full h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
                >
                  Book Tests
                </Button>
              </CardContent>
            </Card>
          </Suspense>
        </div>
        <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
      </div>
    </div>
  );
}