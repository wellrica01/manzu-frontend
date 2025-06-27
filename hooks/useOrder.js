'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';

export function useOrder() {
  const queryClient = useQueryClient();
  const guestId = getGuestId();
  useEffect(() => {
    console.log('Guest ID:', guestId);
  }, [guestId]);

  const { data: orderData, isPending, isError, error, refetch: fetchOrder } = useQuery({
    queryKey: ['order', guestId],
    queryFn: async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
          headers: { 'x-guest-id': guestId },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch order: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!guestId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Prevent refetch on mount
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    retry: 3, // Allow a few retries
    retryDelay: 1000,
    placeholderData: { providers: [], totalPrice: 0, items: [], orderId: null },
    onError: (err) => {
      toast.error(`Failed to load order: ${err.message}`, { duration: 4000 });
    },
  });

  const order = orderData || { providers: [], totalPrice: 0, items: [], orderId: null };
  const orderItemCount = order.providers?.reduce((sum, provider) => sum + (provider.items?.length || 0), 0) || 0;

  const addToOrder = useMutation({
    mutationFn: async ({ serviceId, providerId, type, quantity }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ serviceId, providerId, type, quantity: quantity || 1 }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['order', guestId]);
      const typeLabel = {
        medication: 'Medication',
        diagnostic: 'Test',
        diagnostic_package: 'Package',
      }[data.type] || 'Service';
      toast.success(`${typeLabel} added to order!`, { duration: 4000 });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_order', { serviceId: data.orderItem.serviceId, providerId: data.orderItem.providerId, type: data.type, quantity: data.orderItem.quantity });
      }
    },
    onError: (error) => {
      toast.error(error.message, { duration: 4000 });
    },
  });

  const updateOrderDetails = useMutation({
    mutationFn: async ({ itemId, timeSlotStart, fulfillmentType }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/update-details/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ timeSlotStart, fulfillmentType }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order details');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['order', guestId], data);
      toast.success('Order details updated!', { duration: 4000 });
    },
    onError: (error) => {
      toast.error(error.message, { duration: 4000 });
    },
  });

  const removeFromOrder = useMutation({
    mutationFn: async (itemId) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/remove/${itemId}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove item');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['order', guestId], data);
      toast.success('Item removed from order!', { duration: 4000 });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_order', { itemId });
      }
    },
    onError: (error) => {
      toast.error(error.message, { duration: 4000 });
    },
  });

  const fetchTimeSlots = useMutation({
    mutationFn: async ({ providerId, serviceId, fulfillmentType = 'in_person', date }) => {
      const queryParams = new URLSearchParams({ providerId });
      if (serviceId) queryParams.append('serviceId', serviceId);
      if (fulfillmentType) queryParams.append('fulfillmentType', fulfillmentType);
      if (date) queryParams.append('date', date);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/orders/slots?${queryParams.toString()}`;
      console.log('Fetching time slots from:', apiUrl, 'Client timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      const response = await fetch(apiUrl, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch time slots error details:', errorData);
        throw new Error(errorData.message || 'Server error');
      }
      const data = await response.json();
      console.log('Time slots response:', data);
      return data;
    },
    onError: (error) => {
      console.error('Fetch time slots error:', error.message);
      toast.error(error.message, { duration: 4000 });
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('useOrder state:', { isPending, isError, error: error?.message, order });
  }

  return {
    orderItemCount,
    order,
    fetchOrder,
    guestId,
    isPending,
    isError,
    addToOrder: addToOrder.mutateAsync,
    updateOrderDetails: updateOrderDetails.mutate,
    removeFromOrder: removeFromOrder.mutate,
    fetchTimeSlots,
  };
}

export default useOrder;