import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuantity, removeItem, bulkRemoveItems } from '../lib/cartApiClient';
import { toast } from 'sonner';

export function useCartMutations(guestId, apiUrl) {
  const queryClient = useQueryClient();
  
 const updateQuantityMutation = useMutation({
  mutationFn: ({ orderItemId, quantity }) =>
    updateQuantity(guestId, orderItemId, quantity, apiUrl),
  onError: (error) => {
    toast.error(error.message || 'Failed to update quantity');
  },
  onSuccess: () => {
    toast.success('Quantity updated');
  },
  onSettled: () => {
    // Force refetch from backend to get accurate data
    queryClient.invalidateQueries(['cart', guestId]);
  },
});
  
  const removeItemMutation = useMutation({
    mutationFn: (orderItemId) => removeItem(guestId, orderItemId, apiUrl),
    onMutate: async (orderItemId) => {
      await queryClient.cancelQueries(['cart', guestId]);
      const previousCart = queryClient.getQueryData(['cart', guestId]);
      
      if (previousCart) {
        const updatedCart = JSON.parse(JSON.stringify(previousCart));
        updatedCart.pharmacies = updatedCart.pharmacies
          ?.map(pharmacy => ({
            ...pharmacy,
            items: pharmacy.items?.filter(item => item.id !== orderItemId) || [],
          }))
          .filter(pharmacy => pharmacy.items.length > 0);
        
        queryClient.setQueryData(['cart', guestId], updatedCart);
      }
      
      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', guestId], context.previousCart);
      }
      toast.error(error.message || 'Failed to remove item');
    },
    onSuccess: () => {
      toast.success('Item removed from cart');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['cart', guestId]);
    },
  });
  
  const bulkRemoveMutation = useMutation({
    mutationFn: (orderItemIds) => bulkRemoveItems(guestId, orderItemIds, apiUrl),
    onMutate: async (orderItemIds) => {
      await queryClient.cancelQueries(['cart', guestId]);
      const previousCart = queryClient.getQueryData(['cart', guestId]);
      
      if (previousCart) {
        const idsSet = new Set(orderItemIds);
        const updatedCart = JSON.parse(JSON.stringify(previousCart));
        updatedCart.pharmacies = updatedCart.pharmacies
          ?.map(pharmacy => ({
            ...pharmacy,
            items: pharmacy.items?.filter(item => !idsSet.has(item.id)) || [],
          }))
          .filter(pharmacy => pharmacy.items.length > 0);
        
        queryClient.setQueryData(['cart', guestId], updatedCart);
      }
      
      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', guestId], context.previousCart);
      }
      toast.error(error.message || 'Failed to remove items');
    },
    onSuccess: (data, variables) => {
      toast.success(`Removed ${variables.length} item${variables.length > 1 ? 's' : ''}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['cart', guestId]);
    },
  });
  
  return {
    updateQuantity: updateQuantityMutation.mutate,
    updateQuantityAsync: updateQuantityMutation.mutateAsync,
    removeItem: removeItemMutation.mutate,
    removeItemAsync: removeItemMutation.mutateAsync,
    bulkRemove: bulkRemoveMutation.mutate,
    bulkRemoveAsync: bulkRemoveMutation.mutateAsync,
    isUpdating: updateQuantityMutation.isPending || removeItemMutation.isPending,
    isRemoving: bulkRemoveMutation.isPending,
  };
}