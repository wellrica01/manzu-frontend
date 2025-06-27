/*'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SearchBar from '@/components/med/search/MedSearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';

export default function MedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-6xl">
        <header className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight animate-in slide-in-from-top-10 duration-700">
            Medication Services with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1ABA7F] to-[#225F91]">
              Manzu
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 font-medium max-w-3xl mx-auto animate-in slide-in-from-top-10 delay-200 duration-700">
            Find the best prices and nearest pharmacies or upload your prescription effortlessly.
          </p>
        </header>
        <div className="flex flex-col gap-8">
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading search...</p>}>
            <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
              <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                  Search Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <SearchBar />
              </CardContent>
            </Card>
          </Suspense>
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading upload form...</p>}>
            <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
              <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
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
          <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
            <CardHeader className="p-6 sm:p-8">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                For Pharmacies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <p className="text-base sm:text-lg text-gray-600 font-medium mb-6 max-w-2xl">
                Join Manzu to showcase your inventory, connect with customers, and grow your business seamlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
                >
                  <Link href="/med/pharmacy/register" target="_blank" rel="noopener noreferrer">
                    Register Pharmacy
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] transition-all duration-300"
                >
                  <Link href="/med/pharmacy/login" target="_blank" rel="noopener noreferrer">
                    Pharmacy Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
*/