import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuantity, removeItem, bulkRemoveItems } from '../lib/cartApiClient';
import { toast } from 'sonner';

export function useCartMutations(guestId, apiUrl, onUpdateSuccess) {

  const queryClient = useQueryClient();
  
  const updateQuantityMutation = useMutation({
    mutationFn: ({ orderItemId, quantity }) =>
      updateQuantity(guestId, orderItemId, quantity, apiUrl),
    onError: (error) => {
      // Handle insufficient stock error with detailed message
      if (error.response?.data?.error === 'INSUFFICIENT_STOCK') {
        const details = error.response.data.details;
        const medicationName = details?.medicationName || 'this item';
        const pharmacyName = details?.pharmacyName || 'This pharmacy';
        const available = details?.available || 0;
        const requested = details?.requested || 0;
        
        if (available > 0) {
          toast.error(`Limited Stock at ${pharmacyName}`, {
            description: `${pharmacyName} currently has ${available} unit${available !== 1 ? 's' : ''} of ${medicationName}, but you tried to add ${requested}. You can adjust the quantity or search for this medication at other pharmacies.`,
            duration: 8000,
          });
        } else {
          toast.error(`Out of Stock at ${pharmacyName}`, {
            description: `${medicationName} is currently out of stock at ${pharmacyName}. Try searching for this medication at other pharmacies in your area.`,
            duration: 6000
          });
        }
      } else {
        // Generic error handling
        toast.error(error.response?.data?.message || error.message || 'Failed to update quantity. Please try again.', {
          duration: 4000
        });
      }
    },
    onSuccess: (data, variables) => {
      
      // Call the success callback if provided
      if (onUpdateSuccess) {
        onUpdateSuccess(variables);
      }
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
      toast.error('Failed to remove item', {
        description: error.response?.data?.message || error.message || 'Please try again',
        duration: 4000
      });
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
      toast.error('Failed to remove items', {
        description: error.response?.data?.message || error.message || 'Please try again',
        duration: 4000
      });
    },
    onSuccess: (data, variables) => {
      const count = variables.length;
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