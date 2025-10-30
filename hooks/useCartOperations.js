import { useState, useCallback, useRef } from 'react';
import { apiRequest, validateResponse } from '../lib/apiClient';
import { toast } from 'sonner';

export function useCartOperations(userIdentifier, guestId, prescriptionId, fetchCart) {
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [isRemoving, setIsRemoving] = useState(false);
  const operationQueue = useRef(new Set());

  const addToCart = useCallback(async (medicationId, pharmacyId, displayName, quantity = 1) => {
    const operationKey = `add-${medicationId}-${pharmacyId}`;
    
    // Prevent duplicate operations
    if (operationQueue.current.has(operationKey)) {
      return;
    }
    
    operationQueue.current.add(operationKey);
    const cartKey = `${medicationId}-${pharmacyId}`;
    setIsAddingToCart(prev => ({ ...prev, [cartKey]: true }));
    
    try {
      const requestKey = `cart-add-${medicationId}-${pharmacyId}-${Date.now()}`;
      
      const result = await apiRequest(
        requestKey,
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId || '',
          },
          body: JSON.stringify({
            userIdentifier: userIdentifier || '',
            medicationId,
            pharmacyId,
            quantity,
            prescriptionId,
          }),
        }
      );

      const validated = validateResponse(result, { orderItem: true });
      
      // Optimistic update - refresh cart in background
      fetchCart();

      return validated;
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error.message || 'Failed to add item to cart');
      throw error;
    } finally {
      operationQueue.current.delete(operationKey);
      setIsAddingToCart(prev => {
        const updated = { ...prev };
        delete updated[cartKey];
        return updated;
      });
    }
  }, [userIdentifier, guestId, prescriptionId, fetchCart]);

  const bulkAddToCart = useCallback(async (items, pharmacyName) => {
    const operationKey = `bulk-add-${items.map(i => i.medicationId).join('-')}`;
    
    if (operationQueue.current.has(operationKey)) {
      return;
    }
    
    operationQueue.current.add(operationKey);
    
    try {
      const requestKey = `cart-bulk-add-${Date.now()}`;
      
      const result = await apiRequest(
        requestKey,
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/add-bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId || '',
          },
          body: JSON.stringify({
            userIdentifier: userIdentifier || '',
            guestId: guestId || '',
            items,
            prescriptionId,
          }),
        }
      );

      const validated = validateResponse(result, { orderItems: true, addedItems: true });
      
      fetchCart();
      
      return validated;
    } catch (error) {
      console.error('Bulk add error:', error);
      toast.error(error.message || 'Failed to add items');
      throw error;
    } finally {
      operationQueue.current.delete(operationKey);
    }
  }, [userIdentifier, guestId, prescriptionId, fetchCart]);

  const removeFromCart = useCallback(async (cartItemId) => {
    setIsRemoving(true);
    
    try {
      const requestKey = `cart-remove-${cartItemId}`;
      
      await apiRequest(
        requestKey,
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${cartItemId}`,
        {
          method: 'DELETE',
          headers: { 'x-guest-id': guestId || '' },
        }
      );
      
      await fetchCart();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(error.message || 'Failed to remove item');
      throw error;
    } finally {
      setIsRemoving(false);
    }
  }, [guestId, fetchCart]);

  const bulkRemoveFromCart = useCallback(async (itemIds) => {
    setIsRemoving(true);
    
    try {
      const requestKey = `cart-bulk-remove-${itemIds.join('-')}`;
      
      await apiRequest(
        requestKey,
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove-bulk`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId || '',
          },
          body: JSON.stringify({ orderItemIds: itemIds }),
        }
      );
      
      await fetchCart();
    } catch (error) {
      console.error('Bulk remove error:', error);
      toast.error(error.message || 'Failed to remove items');
      throw error;
    } finally {
      setIsRemoving(false);
    }
  }, [guestId, fetchCart]);

  return {
    addToCart,
    bulkAddToCart,
    removeFromCart,
    bulkRemoveFromCart,
    isAddingToCart,
    isRemoving,
  };
}
