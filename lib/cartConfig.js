import { CheckCircle, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

export const TAB_CONFIG = {
  ready: {
    id: 'ready',
    label: 'Ready Medications',
    shortLabel: 'Ready',
    icon: CheckCircle,
    color: 'bg-[#1ABA7F]/10 text-[#1ABA7F]'
  },
  needs_prescription: {
    id: 'needs_prescription',
    label: 'Needs Prescription',
    shortLabel: 'Needs Rx',
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-700'
  },
  pending: {
    id: 'pending',
    label: 'Under Review',
    shortLabel: 'Review',
    icon: Clock,
    color: 'bg-blue-100 text-blue-700'
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected',
    shortLabel: 'Rejected',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700'
  }
};

export function getAvailableTabs(segments) {
  const tabs = [];
  
  if (segments.readyForCheckout.length > 0) {
    tabs.push({ ...TAB_CONFIG.ready, count: segments.readyItemsCount });
  }
  
  if (segments.needsPrescription.length > 0) {
    tabs.push({ ...TAB_CONFIG.needs_prescription, count: segments.prescriptionItemsCount });
  }
  
  if (segments.pendingPrescription.length > 0) {
    tabs.push({ ...TAB_CONFIG.pending, count: segments.pendingItemsCount });
  }
  
  if (segments.rejectedPrescription.length > 0) {
    tabs.push({ ...TAB_CONFIG.rejected, count: segments.rejectedItemsCount });
  }
  
  return tabs;
}