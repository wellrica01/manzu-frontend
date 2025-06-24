'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TestSearchBar from '@/components/test/search/TestSearchBar';
import TestOrderUploadForm from '@/components/test/TestOrderUploadForm';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-6xl">
        <header className="text-center justify-center mb-16 sm:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight animate-in slide-in-from-top duration-700">
            Test Services with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1ABA7F] to-[#225F91]">
              Manzu
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700 delay-200">
            Book lab tests or imaging services from trusted labs with transparent pricing and home collection options.
          </p>
          <Button
            asChild
            className="mt-6 h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-lg transition-all duration-300"
          >
            <Link href="/track-test">Track Your Test</Link>
          </Button>
        </header>
        <div className="flex flex-col gap-8">
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading search...</p>}>
            <Card className="shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
              <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                  Search Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <TestSearchBar />
              </CardContent>
            </Card>
          </Suspense>
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading upload form...</p>}>
            <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
              <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                  Upload Test Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <TestOrderUploadForm />
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
                  <Link href="/packages">View Packages</Link>
                </Button>
              </CardContent>
            </Card>
          </Suspense>
          <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
            <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
            <CardHeader className="p-6 sm:p-8">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight">
                For Labs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <p className="text-base sm:text-lg text-gray-600 font-medium mb-6 max-w-2xl">
                Join Manzu to offer your diagnostic services, connect with patients, and streamline bookings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 px-6 text-base font-semibold rounded-full border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
                >
                  <Link href="/test/lab/register" target="_blank" rel="noopener noreferrer">
                    Register Lab
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-12 px-6 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.5)] animate-pulse transition-all duration-300"
                >
                  <Link href="/test/lab/login" target="_blank" rel="noopener noreferrer">
                    Lab Login
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