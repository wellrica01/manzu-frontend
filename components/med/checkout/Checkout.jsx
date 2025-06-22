'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'sonner';
import { getGuestId } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyCart from '@/components/med/cart/EmptyCart';
import PendingMessage from './PendingMessage';
import CheckoutDialog from './CheckoutDialog';
import PrescriptionUploadDialog from './PrescriptionUploadDialog';
import CheckoutForm from './CheckoutForm';
import dynamic from 'next/dynamic';
import { useCart } from '@/hooks/useCart';
const OrderSummary = dynamic(() => import('./OrderSummary'), { ssr: false });

export default function Checkout() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', deliveryMethod: 'pickup' });
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [requiresUpload, setRequiresUpload] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [prescriptionStatuses, setPrescriptionStatuses] = useState({});
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { cart, fetchCart, guestId, isPending, isError } = useCart();

  useEffect(() => {
    const id = getGuestId();
    console.log('Setting patientIdentifier:', id);
    setPatientIdentifier(id);
  }, []);

  useEffect(() => {
    async function loadCartAndPrescriptions() {
      if (!patientIdentifier) {
        setError('Guest ID not found');
        toast.error('Guest ID not found', { duration: 4000 });
        setLoading(false);
        return;
      }

      try {
        setError(null);
        console.log('loadCartAndPrescriptions: cart state:', { cart, isPending, isError });

        if (isPending) {
          console.log('Cart query is pending, waiting...');
          return;
        }

        if (isError) {
          throw new Error('Failed to fetch cart or invalid cart data');
        }

        if (!cart || !Array.isArray(cart.pharmacies)) {
          throw new Error('Invalid cart data: missing or invalid pharmacies');
        }

        const orderItems = cart.pharmacies
          .flatMap(pharmacy => pharmacy.items || [])
          .filter(item => item && item.medication && item.pharmacyMedicationMedicationId);

        console.log('Processed orderItems:', orderItems);

        const prescriptionRequiredIds = orderItems
          .filter(item => item.medication?.prescriptionRequired)
          .map(item => item.pharmacyMedicationMedicationId.toString());

        console.log('Prescription required IDs:', prescriptionRequiredIds);

        if (prescriptionRequiredIds.length > 0) {
          const validateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/checkout/prescription/validate?patientIdentifier=${patientIdentifier}&medicationIds=${prescriptionRequiredIds.join(',')}`
          );
          if (!validateResponse.ok) {
            const errorData = await validateResponse.json();
            throw new Error(`Failed to validate prescription: ${errorData.message || validateResponse.statusText}`);
          }
          const validateData = await validateResponse.json();
          console.log('Prescription validate API response:', validateData);
          setRequiresUpload(validateData.requiresUpload);

          const statusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/prescription/status?patientIdentifier=${patientIdentifier}&medicationIds=${prescriptionRequiredIds.join(',')}`,
            { headers: { 'x-guest-id': patientIdentifier } }
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('Prescription statuses:', statusData);
            setPrescriptionStatuses(statusData && typeof statusData === 'object' ? statusData : {});
            // Fallback: If all prescriptions are verified, override requiresUpload
            const allVerified = prescriptionRequiredIds.every(
              id => (statusData[id] || 'none') === 'verified'
            );
            if (allVerified && validateData.requiresUpload) {
              console.log('All prescriptions verified, overriding requiresUpload to false');
              setRequiresUpload(false);
            } else if (!allVerified && !validateData.requiresUpload) {
              console.log('Some prescriptions unverified but API says no upload needed, setting requiresUpload to true');
              setRequiresUpload(true);
            }
          } else {
            console.warn('Prescription status API failed:', statusResponse.statusText);
            setPrescriptionStatuses(
              Object.fromEntries(prescriptionRequiredIds.map(id => [id, 'none']))
            );
            setRequiresUpload(true); // Assume upload required if status check fails
          }
        } else {
          console.log('No prescription required, setting requiresUpload to false');
          setRequiresUpload(false);
          setPrescriptionStatuses({});
        }

        console.log('Final prescription state:', { requiresUpload, prescriptionStatuses });
      } catch (err) {
        console.error('Fetch cart error:', err.message);
        setError(mapErrorMessage(err.message));
        toast.error(mapErrorMessage(err.message), { duration: 4000 });
      } finally {
        setLoading(false);
      }
    }

    loadCartAndPrescriptions();
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
        setPrescriptionFile(file);
        setShowUploadDialog(true);
      } else {
        toast.error('Please upload a valid PDF, JPG, or PNG file', { duration: 4000 });
      }
    }
  };

  const handleDeliveryMethodChange = (value) => {
    setForm({ ...form, deliveryMethod: value, address: value === 'pickup' ? '' : form.address });
    if (value === 'pickup') {
      const hasValidAddresses = cart.pharmacies.every(pharmacy => pharmacy.pharmacy?.address);
      if (!hasValidAddresses) {
        setError('One or more pharmacy addresses are unavailable for pickup. Please select delivery or contact support.');
        toast.error('One or more pharmacy addresses are unavailable for pickup', { duration: 4000 });
      }
    }
  };

  const mapErrorMessage = (error) => {
    const errorMap = {
      'Prescription file is required for one or more medications': 'Please upload a prescription file for the required medications.',
      'Existing prescription does not cover all required medications, and no new prescription uploaded': 'Your current prescription does not cover all medications. Please upload a new prescription.',
      'Invalid email address': 'Please enter a valid email address.',
      'Invalid phone number (10-15 digits)': 'Please enter a valid phone number with 10-15 digits.',
      'Address is required for delivery': 'Please provide a delivery address.',
      'Cart is empty or invalid': 'Your cart is empty or contains invalid items.',
      'One or more pharmacy addresses are not available for pickup': 'One or more pharmacy addresses are unavailable for pickup. Please select delivery or contact support.',
      'Checkout failed: Server error': 'An error occurred during checkout. Please try again or contact support.',
      'Invalid transaction parameters': 'Payment couldn’t be processed. Please check your details and try again.',
      'Failed to fetch cart or invalid cart data': 'Unable to load cart. Please try again or contact support.',
      'Invalid cart data: missing or invalid pharmacies': 'Unable to load cart. Please try again or contact support.',
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
    if (form.deliveryMethod === 'delivery' && !form.address) {
      return 'Address is required for delivery';
    }
    if (cart.pharmacies.length === 0 || cart.totalPrice <= 0) {
      return 'Cart is empty or invalid';
    }
    if (form.deliveryMethod === 'pickup') {
      const hasValidAddresses = cart.pharmacies.every(pharmacy => pharmacy.pharmacy?.address);
      if (!hasValidAddresses) {
        return 'One or more pharmacy addresses are not available for pickup';
      }
    }
    if (requiresUpload && !prescriptionFile) {
      return 'Prescription file is required for one or more medications';
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
      console.log('Checkout response:', data);
      const hasPrescriptionOrders = data.orders.some(order => order.status === 'pending_prescription');
      const hasPayableOrders = data.paymentReferences && data.paymentReferences.length > 0 && data.paymentUrl;

      let message = '';
      if (hasPayableOrders && hasPrescriptionOrders) {
        message = 'Proceeding to payment for over-the-counter and verified prescription items. Unverified prescription items are awaiting verification.';
      } else if (hasPayableOrders) {
        message = 'Proceeding to payment for your order.';
      } else if (hasPrescriptionOrders) {
        message = 'Your prescription has been submitted for verification. You will be notified via email to complete payment.';
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
      setError(mapErrorMessage(err.message));
      toast.error(mapErrorMessage(err.message), { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = () => {
    const addresses = [];
    const seen = new Set();
    cart.pharmacies.forEach(pharmacy => {
      const address = pharmacy.pharmacy?.address;
      const pharmacyName = pharmacy.pharmacy?.name;
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
          <ErrorMessage error={error} onReupload={() => fileInputRef.current.click()} />
          <PendingMessage message={pendingMessage} />
          {(isPending || loading) ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 text-primary animate-spin" aria-label="Loading checkout" />
            </div>
          ) : isError ? (
            <ErrorMessage error={mapErrorMessage('Failed to fetch cart or invalid cart data')} />
          ) : cart.pharmacies.length === 0 ? (
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
                prescriptionStatuses={prescriptionStatuses}
              />
              <PrescriptionUploadDialog
                showUploadDialog={showUploadDialog}
                setShowUploadDialog={setShowUploadDialog}
                prescriptionFile={prescriptionFile}
                setPrescriptionFile={setPrescriptionFile}
                fileInputRef={fileInputRef}
              />
              <OrderSummary cart={cart} calculateItemPrice={calculateItemPrice} prescriptionStatuses={prescriptionStatuses} />
              <CheckoutForm
                form={form}
                setForm={setForm}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                handleDeliveryMethodChange={handleDeliveryMethodChange}
                handleCheckout={handleCheckout}
                requiresUpload={requiresUpload}
                prescriptionStatuses={prescriptionStatuses}
                prescriptionFile={prescriptionFile}
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