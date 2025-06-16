'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

export default function Cart() {
  const [error, setError] = useState(null);
  const [removeItem, setRemoveItem] = useState(null);
  const [quantityUpdate, setQuantityUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const router = useRouter();
  const { cart, fetchCart, guestId } = useCart();

  useEffect(() => {
    fetchCart();
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
      await fetchCart(); // Update cart count
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
      await fetchCart(); // Update cart count
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
      {error && (
        <Card
          className="bg-red-50/95 border border-red-100/50 rounded-2xl shadow-md mb-6 p-4 animate-in slide-in-from-top-10 duration-500"
          role="alert"
        >
          <p className="text-red-600 text-base font-medium">{error}</p>
        </Card>
      )}
      {cart.pharmacies.length === 0 ? (
        <Card
          className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md text-center py-12 animate-in slide-in-from-top-10 duration-500"
        >
          <p className="text-gray-600 text-lg font-medium">
            Your cart is empty.{' '}
            <Link href="/" className="text-primary hover:text-primary/80 font-semibold underline transition-colors duration-200">
              Start shopping
            </Link>
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Remove Item Dialog */}
          {removeItem && (
            <Dialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
              <DialogContent
                className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
              >
                <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
                <CheckCircle
                  className="h-10 w-10 text-green-500 mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]"
                  aria-hidden="true"
                />
                <DialogHeader>
                  <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
                    Remove Item
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-base text-gray-600 text-center font-medium">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-gray-900">{removeItem.name}</span> from your cart?
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setRemoveItem(null)}
                    className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                    aria-label="Cancel remove item"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRemoveItem}
                    className="h-12 px-6 text-sm font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
                    disabled={isUpdating[removeItem.id]}
                    aria-label="Confirm remove item"
                  >
                    {isUpdating[removeItem.id] && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                    Remove
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {/* Quantity Update Dialog */}
          {quantityUpdate && (
            <Dialog open={!!quantityUpdate} onOpenChange={() => setQuantityUpdate(null)}>
              <DialogContent
                className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-10 fade-in-20 duration-300"
              >
                <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
                <CheckCircle
                  className="h-10 w-10 text-green-500 mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]"
                  aria-hidden="true"
                />
                <DialogHeader>
                  <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
                    Quantity Updated
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-base text-gray-600 text-center font-medium">
                    Quantity for{' '}
                    <span className="font-semibold text-gray-900">{quantityUpdate.name}</span> updated to {quantityUpdate.quantity}.
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setQuantityUpdate(null)}
                    className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                    aria-label="Continue shopping"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
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
              className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="bg-primary/10 p-6 sm:p-8">
                <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary truncate">
                  {pharmacy.pharmacy.name}
                </CardTitle>
                <p className="text-gray-600 text-base font-medium truncate">{pharmacy.pharmacy.address}</p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-4">
                {pharmacy.items.map((item) => (
                  <div key={item.id} className="border-b border-gray-200/50 py-4 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.medication.displayName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-gray-600 text-sm font-medium">
                      <p>
                        <strong>Category:</strong> {item.medication.category}
                      </p>
                      <p>
                        <strong>Prescription:</strong>{' '}
                        {item.medication.prescriptionRequired ? 'Yes' : 'No'}
                      </p>
                      <p>
                        <strong>Unit Price:</strong> ₦{item.price.toLocaleString()}
                      </p>
                      <p>
                        <strong>Item Total:</strong> ₦{calculateItemPrice(item).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          className="h-10 w-10 rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
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
                          className="w-16 h-10 text-center text-base font-medium rounded-xl border-gray-200/50 bg-white/95 focus:border-primary/50 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                          min="1"
                          disabled={isUpdating[item.id]}
                          aria-label={`Quantity for ${item.medication.displayName}`}
                        />
                        <Button
                          className="h-10 w-10 rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.medication.displayName)}
                          disabled={isUpdating[item.id]}
                          aria-label={`Increase quantity for ${item.medication.displayName}`}
                        >
                          {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : '+'}
                        </Button>
                      </div>
                      <Button
                        className="h-10 px-4 rounded-full bg-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all duration-300"
                        onClick={() => setRemoveItem({ id: item.id, name: item.medication.displayName })}
                        disabled={isUpdating[item.id]}
                        aria-label={`Remove ${item.medication.displayName} from cart`}
                      >
                        {isUpdating[item.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <p className="text-lg font-semibold text-primary mt-4">
                  Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
          <div className="text-right mt-6">
            <p className="text-xl font-extrabold text-primary mb-4">
              Total: ₦{cart.totalPrice.toLocaleString()}
            </p>
            <Button
              className="h-12 px-8 text-lg font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300"
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