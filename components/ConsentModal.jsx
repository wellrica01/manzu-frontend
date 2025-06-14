'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function ConsentModal({ isOpen, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const storedId = localStorage.getItem('guestId');
    if (!storedId) {
      const newId = uuidv4();
      localStorage.setItem('guestId', newId);
    }
  }, []);

  const handleConsent = async () => {
    const guestId = localStorage.getItem('guestId');

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
      <DialogContent className="sm:max-w-md" aria-describedby="privacy-description">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-primary">
            Data Privacy Consent
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p id="privacy-description" className="text-sm text-muted-foreground">
            Manzu collects your email, phone, location, and prescription data to process orders,
            in compliance with Nigeria’s Data Protection Regulation (NDPR). Do you consent to this?
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            asChild
            variant="outline"
            className="text-sm"
            aria-label="Learn more about privacy policy"
          >
            <Link href="/privacy-policy">Learn More</Link>
          </Button>
          <Button
            onClick={handleConsent}
            disabled={isSubmitting}
            className="text-sm bg-primary hover:bg-primary/90"
            aria-label="Consent to data collection"
          >
            {isSubmitting ? 'Submitting...' : 'I Consent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
