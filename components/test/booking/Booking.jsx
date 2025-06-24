'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBooking } from '@/hooks/useBooking';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyBooking from './EmptyBooking';
import RemoveBookingItemDialog from './RemoveBookingItemDialog';
import TestBookingCard from './TestBookingCard';
import BookingSummary from './BookingSummary';

export default function Booking() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false);
  const router = useRouter();
  const { bookings: booking, fetchBookings, guestId, isError, error: bookingError } = useBooking();

  useEffect(() => {
    async function loadBooking() {
      try {
        await fetchBookings();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsFetched(true);
      }
    }
    loadBooking();
  }, [fetchBookings]);

  const handleRemoveItem = async () => {
    if (!removeItem?.id) {
      toast.error('Invalid item ID', { duration: 4000 });
      return;
    }
    setIsUpdating(prev => ({ ...prev, [removeItem.id]: true }));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/remove/${removeItem.id}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      await fetchBookings();
      setRemoveItem(null);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_booking', { bookingItemId: removeItem.id });
      }
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsUpdating(prev => ({ ...prev, [removeItem.id]: false }));
    }
  };

  const handleConfirm = () => {
    try {
      const missingLabs = booking.labs?.some(lab => {
        const labBooking = booking.bookings?.find(b => b.labId === lab.lab.id);
        return !labBooking || !labBooking.timeSlotStart;
      });
      if (missingLabs) {
        toast.error('Please select a time slot for all labs.', { duration: 5000 });
        return;
      }
      router.push('/test/checkout');
    } catch (err) {
      toast.error(`Error checking time slots: ${err.message}`, { duration: 5000 });
    }
  };

  const calculateBookingPrice = (item) => item.price * (item.quantity || 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
          Your Booking
        </h1>
        {isError && <ErrorMessage error={bookingError?.message || 'Failed to load bookings'} />}
        {error && <ErrorMessage error={error} />}
        {!isFetched ? null : booking.labs?.length === 0 ? (
          <EmptyBooking />
        ) : (
          <div className="space-y-6">
            <RemoveBookingItemDialog
              removeItem={removeItem}
              setRemoveItem={setRemoveItem}
              handleRemoveItem={handleRemoveItem}
              isUpdating={isUpdating}
            />
            {booking.labs?.map((lab, index) => (
              <TestBookingCard
                key={lab.lab.id || index}
                lab={lab}
                booking={booking.bookings?.find(b => b.labId === lab.lab.id) || {}}
                setRemoveItem={setRemoveItem}
                isUpdating={isUpdating}
                calculateBookingPrice={calculateBookingPrice}
              />
            ))}
            <BookingSummary booking={booking} handleConfirm={handleConfirm} />
          </div>
        )}
      </div>
    </div>
  );
}