'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Checkout() {
  const { orderId: resumeOrderId } = useParams();
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', deliveryMethod: 'pickup' });
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const router = useRouter();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;

  const fetchCart = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Checkout cart data:', data);
      setCart(data);
    } catch (err) {
      console.error('Fetch cart error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (guestId) {
      fetchCart();
    } else {
      setError('Guest ID not found');
    }
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (resumeOrderId && guestId && form.email) {
      setPendingMessage('Resuming checkout...');
      handleResumeCheckout(resumeOrderId);
    }
  }, [resumeOrderId, guestId, form.email]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPrescriptionFile(e.target.files[0]);
  };

  const handleDeliveryMethodChange = (value) => {
    setForm({ ...form, deliveryMethod: value, address: value === 'pickup' ? '' : form.address });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError(null);
    setPendingMessage(null);

    // Validate form inputs
    if (!form.name || !form.email || !form.phone || !form.deliveryMethod) {
      setError('All fields are required');
      return;
    }
    if (form.deliveryMethod === 'delivery' && !form.address) {
      setError('Address is required for delivery');
      return;
    }
    if (cart.items.length === 0 || cart.totalPrice <= 0) {
      setError('Cart is empty or invalid');
      return;
    }
    if (form.deliveryMethod === 'pickup') {
      const hasValidAddresses = cart.items.every(item => item.pharmacy?.address);
      if (!hasValidAddresses) {
        setError('One or more pharmacy addresses are not available for pickup');
        return;
      }
    }

    // Check if prescription is required
    const needsPrescription = cart.items.some(item => item.medication.prescriptionRequired);
    if (needsPrescription && !prescriptionFile) {
      setError('A prescription file is required for one or more medications');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('deliveryMethod', form.deliveryMethod);
      if (form.address) {
        formData.append('address', form.address);
      }
      if (prescriptionFile) {
        formData.append('prescription', prescriptionFile);
      }

      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'x-guest-id': guestId },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Checkout failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'pending_prescription') {
        setPendingMessage(
          'Your prescription has been submitted for verification. You will be notified when it is verified to complete your payment.'
        );
        setLoading(false);
        return;
      }

      if (!data.paymentReference || !data.paymentUrl) {
        throw new Error('Payment reference or URL not provided');
      }

      console.log('Paystack transaction params:', {
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: cart.totalPrice * 100,
        ref: data.paymentReference,
      });

      if (typeof window.PaystackPop === 'undefined') {
        throw new Error('PaystackPop not loaded');
      }

      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: cart.totalPrice * 100,
        ref: data.paymentReference,
        onSuccess: (transaction) => {
          console.log('Payment successful:', transaction);
          router.push('/confirmation?reference=' + transaction.reference);
          setLoading(false);
        },
        onCancel: () => {
          console.log('Payment cancelled');
          setError('Payment cancelled');
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Checkout error:', { message: err.message, stack: err.stack });
      setError(err.message || 'Invalid transaction parameters');
      setLoading(false);
    }
  };

  const handleResumeCheckout = async (orderId) => {
    setError(null);
    setPendingMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/checkout/resume/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ email: form.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resume checkout failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.paymentReference || !data.paymentUrl) {
        throw new Error('Payment reference or URL not provided');
      }

      console.log('Paystack transaction params (resume):', {
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: cart.totalPrice * 100,
        ref: data.paymentReference,
      });

      if (typeof window.PaystackPop === 'undefined') {
        throw new Error('PaystackPop not loaded');
      }

      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: cart.totalPrice * 100,
        ref: data.paymentReference,
        onSuccess: (transaction) => {
          console.log('Payment successful:', transaction);
          router.push('/confirmation?reference=' + transaction.reference);
          setLoading(false);
        },
        onCancel: () => {
          console.log('Payment cancelled');
          setError('Payment cancelled');
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Resume checkout error:', { message: err.message, stack: err.stack });
      setError(err.message || 'Failed to resume checkout');
      setLoading(false);
    }
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = () => {
    const addresses = [];
    const seen = new Set();
    cart.items.forEach(item => {
      const address = item.pharmacy?.address;
      const pharmacyName = item.pharmacy?.name;
      if (address && pharmacyName && !seen.has(address)) {
        addresses.push({ name: pharmacyName, address });
        seen.add(address);
      }
    });
    return addresses;
  };

  const needsPrescription = cart.items.some(item => item.medication.prescriptionRequired);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-indigo-800 mb-4">Checkout</h1>
      {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
      {pendingMessage && (
        <p className="text-green-600 font-medium mb-4">{pendingMessage}</p>
      )}
      {cart.items.length === 0 && !error && !resumeOrderId ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-indigo-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-indigo-800">User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="border-indigo-300"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleInputChange}
                    className="border-indigo-300"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    className="border-indigo-300"
                    required
                  />
                </div>
                {needsPrescription && !resumeOrderId && (
                  <div>
                    <Label htmlFor="prescription" className="text-gray-700">Prescription File (PDF, JPEG, PNG)</Label>
                    <Input
                      id="prescription"
                      name="prescription"
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="border-indigo-300"
                      required
                    />
                  </div>
                )}
                <div>
                  <Label className="text-gray-700">Delivery Method</Label>
                  <RadioGroup
                    value={form.deliveryMethod}
                    onValueChange={handleDeliveryMethodChange}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup">Pickup</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery">Delivery</Label>
                    </div>
                  </RadioGroup>
                </div>
                {form.deliveryMethod === 'delivery' && (
                  <div>
                    <Label htmlFor="address" className="text-gray-700">Delivery Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      className="border-indigo-300"
                      required
                    />
                  </div>
                )}
                {form.deliveryMethod === 'pickup' && cart.items.length > 0 && (
                  <div>
                    <Label className="text-gray-700">Pickup Addresses</Label>
                    <div className="mt-2 space-y-2">
                      {getUniquePharmacyAddresses().length > 0 ? (
                        getUniquePharmacyAddresses().map((pharmacy, index) => (
                          <p key={index} className="text-gray-600">
                            {pharmacy.name}: {pharmacy.address}
                          </p>
                        ))
                      ) : (
                        <p className="text-gray-600">Pharmacy address not available</p>
                      )}
                    </div>
                  </div>
                )}
                {!resumeOrderId && (
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : needsPrescription ? 'Submit Prescription' : 'Pay with Paystack'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
          <Card className="border-indigo-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-indigo-800">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.items.map((item) => (
                <div key={item.id} className="mb-4">
                  <p className="text-gray-700 font-medium">{item.medication.displayName}</p>
                  <p className="text-gray-600">Pharmacy: {item.pharmacy.name}</p>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-gray-600">Unit Price: ₦{item.price}</p>
                  <p className="text-gray-600">Total: ₦{calculateItemPrice(item)}</p>
                  {item.medication.prescriptionRequired && (
                    <p className="text-gray-600 font-medium">Prescription Required</p>
                  )}
                </div>
              ))}
              <div className="text-right">
                <p className="text-xl font-semibold text-indigo-800">
                  Total: ₦{cart.totalPrice}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}