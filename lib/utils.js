import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Custom event name for guestId changes
export const GUEST_ID_CHANGED_EVENT = 'guestIdChanged';

export function getGuestId() {
  if (typeof window !== 'undefined') {
    const id = localStorage.getItem('guestId') || uuidv4();
    localStorage.setItem('guestId', id);
    return id;
  }
  return uuidv4();
}

// New function to update guestId and notify listeners
export function setGuestId(newGuestId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('guestId', newGuestId);
    // Dispatch custom event so useCart can react to the change
    window.dispatchEvent(new CustomEvent(GUEST_ID_CHANGED_EVENT, { detail: newGuestId }));
  }
}