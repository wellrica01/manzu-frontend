'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';

export function useOrder() {
  const queryClient = useQueryClient();
  const guestId = getGuestId();

  const { data: orderData, isPending, isError, error, refetch: fetchOrder } = useQuery({
    queryKey: ['order', guestId],
    queryFn: async () => {
      console.log('Fetching order for guestId:', guestId);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
          headers: { 'x-guest-id': guestId },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Order API error:', response.status, errorData);
          throw new Error(errorData.message || `Failed to fetch order: ${response.status}`);
        }
        const data = await response.json();
        console.log('Order API response:', data);
        return data;
      } catch (error) {
        console.error('Order fetch error:', error.message);
        throw error;
      }
    },
    enabled: !!guestId,
    staleTime: 5 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
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
      queryClient.setQueryData(['order', guestId], data);
      const typeLabel = {
        medication: 'Medication',
        diagnostic: 'Test',
        diagnostic_package: 'Package',
      }[data.type] || 'Service';
      toast.success(`${typeLabel} added to order!`, { duration: 4000 });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_order', { serviceId, providerId, type, quantity });
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
    mutationFn: async ({ providerId }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/slots?providerId=${providerId}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch time slots');
      }
      return response.json();
    },
  });

  console.log('useOrder state:', { isPending, isError, error: error?.message, order });

  return {
    orderItemCount,
    order,
    fetchOrder,
    guestId,
    isPending,
    isError,
    addToOrder: addToOrder.mutate,
    updateOrderDetails: updateOrderDetails.mutate,
    removeFromOrder: removeFromOrder.mutate,
    fetchTimeSlots: fetchTimeSlots.mutate,
  };
}

export default useOrder;