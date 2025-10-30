import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for detecting and handling duplicate medications in cart
 * Features:
 * - Single item duplicate detection
 * - Bulk duplicate detection
 * - Multiple resolution strategies (keep, replace, add both)
 * - Processing state management
 */
export function useDuplicateDetection({
  cart,
  isInCart,
  pharmacyRecommendations,
  medications,
  addToCart,
  bulkAddToCart,
  removeFromCart,
  bulkRemoveFromCart,
  onItemsAdded,
}) {
  const [duplicateDialog, setDuplicateDialog] = useState({
    isOpen: false,
    existingItem: null,
    newItem: null,
  });

  const [bulkDuplicateDialog, setBulkDuplicateDialog] = useState({
    isOpen: false,
    pharmacyName: '',
    duplicates: [],
    safeItems: [],
    pharmacyId: null,
    allMeds: [],
    isProcessing: false,
  });

  // Check for single item duplicate
  const checkForDuplicates = useCallback((medicationId, pharmacyId, displayName) => {
    const existingInCart = cart?.pharmacies?.find(pharmacy =>
      pharmacy?.items?.some(item =>
        item?.medication?.id === medicationId && pharmacy?.pharmacy?.id !== pharmacyId
      )
    );

    if (existingInCart) {
      const existingItem = existingInCart.items.find(
        item => item?.medication?.id === medicationId
      );
      const newPharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
      const newMed = newPharmacy?.meds?.find(m => m.id === medicationId);
      const medQuantity = medications?.find(m => m.id === medicationId)?.quantity || 1;

      setDuplicateDialog({
        isOpen: true,
        existingItem: {
          medicationName: displayName,
          pharmacyName: existingInCart.pharmacy?.name || 'Unknown Pharmacy',
          price: existingItem?.price || 0,
          quantity: existingItem?.quantity || 1,
          cartItemId: existingItem?.id,
          pharmacyId: existingInCart.pharmacy?.id,
        },
        newItem: {
          medicationName: displayName,
          pharmacyName: newPharmacy?.pharmacyName || 'Unknown Pharmacy',
          price: newMed?.price || 0,
          quantity: medQuantity,
          medicationId,
          pharmacyId,
        },
      });
      return true;
    }

    return false;
  }, [cart, pharmacyRecommendations, medications]);

  // Check for bulk duplicates
  const checkBulkDuplicates = useCallback((pharmacyId, meds) => {
    if (!meds?.length) return { hasDuplicates: false, safeItems: [] };

    const duplicates = [];
    const safeItems = [];

    meds.forEach(med => {
      if (!med?.id) return;

      // Skip if already in cart from same pharmacy
      if (isInCart(med.id, pharmacyId)) return;

      // Check if in cart from different pharmacy
      const existingInCart = cart?.pharmacies?.find(pharmacy =>
        pharmacy?.items?.some(item =>
          item?.medication?.id === med.id && pharmacy?.pharmacy?.id !== pharmacyId
        )
      );

      if (existingInCart) {
        const existingItem = existingInCart.items.find(
          item => item?.medication?.id === med.id
        );

        duplicates.push({
          medicationId: med.id,
          medicationName: med.displayName || 'Unknown Medication',
          currentPharmacy: existingInCart.pharmacy?.name || 'Unknown Pharmacy',
          currentPrice: existingItem?.price || 0,
          newPrice: med.price || 0,
          quantity: existingItem?.quantity || 1,
          cartItemId: existingItem?.id,
          currentPharmacyId: existingInCart.pharmacy?.id,
        });
      } else {
        safeItems.push(med);
      }
    });

    if (duplicates.length > 0) {
      const currentPharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);

      setBulkDuplicateDialog({
        isOpen: true,
        pharmacyName: currentPharmacy?.pharmacyName || 'this pharmacy',
        duplicates,
        safeItems,
        pharmacyId,
        allMeds: meds,
        isProcessing: false,
      });

      return { hasDuplicates: true, safeItems: [] };
    }

    return { hasDuplicates: false, safeItems };
  }, [cart, isInCart, pharmacyRecommendations]);

  // Single item handlers
  const handleKeepExisting = useCallback(() => {
    setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
  }, []);

const handleReplaceWithNew = useCallback(async () => {
    const { existingItem, newItem } = duplicateDialog;
    if (!existingItem || !newItem) return;

    try {
      await removeFromCart(existingItem.cartItemId);
      const result = await addToCart(
        newItem.medicationId,
        newItem.pharmacyId,
        newItem.medicationName,
        newItem.quantity
      );

      // Find pharmacy for dialog
      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === newItem.pharmacyId);

      // Notify parent to show cart dialog
      if (result?.orderItem && onItemsAdded) {
        onItemsAdded([{
          id: result.orderItem.id,
          name: newItem.medicationName,
          pharmacy: pharmacy?.pharmacyName || newItem.pharmacyName,
          quantity: result.orderItem.quantity || newItem.quantity,
        }]);
      }

      setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
    } catch (error) {
      console.error('Replace error:', error);
    }
  }, [duplicateDialog, removeFromCart, addToCart, pharmacyRecommendations, onItemsAdded]);

 const handleAddBoth = useCallback(async () => {
    const { newItem } = duplicateDialog;
    if (!newItem) return;

    try {
      const result = await addToCart(
        newItem.medicationId,
        newItem.pharmacyId,
        newItem.medicationName,
        newItem.quantity
      );

      // Find pharmacy for dialog
      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === newItem.pharmacyId);

      // Notify parent to show cart dialog
      if (result?.orderItem && onItemsAdded) {
        onItemsAdded([{
          id: result.orderItem.id,
          name: newItem.medicationName,
          pharmacy: pharmacy?.pharmacyName || newItem.pharmacyName,
          quantity: result.orderItem.quantity || newItem.quantity,
        }]);
      }

      setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
    } catch (error) {
      console.error('Add both error:', error);
    }
  }, [duplicateDialog, addToCart, pharmacyRecommendations, onItemsAdded]);

  // Bulk handlers
  const handleBulkKeepExisting = useCallback(async () => {
    const { safeItems, pharmacyId } = bulkDuplicateDialog;

    if (!safeItems?.length || !pharmacyId) {
      setBulkDuplicateDialog(prev => ({ ...prev, isOpen: false }));
      return;
    }

    setBulkDuplicateDialog(prev => ({ ...prev, isProcessing: true }));

    try {
      const itemsToAdd = safeItems
        .filter(med => med?.id && !isInCart(med.id, pharmacyId))
        .map(med => ({
          medicationId: med.id,
          pharmacyId,
          quantity: medications?.find(m => m.id === med.id)?.quantity || 1,
        }));

      if (itemsToAdd.length === 0) {
        setBulkDuplicateDialog(prev => ({ ...prev, isOpen: false }));
        return;
      }

      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
      await bulkAddToCart(itemsToAdd, pharmacy?.pharmacyName || 'pharmacy');

      setBulkDuplicateDialog(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Bulk keep error:', error);
    } finally {
      setBulkDuplicateDialog(prev => ({ ...prev, isProcessing: false }));
    }
  }, [bulkDuplicateDialog, isInCart, medications, pharmacyRecommendations, bulkAddToCart]);


 const handleBulkReplaceAll = useCallback(async () => {
    const { duplicates, pharmacyId, allMeds } = bulkDuplicateDialog;

    if (!duplicates?.length || !pharmacyId) return;

    setBulkDuplicateDialog(prev => ({ ...prev, isProcessing: true }));

    try {
      // Remove duplicates
      const itemIdsToRemove = duplicates
        .map(dup => dup.cartItemId)
        .filter(Boolean);

      if (itemIdsToRemove.length > 0) {
        await bulkRemoveFromCart(itemIdsToRemove);
      }

      // Add new items
      const itemsToAdd = allMeds
        .filter(med => med?.id && !isInCart(med.id, pharmacyId))
        .map(med => ({
          medicationId: med.id,
          pharmacyId,
          quantity: medications?.find(m => m.id === med.id)?.quantity || 1,
        }));

      if (itemsToAdd.length > 0) {
        const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
        const result = await bulkAddToCart(itemsToAdd, pharmacy?.pharmacyName || 'pharmacy');

        // Notify parent to show cart dialog
        if (result?.orderItems?.length && onItemsAdded) {
          const addedItems = result.orderItems.map((orderItem, index) => ({
            id: orderItem.id,
            name: result.addedItems?.[index]?.displayName || allMeds[index]?.displayName || 'Item',
            pharmacy: pharmacy?.pharmacyName || 'Unknown',
            quantity: orderItem.quantity,
          }));
          onItemsAdded(addedItems);
        }
      }

      setBulkDuplicateDialog(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Bulk replace error:', error);
    } finally {
      setBulkDuplicateDialog(prev => ({ ...prev, isProcessing: false }));
    }
  }, [bulkDuplicateDialog, isInCart, medications, pharmacyRecommendations, bulkAddToCart, bulkRemoveFromCart, onItemsAdded]);


 const handleBulkAddAll = useCallback(async () => {
    const { allMeds, pharmacyId } = bulkDuplicateDialog;

    if (!allMeds?.length || !pharmacyId) {
      toast.error('No items to add');
      setBulkDuplicateDialog(prev => ({ ...prev, isOpen: false }));
      return;
    }

    setBulkDuplicateDialog(prev => ({ ...prev, isProcessing: true }));

    try {
      const itemsToAdd = allMeds
        .filter(med => med?.id && !isInCart(med.id, pharmacyId))
        .map(med => ({
          medicationId: med.id,
          pharmacyId,
          quantity: medications?.find(m => m.id === med.id)?.quantity || 1,
        }));

      if (itemsToAdd.length === 0) {
        setBulkDuplicateDialog(prev => ({ ...prev, isOpen: false }));
        return;
      }

      const pharmacy = pharmacyRecommendations?.find(p => p.pharmacyId === pharmacyId);
      const result = await bulkAddToCart(itemsToAdd, pharmacy?.pharmacyName || 'pharmacy');

      // Notify parent to show cart dialog
      if (result?.orderItems?.length && onItemsAdded) {
        const addedItems = result.orderItems.map((orderItem, index) => ({
          id: orderItem.id,
          name: result.addedItems?.[index]?.displayName || allMeds[index]?.displayName || 'Item',
          pharmacy: pharmacy?.pharmacyName || 'Unknown',
          quantity: orderItem.quantity,
        }));
        onItemsAdded(addedItems);
      }

      setBulkDuplicateDialog(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Bulk add all error:', error);
    } finally {
      setBulkDuplicateDialog(prev => ({ ...prev, isProcessing: false }));
    }
  }, [bulkDuplicateDialog, isInCart, medications, pharmacyRecommendations, bulkAddToCart, onItemsAdded]);

  const closeDuplicateDialog = useCallback(() => {
    setDuplicateDialog({ isOpen: false, existingItem: null, newItem: null });
  }, []);

  const closeBulkDialog = useCallback(() => {
    if (bulkDuplicateDialog.isProcessing) return;
    setBulkDuplicateDialog({
      isOpen: false,
      pharmacyName: '',
      duplicates: [],
      safeItems: [],
      pharmacyId: null,
      allMeds: [],
      isProcessing: false,
    });
  }, [bulkDuplicateDialog.isProcessing]);

  return {
    duplicateDialog,
    bulkDuplicateDialog,
    checkForDuplicates,
    checkBulkDuplicates,
    handleKeepExisting,
    handleReplaceWithNew,
    handleAddBoth,
    handleBulkKeepExisting,
    handleBulkReplaceAll,
    handleBulkAddAll,
    closeDuplicateDialog,
    closeBulkDialog,
  };
}