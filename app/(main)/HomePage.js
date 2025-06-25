'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Suspense, useState, useEffect } from 'react';
import ConsentModal from '@/components/ConsentModal';
import { Pill, TestTube2 } from 'lucide-react';
import Link from 'next/link';
import ServiceSearchBar from '@/components/search/ServiceSearchBar'; // Assumed unified search bar
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm'; // Unified upload form

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
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section */}
        <header className="text-center mb-16 sm:mb-20 relative z-10">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-[#1ABA7F]/20 text-[#1ABA7F] text-sm font-semibold animate-in zoom-in-50 duration-500">
            Trusted Healthcare Platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight animate-in slide-in-from-top duration-700">
            Discover Healthcare with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1ABA7F] to-[#225F91]">
              Manzu
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700 delay-200">
            Access authentic medications and diagnostic services across Nigeria’s 774 LGAs with ease.
          </p>
          <div className="mt-8 flex justify-center gap-4 animate-in zoom-in-50 duration-700 delay-400">
            <Button
              onClick={() => router.push('/services')}
              className="h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-lg transition-all duration-300"
            >
              Explore Services
            </Button>
            <Button
              onClick={() => router.push('/track-order')}
              className="h-12 px-8 text-base font-semibold rounded-full bg-transparent border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-lg transition-all duration-300"
            >
              Track Order
            </Button>
          </div>
        </header>

        {/* Services Section */}
        <div className="flex flex-col gap-8 relative z-10">
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading search...</p>}>
            <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
              <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                  Search Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <ServiceSearchBar />
              </CardContent>
            </Card>
          </Suspense>
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading upload form...</p>}>
            <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
              <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                  Upload Prescription
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <PrescriptionUploadForm />
              </CardContent>
            </Card>
          </Suspense>
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading packages...</p>}>
            <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
              <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                  Health Packages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <p className="text-base sm:text-lg text-gray-600 font-medium mb-6 max-w-2xl">
                  Explore comprehensive health checkup packages tailored to your wellness needs.
                </p>
                <Button
                  asChild
                  className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300"
                >
                  <Link href="/services?type=diagnostic_package">View Packages</Link>
                </Button>
              </CardContent>
            </Card>
          </Suspense>
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <CardHeader className="p-6 sm:p-8">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                For Providers
              </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <p className="text-base sm:text-lg text-gray-600 font-medium mb-6 max-w-2xl">
                  Join Manzu to offer your services, connect with patients, and streamline operations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
                  >
                    <Link href="/provider/register" target="_blank" rel="noopener noreferrer">
                      Register Provider
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] animate-pulse transition-all duration-300"
                  >
                    <Link href="/provider/login" target="_blank" rel="noopener noreferrer">
                      Provider Login
                    </Link>
                  </Button>
                </div>
              </CardContent>
          </Card>
        </div>
        <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
      </div>
    </div>
  );
}