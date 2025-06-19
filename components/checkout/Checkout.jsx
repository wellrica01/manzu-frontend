'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyCart from '@/components/cart/EmptyCart';
import PendingMessage from './PendingMessage';
import CheckoutDialog from './CheckoutDialog';
import PrescriptionUploadDialog from './PrescriptionUploadDialog';
import CheckoutForm from './CheckoutForm';
import dynamic from 'next/dynamic';
const OrderSummary = dynamic(() => import('./OrderSummary'), { ssr: false });

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
    console.log('Checkout response:', data); // Debug log
    const hasPrescriptionOrders = data.orders.some(order => order.status === 'pending_prescription');
    const hasPayableOrders = data.paymentReferences && data.paymentReferences.length > 0 && data.paymentUrl;

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
        ref: data.transactionReference,
        onSuccess: (transaction) => {
          const primaryReference = data.paymentReferences[0];
          router.push(`/confirmation?reference=${primaryReference}&session=${data.checkoutSessionId}`);
          toast.success('Payment successful!', { duration: 4000 });
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
    console.log('Resume checkout response:', data); // Debug log
    if (!data.paymentReferences || !data.paymentReferences.length || !data.paymentUrl) {
      throw new Error('Payment references or URL not provided');
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
      ref: data.transactionReference,
      onSuccess: (transaction) => {
        const primaryReference = data.paymentReferences[0];
        router.push(`/confirmation?reference=${primaryReference}&session=${data.checkoutSessionId}`);
        toast.success('Payment successful!', { duration: 4000 });
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
          <ErrorMessage error={error} />
          <PendingMessage message={pendingMessage} />
          {cart.pharmacies.length === 0 && !error && !resumeOrderId ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CheckoutDialog
                showCheckoutDialog={showCheckoutDialog}
                setShowCheckoutDialog={setShowCheckoutDialog}
                cart={cart}
                requiresUpload={requiresUpload}
                prescriptionFile={prescriptionFile}
                confirmCheckout={confirmCheckout}
                loading={loading}
              />
              <PrescriptionUploadDialog
                showUploadDialog={showUploadDialog}
                setShowUploadDialog={setShowUploadDialog}
                prescriptionFile={prescriptionFile}
                setPrescriptionFile={setPrescriptionFile}
                fileInputRef={fileInputRef}
              />
              <OrderSummary cart={cart} calculateItemPrice={calculateItemPrice} />
              <CheckoutForm
                form={form}
                setForm={setForm}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                handleDeliveryMethodChange={handleDeliveryMethodChange}
                handleCheckout={handleCheckout}
                requiresUpload={requiresUpload}
                resumeOrderId={resumeOrderId}
                fileInputRef={fileInputRef}
                cart={cart}
                getUniquePharmacyAddresses={getUniquePharmacyAddresses}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}