'use client';
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const listeners = new Set();

export function useCart() {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cart, setCart] = useState({ pharmacies: [], totalPrice: 0 });
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', guestId);
  }

  const notifyListeners = useCallback(() => {
    listeners.forEach(listener => listener(cartItemCount, cart));
  }, [cartItemCount, cart]);

  const fetchCart = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      const totalItems = data.pharmacies?.reduce((sum, pharmacy) => sum + pharmacy.items.length, 0) || 0;
      setCartItemCount(totalItems);
      setCart(data);
      notifyListeners();
      return data;
    } catch (err) {
      console.error('Fetch cart error:', err);
      return null;
    }
  }, [guestId, notifyListeners]);

  const subscribe = useCallback((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return { cartItemCount, cart, fetchCart, guestId, subscribe };
}