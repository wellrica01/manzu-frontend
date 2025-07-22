/**
 * Cart segmentation utilities for smart cart management
 */

export const getCartSegments = (cart) => {
  if (!cart || !cart.pharmacies) {
    return {
      readyForCheckout: [],
      needsPrescription: [],
      pendingPrescription: [],
      rejectedPrescription: [],
      totalPrice: 0,
      prescriptionPrice: 0,
      pendingPrice: 0,
      rejectedPrice: 0,
      readyItemsCount: 0,
      prescriptionItemsCount: 0,
      pendingItemsCount: 0,
      rejectedItemsCount: 0
    };
  }

  const segments = {
    readyForCheckout: [],
    needsPrescription: [],
    pendingPrescription: [],
    rejectedPrescription: [],
    totalPrice: 0,
    prescriptionPrice: 0,
    pendingPrice: 0,
    rejectedPrice: 0,
    readyItemsCount: 0,
    prescriptionItemsCount: 0,
    pendingItemsCount: 0,
    rejectedItemsCount: 0
  };

  cart.pharmacies.forEach(pharmacy => {
    const pharmacyItems = pharmacy.items || [];
    
    pharmacyItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      
      // Check prescription status and segment accordingly
      if (item.medication?.prescriptionRequired) {
        const prescriptionStatus = item.prescriptionStatus || 'NONE';
        
        switch (prescriptionStatus) {
          case 'VERIFIED':
            // Verified prescriptions go to ready for checkout
            segments.readyForCheckout.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.totalPrice += itemTotal;
            segments.readyItemsCount += 1; // Count unique items, not quantity
            break;
            
          case 'PENDING':
            // Pending prescriptions go to pending segment
            segments.pendingPrescription.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.pendingPrice += itemTotal;
            segments.pendingItemsCount += 1; // Count unique items, not quantity
            break;
            
          case 'REJECTED':
            // Rejected prescriptions go to rejected segment
            segments.rejectedPrescription.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.rejectedPrice += itemTotal;
            segments.rejectedItemsCount += 1; // Count unique items, not quantity
            break;
            
          default:
            // No prescription uploaded yet
            segments.needsPrescription.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.prescriptionPrice += itemTotal;
            segments.prescriptionItemsCount += 1; // Count unique items, not quantity
            break;
        }
      } else {
        // Non-prescription items go directly to ready for checkout
        segments.readyForCheckout.push({
          ...item,
          pharmacy: pharmacy.pharmacy,
          prescriptionStatus: 'NONE'
        });
        segments.totalPrice += itemTotal;
        segments.readyItemsCount += 1; // Count unique items, not quantity
      }
    });
  });

  return segments;
};

export const getCartStatus = (segments) => {
  const hasReadyItems = segments.readyForCheckout.length > 0;
  const hasPrescriptionItems = segments.needsPrescription.length > 0;
  const hasPendingItems = segments.pendingPrescription.length > 0;
  const hasRejectedItems = segments.rejectedPrescription.length > 0;

  if (!hasReadyItems && !hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) {
    return 'empty';
  } else if (hasReadyItems && !hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) {
    return 'ready_only';
  } else if (hasPrescriptionItems && !hasReadyItems && !hasPendingItems && !hasRejectedItems) {
    return 'prescription_only';
  } else if (hasPendingItems && !hasReadyItems && !hasPrescriptionItems && !hasRejectedItems) {
    return 'pending_only';
  } else if (hasRejectedItems && !hasReadyItems && !hasPrescriptionItems && !hasPendingItems) {
    return 'rejected_only';
  } else {
    return 'mixed';
  }
};

export const getCartStatusMessage = (status) => {
  const messages = {
    empty: 'Your cart is empty',
    ready_only: 'All items ready for checkout',
    prescription_only: 'Prescription upload required',
    pending_only: 'Prescriptions under review',
    rejected_only: 'Prescriptions need re-upload',
    mixed: 'Mixed order - some items ready, others need attention'
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

export const getPendingPrescriptionItems = (segments) => {
  return segments.pendingPrescription.map(item => ({
    id: item.id,
    name: item.medication.displayName,
    genericName: item.medication.genericName,
    prescriptionRequired: item.medication.prescriptionRequired,
    status: item.prescriptionStatus
  }));
};

export const getRejectedPrescriptionItems = (segments) => {
  return segments.rejectedPrescription.map(item => ({
    id: item.id,
    name: item.medication.displayName,
    genericName: item.medication.genericName,
    prescriptionRequired: item.medication.prescriptionRequired,
    status: item.prescriptionStatus
  }));
};

export const getCartType = (segments) => {
  const hasOTC = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
  const hasVerifiedPrescription = segments.readyForCheckout.some(item => item.medication.prescriptionRequired);
  const hasPendingPrescription = segments.pendingPrescription.length > 0;
  const hasRejectedPrescription = segments.rejectedPrescription.length > 0;
  const hasUnuploadedPrescription = segments.needsPrescription.length > 0;

  if (hasOTC && !hasVerifiedPrescription && !hasPendingPrescription && !hasRejectedPrescription && !hasUnuploadedPrescription) {
    return 'otc_only';
  } else if (hasVerifiedPrescription && !hasOTC && !hasPendingPrescription && !hasRejectedPrescription && !hasUnuploadedPrescription) {
    return 'verified_prescription_only';
  } else if (hasUnuploadedPrescription && !hasOTC && !hasVerifiedPrescription && !hasPendingPrescription && !hasRejectedPrescription) {
    return 'prescription_only';
  } else if (hasPendingPrescription && !hasOTC && !hasVerifiedPrescription && !hasRejectedPrescription && !hasUnuploadedPrescription) {
    return 'pending_only';
  } else if (hasRejectedPrescription && !hasOTC && !hasVerifiedPrescription && !hasPendingPrescription && !hasUnuploadedPrescription) {
    return 'rejected_only';
  } else {
    return 'mixed';
  }
}; 