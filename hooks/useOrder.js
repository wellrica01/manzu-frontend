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

  const { data: ordersData, isPending, isError, error, refetch: fetchOrders } = useQuery({
    queryKey: ['orders', guestId],
    queryFn: async ({ queryKey }) => {
      const [, guestId, orderId] = queryKey;
      try {
        const url = orderId
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/orders?orderId=${orderId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/orders`;
        const response = await fetch(url, {
          headers: { 'x-guest-id': guestId },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.message || response.status === 404 ? 'Order not found' : `Failed to fetch orders: ${response.status}`;
          throw new Error(message);
        }
        const data = await response.json();
        console.log('Fetched orders:', data);
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!guestId,
    staleTime: 30 * 1000, // Increased from 5s to 30s
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: [],
    onError: (err) => {
      toast.error(err.message.includes('404') ? 'Order not found' : `Failed to load orders: ${err.message}`, { duration: 4000 });
    },
  });

  const orders = ordersData || [];

  const fetchPrescriptionStatuses = useQuery({
    queryKey: ['prescriptionStatuses', guestId],
    queryFn: async () => {
      const serviceIds = orders
        .flatMap((order) => order.providers.flatMap((provider) => provider.items))
        .filter((item) => item.service.prescriptionRequired)
        .map((item) => item.serviceId)
        .join(',');
      if (!serviceIds) return {};
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescriptions/status?serviceIds=${serviceIds}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || response.status === 404 ? 'No prescription statuses found' : 'Failed to fetch prescription statuses';
        throw new Error(message);
      }
      return response.json();
    },
    enabled: !!guestId && orders.length > 0,
    staleTime: 30 * 1000, // Increased from 10s to 30s
    retry: 2,
  });

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
        throw new Error(errorData.message || response.status === 404 ? 'Service or provider not found' : 'Failed to add to order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders', guestId]);
      queryClient.invalidateQueries(['prescriptionStatuses', guestId]);
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

  const updateOrderItem = useMutation({
    mutationFn: async ({ itemId, quantity, type }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/update/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ quantity, type }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.status === 404 ? 'Item not found' : 'Failed to update order item');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders', guestId]);
      queryClient.invalidateQueries(['prescriptionStatuses', guestId]);
      toast.success('Order item quantity updated!', { duration: 4000 });
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
        throw new Error(errorData.message || response.status === 404 ? 'Item not found' : 'Failed to update order details');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders', guestId]);
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
        throw new Error(errorData.message || response.status === 404 ? 'Item not found' : 'Failed to remove item');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders', guestId]);
      queryClient.invalidateQueries(['prescriptionStatuses', guestId]);
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
    mutationFn: async ({ providerId, serviceId, fulfillmentType = 'lab_visit', date }) => {
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
        throw new Error(errorData.message || response.status === 404 ? 'Time slots not found' : 'Failed to fetch time slots');
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

  const partialCheckout = useMutation({
    mutationFn: async ({ orderId }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/partial-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.status === 404 ? 'Order not found' : 'Failed to process partial checkout');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders', guestId]);
      queryClient.invalidateQueries(['prescriptionStatuses', guestId]);
      toast.success('Partial checkout processed successfully!', { duration: 4000 });
      return data;
    },
    onError: (error) => {
      toast.error(error.message, { duration: 4000 });
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('useOrder state:', { isPending, isError, error: error?.message, orders });
  }

  return {
    orders,
    fetchOrders: async (options = {}) => {
      const { orderId } = options;
      return fetchOrders({ queryKey: ['orders', guestId, orderId] });
    },
    guestId,
    isPending,
    isError,
    addToOrder: addToOrder.mutateAsync,
    updateOrderItem: updateOrderItem.mutateAsync,
    updateOrderDetails: updateOrderDetails.mutate,
    removeFromOrder: removeFromOrder.mutate,
    fetchTimeSlots,
    partialCheckout: partialCheckout.mutateAsync,
    prescriptionStatuses: fetchPrescriptionStatuses.data || {},
    isFetchingPrescriptionStatuses: fetchPrescriptionStatuses.isPending,
  };
}

export default useOrder;