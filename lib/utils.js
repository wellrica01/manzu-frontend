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
