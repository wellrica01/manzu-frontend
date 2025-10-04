'use client';

import { useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getGuestId } from '@/lib/utils';

const fetchCartData = async (guestId) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
    headers: { 'x-guest-id': guestId },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch cart: ${response.status}`);
  }

  return await response.json();
};

export function useCart() {
  const guestId = getGuestId();
  const queryClient = useQueryClient();

  const { data: cartData, isLoading, isError, error, refetch: fetchCart } = useQuery({
    queryKey: ['cart', guestId],
    queryFn: () => fetchCartData(guestId),
    enabled: !!guestId,
    staleTime: 5000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const cartItemCount = useMemo(
    () =>
      cartData?.pharmacies?.reduce(
        (sum, pharmacy) => sum + (pharmacy.items?.length || 0),
        0
      ) || 0,
    [cartData]
  );

  const isInCart = useCallback(
    (medicationId, pharmacyId) => {
      return (
        cartData?.pharmacies?.some(
          (ph) =>
            ph.pharmacy.id === pharmacyId &&
            ph.items?.some((item) => item.medication.id === medicationId)
        ) || false
      );
    },
    [cartData]
  );

  useEffect(() => {
    if (guestId) fetchCart();
  }, [guestId, fetchCart]);

  // Update cache manually (useful for optimistic updates)
  const updateCartCache = (newCartData) => {
    queryClient.setQueryData(['cart', guestId], newCartData);
  };

  // ✅ Add item with optimistic update
  const addItemMutation = useMutation({
    mutationFn: async (item) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Failed to add item');
      return res.json();
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries(['cart', guestId]);
      const previousCart = queryClient.getQueryData(['cart', guestId]);

      if (previousCart) {
        const updatedCart = { ...previousCart };
        const pharmacy = updatedCart.pharmacies.find(p => p.pharmacy.id === item.pharmacyId);
        if (pharmacy) {
          pharmacy.items = [...pharmacy.items, item];
        } else {
          updatedCart.pharmacies.push({ pharmacy: { id: item.pharmacyId }, items: [item] });
        }
        queryClient.setQueryData(['cart', guestId], updatedCart);
      }

      return { previousCart };
    },
    onError: (_err, _item, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', guestId], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['cart', guestId]);
    },
  });

  // ❌ Remove item with optimistic update
  const removeItemMutation = useMutation({
    mutationFn: async ({ medicationId, pharmacyId }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ medicationId, pharmacyId }),
      });
      if (!res.ok) throw new Error('Failed to remove item');
      return res.json();
    },
    onMutate: async ({ medicationId, pharmacyId }) => {
      await queryClient.cancelQueries(['cart', guestId]);
      const previousCart = queryClient.getQueryData(['cart', guestId]);

      if (previousCart) {
        const updatedCart = { ...previousCart };
        const pharmacy = updatedCart.pharmacies.find(p => p.pharmacy.id === pharmacyId);
        if (pharmacy) {
          pharmacy.items = pharmacy.items.filter(item => item.medication.id !== medicationId);
          // If pharmacy is now empty, optionally remove it
          if (pharmacy.items.length === 0) {
            updatedCart.pharmacies = updatedCart.pharmacies.filter(p => p.pharmacy.id !== pharmacyId);
          }
        }
        queryClient.setQueryData(['cart', guestId], updatedCart);
      }

      return { previousCart };
    },
    onError: (_err, _item, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', guestId], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['cart', guestId]);
    },
  });

  return {
    guestId,
    cart: cartData || null,
    cartItemCount,
    isInCart,
    fetchCart,
    updateCartCache,
    addItem: addItemMutation.mutate,
    addItemAsync: addItemMutation.mutateAsync, // optional for awaiting
    removeItem: removeItemMutation.mutate,
    removeItemAsync: removeItemMutation.mutateAsync, // optional for awaiting
    isLoading,
    isError,
    error,
  };
}
