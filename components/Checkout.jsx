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
import { Loader2, Upload, CheckCircle, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
          Checkout
        </h1>
        {error && (
          <Card
            className="bg-red-50/95 border border-red-100/50 rounded-2xl shadow-md mb-6 p-4 animate-in slide-in-from-top-10 duration-500"
            role="alert"
          >
            <p className="text-red-600 text-base font-medium">{error}</p>
          </Card>
        )}
        {pendingMessage && (
          <Card
            className="bg-green-50/95 border border-green-100/50 rounded-2xl shadow-md mb-6 p-4 animate-in slide-in-from-top-10 duration-500"
            role="alert"
          >
            <p className="text-green-700 text-base font-medium">{pendingMessage}</p>
          </Card>
        )}
        {cart.pharmacies.length === 0 && !error && !resumeOrderId ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Checkout Confirmation Dialog */}
            <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
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
                    Confirm Checkout
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-base text-gray-600 text-center font-medium">
                    You’re about to place an order for ₦{cart.totalPrice.toLocaleString()}.
                    {requiresUpload && prescriptionFile && (
                      <span>
                        {' '}A prescription file (<span className="font-semibold">{prescriptionFile.name}</span>) will be submitted.
                      </span>
                    )}
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowCheckoutDialog(false)}
                    className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                    aria-label="Review order"
                  >
                    Review Order
                  </Button>
                  <Button
                    onClick={confirmCheckout}
                    className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
                    disabled={loading}
                    aria-label="Confirm payment"
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                    Confirm Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Prescription Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
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
                    Prescription Uploaded
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-base text-gray-600 text-center font-medium">
                    Prescription file <span className="font-semibold text-gray-900">{prescriptionFile?.name}</span> uploaded successfully.
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrescriptionFile(null);
                      setShowUploadDialog(false);
                      fileInputRef.current.value = '';
                    }}
                    className="h-12 px-6 text-sm font-semibold rounded-full border-gray-200/50 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300"
                    aria-label="Upload another prescription"
                  >
                    Upload Another
                  </Button>
                  <Button
                    onClick={() => setShowUploadDialog(false)}
                    className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse transition-all duration-300"
                    aria-label="Continue checkout"
                  >
                    Continue Checkout
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
                        <Card
              className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="bg-primary/10 p-6 sm:p-8">
                <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                {cart.pharmacies.map((pharmacy) => (
                  <div key={pharmacy.pharmacy.id} className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {pharmacy.pharmacy.name}
                    </h3>
                    {pharmacy.items.map((item) => (
                      <div key={item.id} className="mb-4 mt-2">
                        <p className="text-gray-900 text-base font-medium truncate">{item.medication.displayName}</p>
                        <p className="text-gray-600 text-sm font-medium">Quantity: {item.quantity}</p>
                        <p className="text-gray-600 text-sm font-medium">Unit Price: ₦{item.price.toLocaleString()}</p>
                        <p className="text-gray-600 text-sm font-medium">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                        {item.medication.prescriptionRequired && (
                          <p className="text-gray-600 text-sm font-medium">Prescription Required</p>
                        )}
                      </div>
                    ))}
                    <p className="text-gray-900 text-base font-semibold">
                      Subtotal: ₦{pharmacy.subtotal.toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="text-right">
                  <p className="text-xl font-extrabold text-primary">
                    Total: ₦{cart.totalPrice.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card
              className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
              <CardHeader className="bg-primary/10 p-6 sm:p-8">
                <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleCheckout} className="space-y-6" role="form" aria-labelledby="checkout-form-title">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      className="mt-2 h-12 text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleInputChange}
                      className="mt-2 h-12 text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      className="mt-2 h-12 text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                      required
                      aria-required="true"
                    />
                  </div>
                  {requiresUpload && !resumeOrderId && (
                    <div>
                      <Label htmlFor="prescription" className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Prescription File (PDF, JPEG, PNG)
                      </Label>
                      <div
                        className="mt-3 p-6 border-2 border-dashed border-gray-200/50 rounded-2xl text-center bg-white/95 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300"
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
                        <div className="flex flex-col items-center gap-3">
                          <Upload
                            className="h-8 w-8 text-primary/70 transition-transform duration-300 group-hover:scale-110"
                            aria-hidden="true"
                          />
                          {prescriptionFile ? (
                            <div className="flex items-center gap-3 animate-in fade-in-20 duration-300">
                              <FileIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                              <span className="text-base font-medium text-gray-900 truncate max-w-[200px]">
                                {prescriptionFile.name}
                              </span>
                            </div>
                          ) : (
                            <p className="text-base text-gray-600 font-medium">
                              Drag your prescription here or{' '}
                              <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="text-primary hover:text-primary/80 font-semibold underline transition-colors duration-200"
                                aria-label="Browse for prescription file"
                              >
                                browse
                              </button>
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Supports .pdf, .jpg, .jpeg, .png
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Delivery Method
                    </Label>
                    <RadioGroup
                      value={form.deliveryMethod}
                      onValueChange={handleDeliveryMethodChange}
                      className="flex flex-col sm:flex-row gap-6 mt-3"
                      aria-label="Delivery method"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pickup" id="pickup" className="h-5 w-5" />
                        <Label htmlFor="pickup" className="text-gray-900 text-base font-medium">Pickup</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="delivery" id="delivery" className="h-5 w-5" />
                        <Label htmlFor="delivery" className="text-gray-900 text-base font-medium">Delivery</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {form.deliveryMethod === 'delivery' && (
                    <div>
                      <Label htmlFor="address" className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Delivery Address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={form.address}
                        onChange={handleInputChange}
                        className="mt-2 h-12 text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                        required
                        aria-required="true"
                      />
                    </div>
                  )}
                  {form.deliveryMethod === 'pickup' && cart.pharmacies.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Pickup Addresses
                      </Label>
                      <div className="mt-3 space-y-3">
                        {getUniquePharmacyAddresses().length > 0 ? (
                          getUniquePharmacyAddresses().map((pharmacy, index) => (
                            <p key={index} className="text-gray-600 text-base font-medium truncate">
                              <span className="font-semibold text-gray-900">{pharmacy.name}</span>: {pharmacy.address}
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-600 text-base font-medium">Pharmacy address not available</p>
                        )}
                      </div>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-14 px-8 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300"
                    disabled={loading}
                    aria-label="Submit checkout"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </span>
                    ) : requiresUpload ? (
                      'Submit Prescription and Pay OTC'
                    ) : (
                      'Pay with Paystack'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  </>
);
}