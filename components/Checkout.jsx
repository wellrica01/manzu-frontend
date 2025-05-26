'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Upload } from 'lucide-react';

export default function Checkout() {
  const { orderId: resumeOrderId } = useParams();
  const [cart, setCart] = useState({ pharmacies: [], totalPrice: 0, orderItems: [] });
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', deliveryMethod: 'pickup' });
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [requiresUpload, setRequiresUpload] = useState(false);
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

    const orderItems = data.pharmacies.flatMap(pharmacy => pharmacy.items);
    console.log('Order items:', orderItems);

    setCart({
      pharmacies: data.pharmacies,
      orderItems,
      prescriptionId: data.prescriptionId,
      totalPrice: data.totalPrice,
    });

    // Validate prescription for prescription-required items
    const prescriptionRequiredIds = orderItems
      .filter(item => item.medication?.prescriptionRequired)
      .map(item => item.pharmacyMedicationMedicationId); // Use pharmacyMedicationMedicationId
    console.log('Prescription required IDs:', prescriptionRequiredIds);
    if (prescriptionRequiredIds.length > 0) {
      const validateResponse = await fetch(
        `http://localhost:5000/api/checkout/prescription/validate?patientIdentifier=${guestId}&medicationIds=${prescriptionRequiredIds.join(',')}`
      );
      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(`Failed to validate prescription: ${errorData.message || validateResponse.statusText}`);
      }
      const { requiresUpload } = await validateResponse.json();
      setRequiresUpload(requiresUpload);
    } else {
      setRequiresUpload(false);
    }
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

  const handleResumeSession = async (e) => {
    e.preventDefault();
    const { email, phone, sessionId } = form; // Reuse form fields or create a separate resume form
    try {
      const response = await fetch('http://localhost:5000/api/session/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, checkoutSessionId: sessionId }),
      });
      if (!response.ok) throw new Error('Session not found');
      const { guestId } = await response.json();
      localStorage.setItem('guestId', guestId);
      await fetchCart();
    } catch (err) {
      setError(err.message);
    }
  };

const handleCheckout = async (e) => {
  e.preventDefault();
  setError(null);
  setPendingMessage(null);

  if (!form.name || !form.email || !form.phone || !form.deliveryMethod) {
    setError('All fields are required');
    return;
  }
  if (form.deliveryMethod === 'delivery' && !form.address) {
    setError('Address is required for delivery');
    return;
  }
  if (cart.pharmacies.length === 0 || cart.totalPrice <= 0) {
    setError('Cart is empty or invalid');
    return;
  }
  if (form.deliveryMethod === 'pickup') {
    const hasValidAddresses = cart.pharmacies.every(pharmacy => pharmacy.pharmacy.address);
    if (!hasValidAddresses) {
      setError('One or more pharmacy addresses are not available for pickup');
      return;
    }
  }

  if (requiresUpload && !prescriptionFile) {
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
    if (requiresUpload && prescriptionFile) {
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
    console.log('Checkout response:', data);

    // Check for order types
    const hasPrescriptionOrders = data.orders.some(order => order.status === 'pending_prescription');
    const hasPayableOrders = data.paymentReference && data.paymentUrl;

    // Set message based on order types
    let message = '';
    if (hasPayableOrders && hasPrescriptionOrders) {
      message = 'Proceeding to payment for OTC and verified prescription items. Unverified prescription items are awaiting verification.';
    } else if (hasPayableOrders) {
      message = 'Proceeding to payment for your order.';
    } else if (hasPrescriptionOrders) {
      message = 'Your prescription has been submitted for verification. You will be notified when it is verified to complete your payment.';
    }

    setPendingMessage(message);

    // Initiate payment for payable orders (OTC or verified prescription)
    if (hasPayableOrders) {
      if (typeof window.PaystackPop === 'undefined') {
        throw new Error('PaystackPop not loaded');
      }

      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: data.orders
          .filter(order => order.status === 'pending')
          .reduce((sum, order) => sum + order.totalPrice, 0) * 100,
        ref: data.paymentReference,
        onSuccess: (transaction) => {
          console.log('Payment successful:', transaction);
          router.push(`/confirmation?reference=${transaction.reference}&session=${data.checkoutSessionId}`);
          setLoading(false);
        },
        onCancel: () => {
          console.log('Payment cancelled');
          setError('Payment cancelled');
          setLoading(false);
        },
      });
    } else {
      setLoading(false);
    }
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

      if (typeof window.PaystackPop === 'undefined') {
        throw new Error('PaystackPop not loaded');
      }

      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: data.orders
          ? data.orders.reduce((sum, order) => sum + order.totalPrice, 0) * 100
          : cart.totalPrice * 100, // Fallback for resume case
        ref: data.paymentReference,
        onSuccess: (transaction) => {
          console.log('Payment successful:', transaction);
          router.push(`/confirmation?reference=${transaction.reference}&session=${data.checkoutSessionId}`);
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
    cart.pharmacies.forEach(pharmacy => {
      const address = pharmacy.pharmacy.address;
      const pharmacyName = pharmacy.pharmacy.name;
      if (address && pharmacyName && !seen.has(address)) {
        addresses.push({ name: pharmacyName, address });
        seen.add(address);
      }
    });
    return addresses;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8 text-center fade-in">
          Checkout
        </h1>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        {pendingMessage && (
          <div className="card bg-green-50 border-l-4 border-green-400 p-4 mb-6 fade-in">
            <p className="text-green-700 font-medium">{pendingMessage}</p>
          </div>
        )}
        {cart.pharmacies.length === 0 && !error && !resumeOrderId ? (
          <div className="card text-center py-10 fade-in">
            <p className="text-muted-foreground text-lg">
              Your cart is empty.{' '}
              <a href="/" className="text-primary hover:text-secondary">
                Start shopping
              </a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="card card-hover fade-in">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-semibold text-primary">
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCheckout} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-primary font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-primary font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-primary font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  {requiresUpload && !resumeOrderId && (
                    <div>
                      <Label htmlFor="prescription" className="text-primary font-medium">
                        Prescription File (PDF, JPEG, PNG)
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors duration-300">
                        <Input
                          id="prescription"
                          name="prescription"
                          type="file"
                          accept=".pdf,image/jpeg,image/png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-secondary mb-2" aria-hidden="true" />
                          {prescriptionFile ? (
                            <p className="text-foreground">{prescriptionFile.name}</p>
                          ) : (
                            <p className="text-muted-foreground">
                              Drag your prescription here or{' '}
                              <button
                                type="button"
                                onClick={() => document.getElementById('prescription').click()}
                                className="text-primary hover:text-secondary font-medium"
                              >
                                browse
                              </button>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-primary font-medium">Delivery Method</Label>
                    <RadioGroup
                      value={form.deliveryMethod}
                      onValueChange={handleDeliveryMethodChange}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="text-foreground">Pickup</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="text-foreground">Delivery</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {form.deliveryMethod === 'delivery' && (
                    <div>
                      <Label htmlFor="address" className="text-primary font-medium">
                        Delivery Address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={form.address}
                        onChange={handleInputChange}
                        className="mt-1"
                        required
                      />
                    </div>
                  )}
                  {form.deliveryMethod === 'pickup' && cart.pharmacies.length > 0 && (
                    <div>
                      <Label className="text-primary font-medium">Pickup Addresses</Label>
                      <div className="mt-2 space-y-2">
                        {getUniquePharmacyAddresses().length > 0 ? (
                          getUniquePharmacyAddresses().map((pharmacy, index) => (
                            <p key={index} className="text-muted-foreground">
                              {pharmacy.name}: {pharmacy.address}
                            </p>
                          ))
                        ) : (
                          <p className="text-muted-foreground">Pharmacy address not available</p>
                        )}
                      </div>
                    </div>
                  )}
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : requiresUpload ? (
                        'Submit Prescription and Pay OTC'
                      ) : (
                        'Pay with Paystack'
                      )}
                    </Button>
                </form>
              </CardContent>
            </Card>
            <Card className="card card-hover fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-semibold text-primary">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {cart.pharmacies.map((pharmacy) => (
                  <div key={pharmacy.pharmacy.id} className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">
                      {pharmacy.pharmacy.name}
                    </h3>
                    {pharmacy.items.map((item) => (
                      <div key={item.id} className="mb-4">
                        <p className="text-foreground font-medium">{item.medication.displayName}</p>
                        <p className="text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-muted-foreground">Unit Price: ₦{item.price.toLocaleString()}</p>
                        <p className="text-muted-foreground">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                        {item.medication.prescriptionRequired && (
                          <p className="text-muted-foreground font-medium">Prescription Required</p>
                        )}
                      </div>
                    ))}
                    <p className="text-foreground font-semibold">
                      Subtotal: ₦{pharmacy.subtotal.toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="text-right">
                  <p className="text-xl font-semibold text-primary">
                    Total: ₦{cart.totalPrice.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}