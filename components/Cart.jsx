'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Loader2 } from 'lucide-react';

export default function Cart() {
  const [cart, setCart] = useState({ pharmacies: [], totalPrice: 0 });
  const [error, setError] = useState(null);
  const router = useRouter();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || uuidv4() : uuidv4();

  if (typeof window !== 'undefined' && !localStorage.getItem('guestId')) {
    localStorage.setItem('guestId', guestId);
  }

  const fetchCart = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      const data = await response.json();
      setCart(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (orderItemId, newQuantity) => {
    if (!orderItemId) {
      alert('Error: Invalid item ID');
      return;
    }
    if (newQuantity < 1) return;
    try {
      const response = await fetch('http://localhost:5000/api/cart/update', {
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
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveItem = async (orderItemId) => {
    if (!orderItemId) {
      alert('Error: Invalid item ID');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/cart/remove/${orderItemId}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove item');
      }
      await fetchCart();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8 text-center fade-in">
          Your Cart
        </h1>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        {cart.pharmacies.length === 0 ? (
          <div className="card text-center py-10 fade-in">
            <p className="text-muted-foreground text-lg">
              Your cart is empty.{' '}
              <a href="/" className="text-primary hover:text-secondary">
                Start shopping
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {cart.pharmacies.map((pharmacy, index) => (
              <Card
                key={pharmacy.pharmacy.id}
                className="card card-hover fade-in"
                style={{ animationDelay: `${0.2 * index}s` }}
              >
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-2xl font-semibold text-primary">
                    {pharmacy.pharmacy.name}
                  </CardTitle>
                  <p className="text-muted-foreground">{pharmacy.pharmacy.address}</p>
                </CardHeader>
                <CardContent className="p-6">
                  {pharmacy.items.map((item) => (
                    <div key={item.id} className="border-b border-border py-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.medication.displayName}
                      </h3>
                      <p className="text-muted-foreground">
                        <strong>Category:</strong> {item.medication.category}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Prescription Required:</strong>{' '}
                        {item.medication.prescriptionRequired ? 'Yes' : 'No'}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Unit Price:</strong> ₦{item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 my-2">
                        <strong className="text-muted-foreground">Quantity:</strong>
                        <Button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-1 px-3"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          min="1"
                        />
                        <Button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-1 px-3"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-muted-foreground">
                        <strong>Item Total:</strong> ₦{calculateItemPrice(item).toLocaleString()}
                      </p>
                      <Button
                        className="bg-destructive hover:bg-destructive/90 text-white text-sm py-1 px-3 mt-2"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ))}
                  <p className="text-lg font-semibold text-primary mt-4">
                    Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            <div className="text-right mt-6">
              <p className="text-xl font-semibold text-primary">
                Total: ₦{cart.totalPrice.toLocaleString()}
              </p>
              <Button
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleCheckout}
                disabled={cart.pharmacies.length === 0}
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