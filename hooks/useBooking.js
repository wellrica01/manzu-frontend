'use client';

import { useQuery } from '@tanstack/react-query';
import { getGuestId } from '@/lib/utils';

export function useBooking() {
  const guestId = getGuestId();

  const { data: bookingData, isPending, isError, error, refetch: fetchBookings } = useQuery({
    queryKey: ['bookings', guestId],
    queryFn: async () => {
      console.log('Fetching bookings for guestId:', guestId);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test/bookings`, {
          headers: { 'x-guest-id': guestId },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Bookings API error:', response.status, errorData);
          throw new Error(errorData.message || `Failed to fetch bookings: ${response.status}`);
        }
        const data = await response.json();
        console.log('Bookings API response:', data);
        return data;
      } catch (error) {
        console.error('Bookings fetch error:', error.message);
        throw error;
      }
    },
    enabled: !!guestId, // Only fetch if guestId exists
    staleTime: 5 * 1000, // Cache for 5 seconds
    refetchOnWindowFocus: false,
    retry: 2, // Retry up to 2 times on failure
    placeholderData: { labs: [], totalPrice: 0 }, // Provide fallback during loading
  });

  const bookings = bookingData || { labs: [], totalPrice: 0 };
  const bookingItemCount = bookings.labs?.reduce((sum, lab) => sum + (lab.items?.length || 0), 0) || 0;

  console.log('useBooking state:', { isPending, isError, error, bookings });

  return { bookingItemCount, bookings, fetchBookings, guestId, isPending, isError };
}