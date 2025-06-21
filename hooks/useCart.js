'use client';
import { useQuery } from '@tanstack/react-query';
import { getGuestId } from '@/lib/utils';

export function useCart() {
  const guestId = getGuestId();

  const { data: cartData, isPending, isError, error, refetch: fetchCart } = useQuery({
    queryKey: ['cart', guestId],
    queryFn: async () => {
      console.log('Fetching cart for guestId:', guestId);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
          headers: { 'x-guest-id': guestId },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Cart API error:', response.status, errorData);
          throw new Error(errorData.message || `Failed to fetch cart: ${response.status}`);
        }
        const data = await response.json();
        console.log('Cart API response:', data);
        return data;
      } catch (error) {
        console.error('Cart fetch error:', error.message);
        throw error;
      }
    },
    enabled: !!guestId, // Only fetch if guestId exists
    staleTime: 5 * 1000, // Cache for 5 seconds
    refetchOnWindowFocus: false,
    retry: 2, // Retry up to 2 times on failure
    placeholderData: { pharmacies: [], totalPrice: 0 }, // Provide fallback during loading
  });

  const cart = cartData || { pharmacies: [], totalPrice: 0 };
  const cartItemCount = cart.pharmacies?.reduce((sum, pharmacy) => sum + (pharmacy.items?.length || 0), 0) || 0;

  console.log('useCart state:', { isPending, isError, error, cart });

  return { cartItemCount, cart, fetchCart, guestId, isPending, isError };
}