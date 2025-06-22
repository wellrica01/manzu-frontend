'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyCart from '@/components/lab/cart/EmptyCart';
import PendingMessage from './PendingMessage';
import CheckoutDialog from './CheckoutDialog';
import TestOrderUploadDialog from './TestOrderUploadDialog';
import CheckoutForm from './CheckoutForm';
import dynamic from 'next/dynamic';
import { useCart } from '@/hooks/useCart';
const BookingSummary = dynamic(() => import('./BookingSummary'), { ssr: false });

export default function Checkout() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', deliveryMethod: 'lab_visit' });
  const [testOrderFile, setTestOrderFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [requiresUpload, setRequiresUpload] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [testOrderStatuses, setTestOrderStatuses] = useState({});
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { cart, fetchCart, guestId, isPending, isError } = useCart();

  useEffect(() => {
    const id = getGuestId();
    console.log('Setting patientIdentifier:', id);
    setPatientIdentifier(id);
  }, []);

  useEffect(() => {
    async function loadCartAndTestOrders() {
      if (!patientIdentifier) {
        setError('Guest ID not found');
        toast.error('Guest ID not found', { duration: 4000 });
        setLoading(false);
        return;
      }

      try {
        setError(null);
        console.log('loadCartAndTestOrders: cart state:', { cart, isPending, isError });

        if (isPending) {
          console.log('Cart query is pending, waiting...');
          return;
        }

        if (isError) {
          throw new Error('Failed to fetch cart or invalid cart data');
        }

        if (!cart || !Array.isArray(cart.labs)) {
          throw new Error('Invalid cart data: missing or invalid labs');
        }

        const bookingItems = cart.labs
          .flatMap(lab => lab.items || [])
          .filter(item => item && item.test && item.labTestTestId);

        console.log('Processed bookingItems:', bookingItems);

        const orderRequiredIds = bookingItems
          .filter(item => item.test?.orderRequired)
          .map(item => item.labTestTestId.toString());

        console.log('Order required IDs:', orderRequiredIds);

        if (orderRequiredIds.length > 0) {
          const validateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/booking/test-order/validate?patientIdentifier=${patientIdentifier}&testIds=${orderRequiredIds.join(',')}`
          );
          if (!validateResponse.ok) {
            const errorData = await validateResponse.json();
            throw new Error(`Failed to validate test order: ${errorData.message || validateResponse.statusText}`);
          }
          const validateData = await validateResponse.json();
          console.log('Test order validate API response:', validateData);
          setRequiresUpload(validateData.requiresUpload);

          const statusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/test-order/status?patientIdentifier=${patientIdentifier}&testIds=${orderRequiredIds.join(',')}`,
            { headers: { 'x-guest-id': patientIdentifier } }
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('Test order statuses:', statusData);
            setTestOrderStatuses(statusData && typeof statusData === 'object' ? statusData : {});
            const allVerified = orderRequiredIds.every(
              id => (statusData[id] || 'none') === 'verified'
            );
            if (allVerified && validateData.requiresUpload) {
              console.log('All test orders verified, overriding requiresUpload to false');
              setRequiresUpload(false);
            } else if (!allVerified && !validateData.requiresUpload) {
              console.log('Some test orders unverified but API says no upload needed, setting requiresUpload to true');
              setRequiresUpload(true);
            }
          } else {
            console.warn('Test order status API failed:', statusResponse.statusText);
            setTestOrderStatuses(
              Object.fromEntries(orderRequiredIds.map(id => [id, 'none']))
            );
            setRequiresUpload(true);
          }
        } else {
          console.log('No test order required, setting requiresUpload to false');
          setRequiresUpload(false);
          setTestOrderStatuses({});
        }

        console.log('Final test order state:', { requiresUpload, testOrderStatuses });
      } catch (err) {
        console.error('Fetch cart error:', err.message);
        setError(mapErrorMessage(err.message));
        toast.error(mapErrorMessage(err.message), { duration: 4000 });
      } finally {
        setLoading(false);
      }
    }

    loadCartAndTestOrders();
  }, [patientIdentifier, cart, isPending, isError]);

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit', { duration: 4000 });
        return;
      }
      if (['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setTestOrderFile(file);
        setShowUploadDialog(true);
      } else {
        toast.error('Please upload a valid PDF, JPG, or PNG file', { duration: 4000 });
      }
    }
  };

  const handleDeliveryMethodChange = (value) => {
    setForm({ ...form, deliveryMethod: value, address: value === 'lab_visit' ? '' : form.address });
    if (value === 'lab_visit') {
      const hasValidAddresses = cart.labs.every(lab => lab.lab?.address);
      if (!hasValidAddresses) {
        setError('One or more lab addresses are unavailable for lab visit. Please select home collection or contact support.');
        toast.error('One or more lab addresses are unavailable for lab visit', { duration: 4000 });
      }
    }
  };

  const mapErrorMessage = (error) => {
    const errorMap = {
      'Test order file is required for one or more tests': 'Please upload a test order file for the required tests.',
      'Existing test order does not cover all required tests, and no new test order uploaded': 'Your current test order does not cover all tests. Please upload a new test order.',
      'Invalid email address': 'Please enter a valid email address.',
      'Invalid phone number (10-15 digits)': 'Please enter a valid phone number with 10-15 digits.',
      'Address is required for home collection': 'Please provide an address for home collection.',
      'Cart is empty or invalid': 'Your cart is empty or contains invalid items.',
      'One or more lab addresses are not available for lab visit': 'One or more lab addresses are unavailable for lab visit. Please select home collection or contact support.',
      'Checkout failed: Server error': 'An error occurred during checkout. Please try again or contact support.',
      'Invalid transaction parameters': 'Payment couldn’t be processed. Please check your details and try again.',
      'Failed to fetch cart or invalid cart data': 'Unable to load cart. Please try again or contact support.',
      'Invalid cart data: missing or invalid labs': 'Unable to load cart. Please try again or contact support.',
      'Guest ID not found': 'Unable to identify user. Please try again or contact support.'
    };
    return errorMap[error] || error || 'An unexpected error occurred.';
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
    if (form.deliveryMethod === 'home_collection' && !form.address) {
      return 'Address is required for home collection';
    }
    if (cart.labs.length === 0 || cart.totalPrice <= 0) {
      return 'Cart is empty or invalid';
    }
    if (form.deliveryMethod === 'lab_visit') {
      const hasValidAddresses = cart.labs.every(lab => lab.lab?.address);
      if (!hasValidAddresses) {
        return 'One or more lab addresses are not available for lab visit';
      }
    }
    if (requiresUpload && !testOrderFile) {
      return 'Test order file is required for one or more tests';
    }
    return null;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(mapErrorMessage(validationError));
      toast.error(mapErrorMessage(validationError), { duration: 4000 });
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
      if (requiresUpload && testOrderFile) {
        formData.append('testOrder', testOrderFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking`, {
        method: 'POST',
        headers: { 'x-guest-id': patientIdentifier },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Checkout failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Checkout response:', data);
      const hasTestOrderBookings = data.bookings.some(booking => booking.status === 'pending_test_order');
      const hasPayableBookings = data.paymentReferences && data.paymentReferences.length > 0 && data.paymentUrl;

      let message = '';
      if (hasPayableBookings && hasTestOrderBookings) {
        message = 'Proceeding to payment for non-order-required and verified test items. Unverified test order items are awaiting verification.';
      } else if (hasPayableBookings) {
        message = 'Proceeding to payment for your booking.';
      } else if (hasTestOrderBookings) {
        message = 'Your test order has been submitted for verification. You will be notified via email to complete payment.';
      }

      setPendingMessage(message);

      if (hasPayableBookings) {
        if (typeof window.PaystackPop === 'undefined') {
          throw new Error('PaystackPop not loaded');
        }

        const paystack = new window.PaystackPop();
        paystack.newTransaction({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: form.email,
          amount: data.bookings
            .filter(booking => booking.status === 'pending')
            .reduce((sum, booking) => sum + booking.totalPrice, 0) * 100,
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
      setError(mapErrorMessage(err.message));
      toast.error(mapErrorMessage(err.message), { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniqueLabAddresses = () => {
    const addresses = [];
    const seen = new Set();
    cart.labs.forEach(lab => {
      const address = lab.lab?.address;
      const labName = lab.lab?.name;
      if (address && labName && !seen.has(address)) {
        addresses.push({ name: labName, address });
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
            Lab Checkout
          </h1>
          <ErrorMessage error={error} onReupload={() => fileInputRef.current.click()} />
          <PendingMessage message={pendingMessage} />
          {(isPending || loading) ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 text-primary animate-spin" aria-label="Loading checkout" />
            </div>
          ) : isError ? (
            <ErrorMessage error={mapErrorMessage('Failed to fetch cart or invalid cart data')} />
          ) : cart.labs.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CheckoutDialog
                showCheckoutDialog={showCheckoutDialog}
                setShowCheckoutDialog={setShowCheckoutDialog}
                cart={cart}
                requiresUpload={requiresUpload}
                testOrderFile={testOrderFile}
                confirmCheckout={confirmCheckout}
                loading={loading}
                testOrderStatuses={testOrderStatuses}
              />
              <TestOrderUploadDialog
                showUploadDialog={showUploadDialog}
                setShowUploadDialog={setShowUploadDialog}
                testOrderFile={testOrderFile}
                setTestOrderFile={setTestOrderFile}
                fileInputRef={fileInputRef}
              />
              <BookingSummary cart={cart} calculateItemPrice={calculateItemPrice} testOrderStatuses={testOrderStatuses} />
              <CheckoutForm
                form={form}
                setForm={setForm}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                handleDeliveryMethodChange={handleDeliveryMethodChange}
                handleCheckout={handleCheckout}
                requiresUpload={requiresUpload}
                testOrderStatuses={testOrderStatuses}
                testOrderFile={testOrderFile}
                fileInputRef={fileInputRef}
                cart={cart}
                getUniqueLabAddresses={getUniqueLabAddresses}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}