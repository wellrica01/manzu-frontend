import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';


export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export function getGuestId() {
  if (typeof window !== 'undefined') {
    const id = localStorage.getItem('guestId') || uuidv4();
    localStorage.setItem('guestId', id);
    return id;
  }
  return uuidv4();
}

export const getStatusSummary = (items) => {
  const nonPrescription = items.filter((item) => !item.service.prescriptionRequired).length;
  const verified = items.filter(
    (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'verified')
  ).length;
  const pending = items.filter(
    (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'pending')
  ).length;
  const rejected = items.filter(
    (item) => item.service.prescriptionRequired && item.prescriptions?.some(p => p.status === 'rejected')
  ).length;
  const parts = [];
  if (nonPrescription) parts.push(`${nonPrescription} OTC`);
  if (verified) parts.push(`${verified} verified`);
  if (pending) parts.push(`${pending} pending`);
  if (rejected) parts.push(`${rejected} rejected`);
  return parts.length ? `Status: ${parts.join(', ')}` : 'No items';
};