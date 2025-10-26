/**
 * Cart segmentation utilities for smart cart management
 */
import { PrescriptionStatus } from './cartApiClient';

const requestQueue = new Map();

export function deduplicateRequest(key, requestFn) {
  if (requestQueue.has(key)) {
    return requestQueue.get(key);
  }

  const promise = requestFn().finally(() => {
    requestQueue.delete(key);
  });

  requestQueue.set(key, promise);
  return promise;
}

export const getCartSegments = (cart) => {
  if (!cart || !cart.pharmacies) {
    return {
      readyForCheckout: [],
      needsPrescription: [],
      pendingPrescription: [],
      rejectedPrescription: [],
      expiredPrescription: [], // NEW: Add expired segment
      totalPrice: 0,
      prescriptionPrice: 0,
      pendingPrice: 0,
      rejectedPrice: 0,
      expiredPrice: 0, // NEW: Add expired price
      readyItemsCount: 0,
      prescriptionItemsCount: 0,
      pendingItemsCount: 0,
      rejectedItemsCount: 0,
      expiredItemsCount: 0 // NEW: Add expired count
    };
  }

  const segments = {
    readyForCheckout: [],
    needsPrescription: [],
    pendingPrescription: [],
    rejectedPrescription: [],
    expiredPrescription: [], // NEW: Add expired segment
    totalPrice: 0,
    prescriptionPrice: 0,
    pendingPrice: 0,
    rejectedPrice: 0,
    expiredPrice: 0, // NEW: Add expired price
    readyItemsCount: 0,
    prescriptionItemsCount: 0,
    pendingItemsCount: 0,
    rejectedItemsCount: 0,
    expiredItemsCount: 0 // NEW: Add expired count
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
            segments.readyItemsCount += 1;
            break;
            
          case 'PENDING':
            // Pending prescriptions go to pending segment
            segments.pendingPrescription.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.pendingPrice += itemTotal;
            segments.pendingItemsCount += 1;
            break;
            
          case 'REJECTED':
            // Rejected prescriptions go to rejected segment
            segments.rejectedPrescription.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.rejectedPrice += itemTotal;
            segments.rejectedItemsCount += 1;
            break;
            
          case 'EXPIRED': // NEW: Handle expired prescriptions
            // Expired prescriptions need re-upload
            segments.expiredPrescription.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.expiredPrice += itemTotal;
            segments.expiredItemsCount += 1;
            break;
            
          default:
            // No prescription uploaded yet
            segments.needsPrescription.push({
              ...item,
              pharmacy: pharmacy.pharmacy,
              prescriptionStatus: prescriptionStatus
            });
            segments.prescriptionPrice += itemTotal;
            segments.prescriptionItemsCount += 1;
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
        segments.readyItemsCount += 1;
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
  const hasExpiredItems = segments.expiredPrescription.length > 0; // NEW

  if (!hasReadyItems && !hasPrescriptionItems && !hasPendingItems && !hasRejectedItems && !hasExpiredItems) {
    return 'empty';
  } else if (hasReadyItems && !hasPrescriptionItems && !hasPendingItems && !hasRejectedItems && !hasExpiredItems) {
    return 'ready_only';
  } else if (hasPrescriptionItems && !hasReadyItems && !hasPendingItems && !hasRejectedItems && !hasExpiredItems) {
    return 'prescription_only';
  } else if (hasPendingItems && !hasReadyItems && !hasPrescriptionItems && !hasRejectedItems && !hasExpiredItems) {
    return 'pending_only';
  } else if (hasRejectedItems && !hasReadyItems && !hasPrescriptionItems && !hasPendingItems && !hasExpiredItems) {
    return 'rejected_only';
  } else if (hasExpiredItems && !hasReadyItems && !hasPrescriptionItems && !hasPendingItems && !hasRejectedItems) {
    return 'expired_only'; // NEW
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
    expired_only: 'Prescriptions have expired - re-upload required', // NEW
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
    prescriptionRequired: item.medication.prescriptionRequired,
    status: item.prescriptionStatus
  }));
};

export const getPendingPrescriptionItems = (segments) => {
  return segments.pendingPrescription.map(item => ({
    id: item.id,
    name: item.medication.displayName,
    prescriptionRequired: item.medication.prescriptionRequired,
    status: item.prescriptionStatus
  }));
};

export const getRejectedPrescriptionItems = (segments) => {
  return segments.rejectedPrescription.map(item => ({
    id: item.id,
    name: item.medication.displayName,
    prescriptionRequired: item.medication.prescriptionRequired,
    status: item.prescriptionStatus
  }));
};

// NEW: Get expired prescription items
export const getExpiredPrescriptionItems = (segments) => {
  return segments.expiredPrescription.map(item => ({
    id: item.id,
    name: item.medication.displayName,
    prescriptionRequired: item.medication.prescriptionRequired,
    status: item.prescriptionStatus
  }));
};

export function getCartType(segments) {
  const hasOTC = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
  const hasPrescription = segments.needsPrescription.length > 0;
  const hasVerified = segments.readyForCheckout.some(
    item => item.medication.prescriptionRequired && item.prescriptionStatus === PrescriptionStatus.VERIFIED
  );
  const hasPending = segments.pendingPrescription.length > 0;
  const hasExpired = segments.expiredPrescription.length > 0; // NEW

  if (hasVerified && !hasOTC && !hasPrescription && !hasPending && !hasExpired) {
    return 'verified_prescription_only';
  }
  if (hasOTC && hasPrescription) return 'mixed';
  if (hasOTC && !hasPrescription && !hasVerified && !hasExpired) return 'otc_only';
  if (hasPrescription && !hasOTC && !hasVerified && !hasExpired) return 'prescription_only';
  if (hasVerified && hasOTC) return 'mixed';
  if (hasVerified && hasPrescription) return 'mixed';
  if (hasExpired) return 'mixed'; // NEW: Expired prescriptions in mixed cart
  return 'empty';
}

export function trackEvent(eventName, data) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, data);
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

export function calculateItemPrice(item) {
  return item.quantity * item.price;
}

export function groupItemsByPharmacy(items) {
  const grouped = {};
  items.forEach(item => {
    const pharmacyId = item.pharmacy.id;
    if (!grouped[pharmacyId]) {
      grouped[pharmacyId] = {
        pharmacy: item.pharmacy,
        items: [],
        subtotal: 0
      };
    }
    grouped[pharmacyId].items.push(item);
    grouped[pharmacyId].subtotal += item.price * item.quantity;
  });
  return Object.values(grouped);
}

export function getTabSummary(activeTab, segments) {
  const summaries = {
    ready: {
      title: 'Ready Medications Summary',
      items: segments.readyForCheckout,
      totalPrice: segments.totalPrice,
      itemCount: segments.readyItemsCount,
      message: 'These medications are ready for immediate checkout',
      type: 'ready'
    },
    needs_prescription: {
      title: 'Needs Prescription Summary',
      items: segments.needsPrescription,
      totalPrice: segments.prescriptionPrice,
      itemCount: segments.prescriptionItemsCount,
      message: 'Upload prescriptions to proceed with these medications',
      type: 'needs_prescription'
    },
    pending: {
      title: 'Under Review Summary',
      items: segments.pendingPrescription,
      totalPrice: segments.pendingPrice,
      itemCount: segments.pendingItemsCount,
      message: 'Your prescriptions are being reviewed by our pharmacy team',
      type: 'pending'
    },
    rejected: {
      title: 'Rejected Prescriptions Summary',
      items: segments.rejectedPrescription,
      totalPrice: segments.rejectedPrice,
      itemCount: segments.rejectedItemsCount,
      message: 'Upload new prescriptions to proceed with these medications',
      type: 'rejected'
    },
    expired: { // NEW: Add expired tab summary
      title: 'Expired Prescriptions Summary',
      items: segments.expiredPrescription,
      totalPrice: segments.expiredPrice,
      itemCount: segments.expiredItemsCount,
      message: 'Your prescriptions have expired. Please upload new prescriptions to continue',
      type: 'expired'
    }
  };

  return summaries[activeTab] || {
    title: 'Prescription Medications Summary',
    items: [...segments.needsPrescription, ...segments.pendingPrescription, ...segments.rejectedPrescription, ...segments.expiredPrescription],
    totalPrice: segments.prescriptionPrice + segments.pendingPrice + segments.rejectedPrice + segments.expiredPrice,
    itemCount: segments.prescriptionItemsCount + segments.pendingItemsCount + segments.rejectedItemsCount + segments.expiredItemsCount,
    message: 'Upload prescriptions to proceed with these medications',
    type: 'prescription'
  };
}