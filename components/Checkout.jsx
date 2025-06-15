'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function Checkout() {
  const { orderId: resumeOrderId } = useParams();
  const [cart, setCart] = useState({ pharmacies: [], totalPrice: 0, orderItems: [] });
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', deliveryMethod: 'pickup' });
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [requiresUpload, setRequiresUpload] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('guestId');
      if (!id) {
        id = uuidv4();
        localStorage.setItem('guestId', id);
      }
      setPatientIdentifier(id);
    }
  }, []);

  const fetchCart = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        headers: { 'x-guest-id': patientIdentifier },
      });
      if (!response.ok) throw new Error(`Failed to fetch cart: ${response.statusText}`);
      const data = await response.json();
      const orderItems = data.pharmacies.flatMap(pharmacy => pharmacy.items);
      setCart({ pharmacies: data.pharmacies, orderItems, prescriptionId: data.prescriptionId, totalPrice: data.totalPrice });

      const prescriptionRequiredIds = orderItems
        .filter(item => item.medication?.prescriptionRequired)
        .map(item => item.pharmacyMedicationMedicationId);

      if (prescriptionRequiredIds.length > 0) {
        const validateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/prescription/validate?patientIdentifier=${patientIdentifier}&medicationIds=${prescriptionRequiredIds.join(',')}`);
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
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
    }
  };

  useEffect(() => {
    if (patientIdentifier) {
      fetchCart();
    } else {
      setError('Guest ID not found');
      toast.error('Guest ID not found', { duration: 4000 });
    }
  }, [patientIdentifier]);

  useEffect(() => {
    if (resumeOrderId && patientIdentifier && form.email) {
      setPendingMessage('Resuming checkout...');
      handleResumeCheckout(resumeOrderId);
    }
  }, [resumeOrderId, patientIdentifier, form.email]);

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setPrescriptionFile(file);
      setShowUploadDialog(true);
    } else {
      toast.error('Please upload a valid PDF, JPG, or PNG file', { duration: 4000 });
    }
  };

  const handleDeliveryMethodChange = (value) => setForm({ ...form, deliveryMethod: value, address: value === 'pickup' ? '' : form.address });

  const handleResumeSession = async (e) => {
    e.preventDefault();
    const { email, phone, sessionId } = form;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/session/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, checkoutSessionId: sessionId }),
      });
      if (!response.ok) throw new Error('Session not found');
      const { patientIdentifier } = await response.json();
      localStorage.setItem('guestId', patientIdentifier);
      await fetchCart();
      toast.success('Session resumed successfully', { duration: 4000 });
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
    }
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.phone || !form.deliveryMethod) {
      return 'All fields are required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Invalid email address';
    }
    if (!/^\+?\d{10,15}$/.test(form.phone)) {
      return 'Invalid phone number (10-15 digits)';
    }
    if (form.deliveryMethod === 'delivery' && !form.address) {
      return 'Address is required for delivery';
    }
    if (cart.pharmacies.length === 0 || cart.totalPrice <= 0) {
      return 'Cart is empty or invalid';
    }
    if (form.deliveryMethod === 'pickup') {
      const hasValidAddresses = cart.pharmacies.every(pharmacy => pharmacy.pharmacy.address);
      if (!hasValidAddresses) {
        return 'One or more pharmacy addresses are not available for pickup';
      }
    }
    if (requiresUpload && !prescriptionFile) {
      return 'A prescription file is required for one or more medications';
    }
    return null;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError, { duration: 4000 });
      return;
    }
    setShowCheckoutDialog(true);
  };

  const confirmCheckout = async () => {
    setError(null);
    setPendingMessage(null);
    setLoading(true);
    setShowCheckoutDialog(false);
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'x-guest-id': patientIdentifier },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Checkout failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const hasPrescriptionOrders = data.orders.some(order => order.status === 'pending_prescription');
      const hasPayableOrders = data.paymentReference && data.paymentUrl;

      let message = '';
      if (hasPayableOrders && hasPrescriptionOrders) {
        message = 'Proceeding to payment for OTC and verified prescription items. Unverified prescription items are awaiting verification.';
      } else if (hasPayableOrders) {
        message = 'Proceeding to payment for your order.';
      } else if (hasPrescriptionOrders) {
        message = 'Your prescription has been submitted for verification. You will be notified when it is verified to complete your payment.';
      }

      setPendingMessage(message);

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
            router.push(`/confirmation?reference=${transaction.reference}&session=${data.checkoutSessionId}`);
            toast.success('Payment successful!', { duration: 4000 });
            // Track checkout
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'checkout_complete', { transactionId: transaction.reference });
            }
          },
          onCancel: () => {
            setError('Payment cancelled');
            toast.error('Payment cancelled', { duration: 4000 });
          },
        });
      }
    } catch (err) {
      setError(err.message || 'Invalid transaction parameters');
      toast.error(err.message || 'Invalid transaction parameters', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeCheckout = async (orderId) => {
    setError(null);
    setPendingMessage(null);
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/resume/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': patientIdentifier,
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
          : cart.totalPrice * 100,
        ref: data.paymentReference,
        onSuccess: (transaction) => {
          router.push(`/confirmation?reference=${transaction.reference}&session=${data.checkoutSessionId}`);
          toast.success('Payment successful!', { duration: 4000 });
          // Track resume checkout
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'resume_checkout_complete', { transactionId: transaction.reference });
          }
        },
        onCancel: () => {
          setError('Payment cancelled');
          toast.error('Payment cancelled', { duration: 4000 });
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to resume checkout');
      toast.error(err.message || 'Failed to resume checkout', { duration: 4000 });
    } finally {
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
    <>
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onError={() => toast.error('Failed to load Paystack', { duration: 4000 })}
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-6 text-center">
            Checkout
          </h1>
          {error && (
            <div className="card bg-destructive/10 border-l-4 border-destructive p-3 mb-4">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}
          {pendingMessage && (
            <div className="card bg-green-50 border-l-4 border-green-400 p-3 mb-4">
              <p className="text-green-700 text-sm font-medium">{pendingMessage}</p>
            </div>
          )}
          {cart.pharmacies.length === 0 && !error && !resumeOrderId ? (
            <div className="card text-center py-8">
              <p className="text-muted-foreground text-base">
                Your cart is empty.{' '}
                <a href="/" className="text-primary hover:text-secondary">
                  Start shopping
                </a>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {/* Checkout Confirmation Dialog */}
              <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                <DialogContent className="sm:max-w-md">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-primary">
                      Confirm Checkout
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-foreground">
                      You’re about to place an order for ₦{cart.totalPrice.toLocaleString()}.
                      {requiresUpload && prescriptionFile && (
                        <> A prescription file ({prescriptionFile.name}) will be submitted.</>
                      )}
                    </p>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCheckoutDialog(false)}
                      className="w-full sm:w-auto"
                      aria-label="Review order"
                    >
                      Review Order
                    </Button>
                    <Button
                      onClick={confirmCheckout}
                      className="w-full sm:w-auto"
                      disabled={loading}
                      aria-label="Confirm payment"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Confirm Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Prescription Upload Dialog */}
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="sm:max-w-md">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-primary">
                      Prescription Uploaded
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-foreground">
                      Prescription file <span className="font-medium">{prescriptionFile?.name}</span> uploaded successfully.
                    </p>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPrescriptionFile(null);
                        setShowUploadDialog(false);
                        fileInputRef.current.value = '';
                      }}
                      className="w-full sm:w-auto"
                      aria-label="Upload another prescription"
                    >
                      Upload Another
                    </Button>
                    <Button
                      onClick={() => setShowUploadDialog(false)}
                      className="w-full sm:w-auto"
                      aria-label="Continue checkout"
                    >
                      Continue Checkout
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl font-semibold text-primary">
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleCheckout} className="space-y-4" role="form" aria-labelledby="checkout-form-title">
                    <div>
                      <Label htmlFor="name" className="text-primary font-medium text-sm">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        className="mt-1 text-sm"
                        required
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-primary font-medium text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleInputChange}
                        className="mt-1 text-sm"
                        required
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-primary font-medium text-sm">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleInputChange}
                        className="mt-1 text-sm"
                        required
                        aria-required="true"
                      />
                    </div>
                    {requiresUpload && !resumeOrderId && (
                      <div>
                        <Label htmlFor="prescription" className="text-primary font-medium text-sm">
                          Prescription File (PDF, JPEG, PNG)
                        </Label>
                        <div
                          className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors duration-300"
                          role="region"
                          aria-label="Drag and drop prescription file here"
                        >
                          <Input
                            id="prescription"
                            name="prescription"
                            type="file"
                            accept=".pdf,image/jpeg,image/png"
                            onChange={handleFileChange}
                            className="hidden"
                            ref={fileInputRef}
                          />
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-secondary mb-2" aria-hidden="true" />
                            {prescriptionFile ? (
                              <p className="text-foreground text-sm">{prescriptionFile.name}</p>
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                Drag your prescription here or{' '}
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current.click()}
                                  className="text-primary hover:text-secondary font-medium"
                                  aria-label="Browse for prescription file"
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
                      <Label className="text-primary font-medium text-sm">Delivery Method</Label>
                      <RadioGroup
                        value={form.deliveryMethod}
                        onValueChange={handleDeliveryMethodChange}
                        className="flex flex-col sm:flex-row gap-4 mt-2"
                        aria-label="Delivery method"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup" className="text-foreground text-sm">Pickup</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery" className="text-foreground text-sm">Delivery</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {form.deliveryMethod === 'delivery' && (
                      <div>
                        <Label htmlFor="address" className="text-primary font-medium text-sm">
                          Delivery Address
                        </Label>
                        <Input
                          id="address"
                          name="address"
                          value={form.address}
                          onChange={handleInputChange}
                          className="mt-1 text-sm"
                          required
                          aria-required="true"
                        />
                      </div>
                    )}
                    {form.deliveryMethod === 'pickup' && cart.pharmacies.length > 0 && (
                      <div>
                        <Label className="text-primary font-medium text-sm">Pickup Addresses</Label>
                        <div className="mt-2 space-y-2">
                          {getUniquePharmacyAddresses().length > 0 ? (
                            getUniquePharmacyAddresses().map((pharmacy, index) => (
                              <p key={index} className="text-muted-foreground text-sm truncate">
                                {pharmacy.name}: {pharmacy.address}
                              </p>
                            ))
                          ) : (
                            <p className="text-muted-foreground text-sm">Pharmacy address not available</p>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-6"
                      disabled={loading}
                      aria-label="Submit checkout"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl font-semibold text-primary">
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {cart.pharmacies.map((pharmacy) => (
                    <div key={pharmacy.pharmacy.id} className="mb-4">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {pharmacy.pharmacy.name}
                      </h3>
                      {pharmacy.items.map((item) => (
                        <div key={item.id} className="mb-3">
                          <p className="text-foreground text-sm font-medium truncate">{item.medication.displayName}</p>
                          <p className="text-muted-foreground text-sm">Quantity: {item.quantity}</p>
                          <p className="text-muted-foreground text-sm">Unit Price: ₦{item.price.toLocaleString()}</p>
                          <p className="text-muted-foreground text-sm">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                          {item.medication.prescriptionRequired && (
                            <p className="text-muted-foreground text-sm font-medium">Prescription Required</p>
                          )}
                        </div>
                      ))}
                      <p className="text-foreground text-sm font-semibold">
                        Subtotal: ₦{pharmacy.subtotal.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary">
                      Total: ₦{cart.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}