'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import dynamic from 'next/dynamic';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyCart from './EmptyCart';
import RemoveItemDialog from './RemoveItemDialog';
import QuantityUpdateDialog from './QuantityUpdateDialog';
import PharmacyCartCard from './PharmacyCartCard';
import CartSummary from './CartSummary';

export default function Cart() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [isFetched, setIsFetched] = useState(false); // Track fetch completion
  const router = useRouter();
  const { cart, fetchCart, guestId } = useCart();

  useEffect(() => {
    async function loadCart() {
      try {
        await fetchCart();
      } catch (err) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setIsFetched(true);
      }
    }
    loadCart();
  }, [fetchCart]);

  const handleQuantityChange = async (orderItemId, newQuantity, itemName) => {
    if (!orderItemId) {
      toast.error('Invalid item ID', { duration: 4000 });
      return;
    }
    if (newQuantity < 1) return;
    setIsUpdating(prev => ({ ...prev, [orderItemId]: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ orderItemId, quantity: newQuantity }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update quantity');
      }
      await fetchCart();
      setQuantityUpdate({ id: orderItemId, name: itemName, quantity: newQuantity });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'update_cart_quantity', { orderItemId, quantity: newQuantity });
      }
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsUpdating(prev => ({ ...prev, [orderItemId]: false }));
    }
  };

  const handleRemoveItem = async () => {
    if (!removeItem?.id) {
      toast.error('Invalid item ID', { duration: 4000 });
      return;
    }
    setIsUpdating(prev => ({ ...prev, [removeItem.id]: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/remove/${removeItem.id}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove item');
      }
      await fetchCart();
      setRemoveItem(null);
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_cart', { orderItemId: removeItem.id });
      }
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setIsUpdating(prev => ({ ...prev, [removeItem.id]: false }));
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
          Your Cart
        </h1>
        <ErrorMessage error={error} />
        {!isFetched ? null : cart.pharmacies.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="space-y-6">
            <RemoveItemDialog
              removeItem={removeItem}
              setRemoveItem={setRemoveItem}
              handleRemoveItem={handleRemoveItem}
              isUpdating={isUpdating}
            />
            <QuantityUpdateDialog
              quantityUpdate={quantityUpdate}
              setQuantityUpdate={setQuantityUpdate}
              handleCheckout={handleCheckout}
            />
            {cart.pharmacies.map((pharmacy, index) => (
              <PharmacyCartCard
                key={pharmacy.pharmacy.id}
                pharmacy={pharmacy}
                handleQuantityChange={handleQuantityChange}
                setRemoveItem={setRemoveItem}
                isUpdating={isUpdating}
                calculateItemPrice={calculateItemPrice}
              />
            ))}
            <CartSummary cart={cart} handleCheckout={handleCheckout} />
          </div>
        )}
      </div>
    </div>
  );
}