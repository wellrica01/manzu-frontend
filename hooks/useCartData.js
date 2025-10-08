import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCart } from '../lib/cartApiClient';
import { useMemo } from 'react';

export function useCartData(guestId, apiUrl) {
  const queryClient = useQueryClient();
  
  const {
    data: cart,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cart', guestId],
    queryFn: () => fetchCart(guestId, apiUrl),
    enabled: !!guestId && !!apiUrl,
    staleTime: 5000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  
  const itemCount = useMemo(() => {
    return cart?.pharmacies?.reduce(
      (sum, pharmacy) => sum + (pharmacy.items?.length || 0),
      0
    ) || 0;
  }, [cart]);
  
  const isInCart = useMemo(() => {
    return (medicationId, pharmacyId) => {
      return cart?.pharmacies?.some(
        (ph) =>
          ph.pharmacy?.id === pharmacyId &&
          ph.items?.some((item) => item.medication?.id === medicationId)
      ) || false;
    };
  }, [cart]);
  
  const updateCache = (updater) => {
    queryClient.setQueryData(['cart', guestId], updater);
  };
  
  return {
    cart,
    itemCount,
    isInCart,
    isLoading,
    isError,
    error,
    refetch,
    updateCache,
  };
}