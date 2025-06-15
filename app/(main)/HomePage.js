// app/(main)/HomePage.js
'use client';

import { Suspense, useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';
import ConsentModal from '@/components/ConsentModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Hero Section */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
            Discover Medications with <span className="text-secondary">Manzu</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Find medications nearby or upload your prescription effortlessly.
          </p>
        </header>

        {/* Main Content */}
        <div className="flex flex-col gap-6">
          <Suspense fallback={<p>Loading search...</p>}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-primary">Search Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <SearchBar />
              </CardContent>
            </Card>
          </Suspense>

          <Suspense fallback={<p>Loading upload form...</p>}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-primary">Upload Prescription</CardTitle>
              </CardHeader>
              <CardContent>
                <PrescriptionUploadForm />
              </CardContent>
            </Card>
          </Suspense>
        </div>

        {/* Consent Modal */}
        <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
      </div>
    </div>
  );
}
