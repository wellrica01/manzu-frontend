'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Cart() {
  const [cart, setCart] = useState({ pharmacies: [], totalPrice: 0 });
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const router = useRouter();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', guestId);
  }

  const fetchCart = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      const data = await response.json();
      setCart(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

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
      // Track quantity update
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
      // Track item removal
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-6 text-center">
          Your Cart
        </h1>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-3 mb-4">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}
        {cart.pharmacies.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-muted-foreground text-base">
              Your cart is empty.{' '}
              <a href="/" className="text-primary hover:text-secondary">
                Start shopping
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Remove Item Dialog */}
            {removeItem && (
              <Dialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
                <DialogContent className="sm:max-w-md">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-primary">
                      Remove Item
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-foreground">
                      Are you sure you want to remove <span className="font-medium">{removeItem.name}</span> from your cart?
                    </p>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRemoveItem(null)}
                      className="w-full sm:w-auto"
                      aria-label="Cancel remove item"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRemoveItem}
                      className="w-full sm:w-auto"
                      disabled={isUpdating[removeItem.id]}
                      aria-label="Confirm remove item"
                    >
                      {isUpdating[removeItem.id] && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Remove
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {/* Quantity Update Dialog */}
            {quantityUpdate && (
              <Dialog open={!!quantityUpdate} onOpenChange={() => setQuantityUpdate(null)}>
                <DialogContent className="sm:max-w-md">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-primary">
                      Quantity Updated
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-foreground">
                      Quantity for <span className="font-medium">{quantityUpdate.name}</span> updated to {quantityUpdate.quantity}.
                    </p>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setQuantityUpdate(null)}
                      className="w-full sm:w-auto"
                      aria-label="Continue shopping"
                    >
                      Continue Shopping
                    </Button>
                    <Button
                      onClick={handleCheckout}
                      className="w-full sm:w-auto"
                      aria-label="Proceed to checkout"
                    >
                      Proceed to Checkout
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {cart.pharmacies.map((pharmacy, index) => (
              <Card
                key={pharmacy.pharmacy.id}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl font-semibold text-primary truncate">
                    {pharmacy.pharmacy.name}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm truncate">{pharmacy.pharmacy.address}</p>
                </CardHeader>
                <CardContent className="p-4">
                  {pharmacy.items.map((item) => (
                    <div key={item.id} className="border-b border-border py-3">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {item.medication.displayName}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        <strong>Category:</strong> {item.medication.category}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        <strong>Prescription Required:</strong>{' '}
                        {item.medication.prescriptionRequired ? 'Yes' : 'No'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        <strong>Unit Price:</strong> ₦{item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 my-2">
                        <strong className="text-muted-foreground text-sm">Quantity:</strong>
                        <Button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-4"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.medication.displayName)}
                          disabled={item.quantity <= 1 || isUpdating[item.id]}
                          aria-label={`Decrease quantity for ${item.medication.displayName}`}
                        >
                          {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '-'}
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, item.medication.displayName)}
                          className="w-16 text-center text-sm"
                          min="1"
                          disabled={isUpdating[item.id]}
                          aria-label={`Quantity for ${item.medication.displayName}`}
                        />
                        <Button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-4"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.medication.displayName)}
                          disabled={isUpdating[item.id]}
                          aria-label={`Increase quantity for ${item.medication.displayName}`}
                        >
                          {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '+'}
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        <strong>Item Total:</strong> ₦{calculateItemPrice(item).toLocaleString()}
                      </p>
                      <Button
                        className="bg-destructive hover:bg-destructive/90 text-white text-sm py-2 px-4 mt-2"
                        onClick={() => setRemoveItem({ id: item.id, name: item.medication.displayName })}
                        disabled={isUpdating[item.id]}
                        aria-label={`Remove ${item.medication.displayName} from cart`}
                      >
                        {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Remove
                      </Button>
                    </div>
                  ))}
                  <p className="text-base font-semibold text-primary mt-3">
                    Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            <div className="text-right mt-4">
              <p className="text-lg font-semibold text-primary">
                Total: ₦{cart.totalPrice.toLocaleString()}
              </p>
              <Button
                className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
                onClick={handleCheckout}
                disabled={cart.pharmacies.length === 0}
                aria-label="Proceed to checkout"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}