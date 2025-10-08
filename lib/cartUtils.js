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

export function getCartType(segments) {
  const hasOTC = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
  const hasPrescription = segments.needsPrescription.length > 0;
  const hasVerified = segments.readyForCheckout.some(
    item => item.medication.prescriptionRequired && item.prescriptionStatus === PrescriptionStatus.VERIFIED
  );
  const hasPending = segments.pendingPrescription.length > 0;

  if (hasVerified && !hasOTC && !hasPrescription && !hasPending) {
    return 'verified_prescription_only';
  }
  if (hasOTC && hasPrescription) return 'mixed';
  if (hasOTC && !hasPrescription && !hasVerified) return 'otc_only';
  if (hasPrescription && !hasOTC && !hasVerified) return 'prescription_only';
  if (hasVerified && hasOTC) return 'mixed';
  if (hasVerified && hasPrescription) return 'mixed';
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
    }
  };

  return summaries[activeTab] || {
    title: 'Prescription Medications Summary',
    items: [...segments.needsPrescription, ...segments.pendingPrescription, ...segments.rejectedPrescription],
    totalPrice: segments.prescriptionPrice + segments.pendingPrice + segments.rejectedPrice,
    itemCount: segments.prescriptionItemsCount + segments.pendingItemsCount + segments.rejectedItemsCount,
    message: 'Upload prescriptions to proceed with these medications',
    type: 'prescription'
  };
}

