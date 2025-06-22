'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TestSearchBar from '@/components/test/search/TestSearchBar';
import TestOrderUploadForm from '@/components/test/TestOrderUploadForm';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <header className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight animate-in slide-in-from-top-10 duration-700">
            Test Services with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-pulse">
              Manzu
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 font-medium max-w-3xl mx-auto animate-in slide-in-from-top-10 delay-200 duration-700">
            Book lab tests or imaging services from trusted labs with transparent pricing.
          </p>
        </header>
        <div className="flex flex-col gap-8">
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading search...</p>}>
            <Card className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]">
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  Search Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <TestSearchBar />
              </CardContent>
            </Card>
          </Suspense>
          <Suspense fallback={<p className="text-center text-gray-600 text-lg">Loading upload form...</p>}>
            <Card className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]">
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  Upload Test Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <TestOrderUploadForm />
              </CardContent>
            </Card>
          </Suspense>
          <Card className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <CardHeader className="p-6 sm:p-8">
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
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
                  className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                >
                  <Link href="/test/lab/register" target="_blank" rel="noopener noreferrer">
                    Register Lab
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
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