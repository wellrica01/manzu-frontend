'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';

export function useBooking() {
  const queryClient = useQueryClient();
  const guestId = getGuestId();

  const { data: bookingData, isPending, isError, error, refetch: fetchBookings } = useQuery({
    queryKey: ['bookings', guestId],
    queryFn: async () => {
      console.log('Fetching bookings for guestId:', guestId);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking`, {
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
    enabled: !!guestId,
    staleTime: 5 * 1000,
    refetchOnWindowFocus: false,
    retry: 1, // Reduced from 2 to limit retries
    retryDelay: 1000, // Delay retries by 1 second
    onError: (err) => {
      toast.error(`Failed to load bookings: ${err.message}`, { duration: 4000 });
    },
  });

  const bookings = bookingData || { labs: [], totalPrice: 0, bookings: [], testOrderId: null };
  const bookingItemCount = bookings.labs?.reduce( (sum, lab) => sum + lab.items.length, 0) || 0;

  const addToBooking = useMutation({
    mutationFn: async ({ testId, labId }) => {
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
        throw new Error(errorData.message || 'Failed to add to booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', guestId]);
      toast.success('Test added to booking!', { duration: 4000 });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_booking', { testId, labId });
      }
    },
    onError: (error) => {
      toast.error(error.message, { duration: 4000 });
    },
  });

  const updateBookingDetails = useMutation({
    mutationFn: async ({ bookingId, timeSlotStart, fulfillmentType }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/update-details/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ timeSlotStart, fulfillmentType }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update booking details');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', guestId]);
      toast.success('Booking schedule updated!', { duration: 4000 });
    },
    onError: (error) => {
      toast.error(error.message, { duration: 4000 });
    },
  });

  const removeFromBooking = useMutation({
    mutationFn: async (itemId) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/remove/${itemId}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', guestId]);
      toast.success('Item removed from booking!', { duration: 4000 });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_booking', { itemId });
      }
    },
    onError: (error) => {
      toast.error(error.message, { duration: 4000 });
    },
  });

  const fetchTimeSlots = useMutation({
    mutationFn: async ({ labId }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking/slots?labId=${labId}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch time slots');
      }
      return response.json();
    },
  });

  console.log('useBooking state:', { isPending, isError, error: error?.message, bookings });

  return {
    bookingItemCount,
    bookings,
    fetchBookings,
    guestId,
    isPending,
    isError,
    addToBooking: addToBooking.mutate,
    updateBookingDetails: updateBookingDetails.mutate,
    removeFromBooking: removeFromBooking.mutate,
    fetchTimeSlots: fetchTimeSlots.mutate,
  };
}