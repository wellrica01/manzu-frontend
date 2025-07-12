/**
 * Cart segmentation utilities for smart cart management
 */

export const getCartSegments = (cart) => {
  if (!cart || !cart.pharmacies) {
    return {
      readyForCheckout: [],
      needsPrescription: [],
      totalPrice: 0,
      prescriptionPrice: 0,
      readyItemsCount: 0,
      prescriptionItemsCount: 0
    };
  }

  const segments = {
    readyForCheckout: [],
    needsPrescription: [],
    totalPrice: 0,
    prescriptionPrice: 0,
    readyItemsCount: 0,
    prescriptionItemsCount: 0
  };

  cart.pharmacies.forEach(pharmacy => {
    const pharmacyItems = pharmacy.items || [];
    
    pharmacyItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      
      // Check if item requires prescription and is not verified
      if (item.medication?.prescriptionRequired && 
          item.prescriptionStatus !== 'verified') {
        segments.needsPrescription.push({
          ...item,
          pharmacy: pharmacy.pharmacy,
          prescriptionStatus: item.prescriptionStatus || 'none'
        });
        segments.prescriptionPrice += itemTotal;
        segments.prescriptionItemsCount += item.quantity;
      } else {
        segments.readyForCheckout.push({
          ...item,
          pharmacy: pharmacy.pharmacy,
          prescriptionStatus: item.prescriptionStatus || 'none'
        });
        segments.totalPrice += itemTotal;
        segments.readyItemsCount += item.quantity;
      }
    });
  });

  return segments;
};

export const getCartStatus = (segments) => {
  const hasReadyItems = segments.readyForCheckout.length > 0;
  const hasPrescriptionItems = segments.needsPrescription.length > 0;

  if (!hasReadyItems && !hasPrescriptionItems) {
    return 'empty';
  } else if (hasReadyItems && !hasPrescriptionItems) {
    return 'ready_only';
  } else if (!hasReadyItems && hasPrescriptionItems) {
    return 'prescription_only';
  } else {
    return 'mixed';
  }
};

export const getCartStatusMessage = (status) => {
  const messages = {
    empty: 'Your cart is empty',
    ready_only: 'All items ready for checkout',
    prescription_only: 'Prescription upload required',
    mixed: 'Some items ready, others need prescriptions'
  };
  return messages[status] || 'Review your cart';
};

export const canProceedToCheckout = (segments) => {
  return segments.readyForCheckout.length > 0;
};

export const getPrescriptionItems = (segments) => {
  return segments.needsPrescription.map(item => ({
    id: item.id,
    name: item.medication.displayName,
    genericName: item.medication.genericName,
    prescriptionRequired: item.medication.prescriptionRequired,
    status: item.prescriptionStatus
  }));
}; 