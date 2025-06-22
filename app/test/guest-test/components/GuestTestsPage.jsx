'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Loader2, CheckCircle, Info, X } from 'lucide-react';
import { cn, getGuestId } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import TestCard from './TestCard';
import { useBooking } from '@/hooks/useBooking';

export default function GuestTest() {
  const [tests, setTests] = useState([]);
  const [testOrderMetadata, setTestOrderMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingItems, setBookingItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showTestImage, setShowTestImage] = useState(null);
  const { patientIdentifier } = useParams();
  const { bookings, fetchBookings, guestId } = useBooking();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Guest Tests',
        page_path: `/test/guest-test/${patientIdentifier}`,
      });
    }
  }, [patientIdentifier]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast.error('Unable to fetch location. Showing all labs.', { duration: 4000 });
          setError('Unable to fetch location; showing all labs');
        }
      );
    }
  }, []);

  const fetchGuestTestOrder = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (userLocation) {
        queryParams.append('lat', userLocation.lat);
        queryParams.append('lng', userLocation.lng);
        queryParams.append('radius', '10');
      }
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/test-order/guest-test/${patientIdentifier}?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch guest test order');
      }
      const data = await response.json();
      setTests(data.tests || []);
      setTestOrderMetadata(data.testOrderMetadata || null);
    } catch (err) {
      setError(err.message || 'Unknown error');
      toast.error(err.message || 'Failed to load test order', { duration: 4000 });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'error', {
          error_message: err.message,
          page: 'Guest Tests',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientIdentifier && (userLocation || error)) {
      fetchGuestTestOrder();
      fetchBookings();
      setBookingItems(bookings.labs?.flatMap(l => l.items) || []);
    }
  }, [patientIdentifier, userLocation, error, fetchBookings, bookings]);

  const handleAddToBooking = async (testId, labId, testName) => {
    try {
      setBookingItems(prev => [
        ...prev,
        {
          labTestTestId: testId,
          labTestLabId: labId,
          test: { name: testName },
        },
      ]);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ testId, labId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }
      setLastAddedItem(testName);
      setOpenBookingDialog(true);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_booking', { testId, labId });
      }
      await fetchBookings();
    } catch (err) {
      toast.error(`Error: ${err.message}`, { duration: 4000 });
      setBookingItems(prev => prev.filter(item =>
        !(item.labTestTestId === testId && item.labTestLabId === labId)
      ));
    }
  };

  const isInBooking = (testId, labId) => {
    if (!Array.isArray(cartItems)) return false;
    return bookingItems.some(
      (item) => item.labTestTestId === testId && item.labTestLabId === labId
    );
  };

  const getIntroMessage = () => {
    if (!testOrderMetadata) return null;
    switch (testOrderMetadata.status) {
      case 'verified':
        return (
          <Card className="shadow-xl border border-gray-100/35 rounded-3xl bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-md p-6 mb-6 text-center">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-full" />
            <p className="text-lg text-gray-700">
              Your test order has been verified by our team. Select your preferred labs below to book your tests.{' '}
              <Link
                href="/support"
                className="text-primary hover:text-blue-600 underline font-semibold"
                aria-label="Contact support"
              >
                Contact us
              </Link>{' '}
              if anything looks incorrect.
            </p>
          </Card>
        );
      case 'pending_admin':
      case 'pending_action':
        return (
          <Card className="shadow-xl border border-yellow-100/50 rounded-3xl bg-yellow-50/90 backdrop-blur-md p-6 mb-6 text-center">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-full" />
            <h1 className="text-3xl font-extrabold text-gray-800 mb-3">Test Order Under Review</h1>
            <p className="text-lg text-gray-600">
              Your test order is currently {testOrderMetadata.status === 'pending_admin' ? 'under review by our team' : 'pending action'}. We’ll notify you when it’s ready to book.{' '}
              <Link
                href="/support"
                className="text-primary hover:text-blue-600 underline font-semibold"
                aria-label="Contact support"
              >
                Contact support
              </Link>{' '}
            </p>
          </Card>
        );
      default:
        return null;
    }
  };

  const steps = [
    { label: 'Uploaded', description: 'You submitted the test order' },
    { label: 'Verifying', description: 'Lab specialist is reviewing' },
    { label: 'Ready to Book', description: 'Book your test' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-gray-500 mt-3 text-base font-medium">Loading your test order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-red-50/95 border border-red-400/30 rounded-xl p-5 max-w-md text-center">
          <p className="text-red-600 text-base font-medium" aria-live="polite">
            Error: {error}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Please check your test order link or{' '}
            <Link
              href="/test-order/upload"
              className="text-primary hover:text-blue-600 underline font-semibold"
              aria-label="Upload new test order"
            >
              upload a new test order
            </Link>.
            Contact{' '}
            <Link
              href="/support"
              className="text-primary hover:text-blue-600 underline font-semibold"
              aria-label="Contact support"
            >
              support
            </Link>{' '}
            for help.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto bg-gradient-to-b from-gray-50/95 to-gray-100/95 animate-in fade-in-20 duration-500">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4">
        {steps.map((step, index) => {
          const statusMap = { uploaded: 0, pending: 1, verified: 2 };
          const currentStep = statusMap[testOrderMetadata.status] || 0;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={step.label || index}>
              <div className="flex flex-col items-center text-center min-w-[60px]">
                <div
                  className={cn(
                    'h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center font-semibold mb-1 sm:mb-2 text-sm sm:text-base',
                    isCompleted
                      ? 'bg-primary text-white'
                      : isCurrent
                      ? 'border-2 border-primary bg-primary/10 text-primary'
                      : 'bg-gray-200 text-gray-400'
                  )}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-700">{step.label}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-1 sm:mx-2 rounded-full bg-primary'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {getIntroMessage()}
      {testOrderMetadata && (
        <Card className="shadow-md border border-gray-100/50 rounded-2xl bg-gray-50/90 backdrop-blur-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Test Order #{testOrderMetadata.id} | Uploaded:{' '}
                {new Date(testOrderMetadata.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 capitalize">Status: {testOrderMetadata.status.replace('_', ' ')}</p>
            </div>
            {testOrderMetadata.fileUrl && (
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="h-10 px-4 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50"
                aria-label="View test order image"
              >
                View Test Order
              </Button>
            )}
          </div>
        </Card>
      )}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-gray-100/30">
          <DialogTitle>
            <VisuallyHidden>Test Order Image Preview</VisuallyHidden>
          </DialogTitle>
          <img
            src={testOrderMetadata?.fileUrl}
            alt="Test Order"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={!!showTestImage} onOpenChange={() => setShowTestImage(null)}>
        <DialogContent className="sm:max-w-lg p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-gray-100/30">
          <DialogTitle>
            <VisuallyHidden>Test Image Preview</VisuallyHidden>
          </DialogTitle>
          <img
            src={tests.find(test => test.id === showTestImage)?.imageUrl || '/fallback-test.png'}
            alt={tests.find(test => test.id === showTestImage)?.name || 'Test'}
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={openBookingDialog} onOpenChange={setOpenBookingDialog}>
        <DialogContent
          className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={() => document.getElementById(`add-to-cart-${lastAddedItem}`)?.focus()}
        >
          <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
          <DialogHeader className="flex flex-col items-center gap-3">
            <CheckCircle
              className="h-12 w-12 text-green-500 animate-[pulse_1s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            <DialogTitle className="text-2xl font-extrabold text-primary tracking-tight text-center">
              Added to Booking!
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-600 text-base font-medium mt-2">
            <span className="font-semibold text-gray-900">{lastAddedItem}</span> is now in your booking.
          </p>
          <DialogFooter className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setOpenBookingDialog(false)}
              className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
              aria-label="Continue shopping"
            >
              Continue Shopping
            </Button>
            <Button
              asChild
              className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
            >
              <Link href="/lab/cart" aria-label="View cart">View Booking</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {testOrderMetadata?.status === 'verified' ? (
        tests.length === 0 ? (
          <Card className="shadow-xl border border-gray-100/50 rounded-2xl text-center py-10 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <p className="text-gray-600 text-xl font-medium">
              No tests found for this test order.{' '}
              <Link
                href="/test-order/upload"
                className="text-primary hover:text-blue-600 underline font-semibold"
                aria-label="Upload new test order"
              >
                Upload a new test order
              </Link>{' '}
              or contact{' '}
              <Link
                href="/support"
                className="text-primary hover:text-blue-600 underline font-semibold"
                aria-label="Contact support"
              >
                support
              </Link>.
            </p>
          </Card>
        ) : (
          tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              handleAddToBooking={handleAddToBooking}
              isInBooking={isInBooking}
              setShowTestImage={setShowTestImage}
            />
          ))
        )
      ) : null}
      {testOrderMetadata?.status === 'verified' && tests.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              asChild
              className="w-full h-14 px-6 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300"
              disabled={cartItems.length === 0}
              aria-label="View booking"
            >
              <Link href="/lab/booking">View Booking</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-full hover:bg-gray-100/50 transition-all duration-200"
              aria-label="Toggle booking info"
            >
              {showInfo ? <X className="h-5 w-5 text-primary" /> : <Info className="h-5 w-5 text-primary" />}
            </Button>
          </div>
          {showInfo && (
            <Card className="shadow-md border border-gray-100/50 rounded-2xl bg-gray-50/90 backdrop-blur-sm p-4">
              <p className="text-base text-gray-600">
                After adding tests to your booking, proceed to checkout to choose home collection or lab visit options and complete your secure payment. Your booking will be confirmed within 24 hours.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}