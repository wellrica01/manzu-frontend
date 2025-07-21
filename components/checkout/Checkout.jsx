'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import ErrorMessage from '@/components/ErrorMessage';
import CheckoutDialog from './CheckoutDialog';
import CheckoutForm from './CheckoutForm';
import dynamic from 'next/dynamic';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCartSegments, canProceedToCheckout } from '@/lib/cartUtils';
const OrderSummary = dynamic(() => import('./OrderSummary'), { ssr: false });

export default function Checkout() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    deliveryMethod: 'pickup' 
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
  const [paymentError, setPaymentError] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const router = useRouter();
  const { cart, fetchCart, guestId, isPending, isError } = useCart();

  // Get cart segments - only ready medications should be in checkout
  const segments = getCartSegments(cart);
  const canCheckout = canProceedToCheckout(segments);
  


  // Track when cart has been properly loaded
  useEffect(() => {
    if (!isPending && !isError && cart) {
      setLoading(false);
      setCartLoaded(true);
    }
  }, [isPending, isError, cart]);

  // Only redirect if cart has been loaded and there are no ready medications
  useEffect(() => {
    // Don't redirect while still loading or if cart hasn't been properly loaded yet
    // Also ensure we have actual cart data (not null) before making the decision
    if (cartLoaded && !isPending && !loading && !isError && cart && !canCheckout) {
      router.push('/cart');
    }
  }, [cartLoaded, isPending, loading, isError, cart, canCheckout, router]);

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDeliveryMethodChange = (value) => {
    setForm({ ...form, deliveryMethod: value, address: value === 'pickup' ? '' : form.address });
    if (value === 'pickup') {
      const hasValidAddresses = segments.readyForCheckout.every((item) => item.pharmacy?.address);
      if (!hasValidAddresses) {
        setError('One or more pharmacy addresses are unavailable for pickup. Please select delivery or contact support.');
        toast.error('One or more pharmacy addresses are unavailable for pickup', { duration: 4000 });
      }
    }
  };

  const handleBackToCart = () => {
    router.push('/cart');
  };

  const mapErrorMessage = (error) => {
    const errorMap = {
      'Invalid email address': 'Please enter a valid email address.',
      'Invalid phone number (10-15 digits)': 'Please enter a valid phone number with 10-15 digits.',
      'Address is required for delivery': 'Please provide a delivery address.',
      'Cart is empty or invalid': 'Your cart is empty or contains invalid medications.',
      'One or more pharmacy addresses are not available for pickup': 'One or more pharmacy addresses are unavailable for pickup. Please select delivery or contact support.',
      'Checkout failed: Server error': 'An error occurred during checkout. Please try again or contact support.',
      'Invalid transaction parameters': 'Payment couldn\'t be processed. Please check your details and try again.',
      'Failed to fetch cart or invalid cart data': 'Unable to load cart. Please try again or contact support.',
      'Invalid cart data: missing or invalid pharmacies': 'Unable to load cart. Please try again or contact support.',
      'Guest ID not found': 'Unable to identify user. Please try again or contact support.',
      'All fields are required': 'Please fill in all required fields.',
      'Invalid phone number': 'Please enter a valid phone number.',
      'Address is required for delivery': 'Please provide a delivery address.',
      'Cart is empty or invalid': 'Your cart is empty. Please add medications before checkout.',
      'One or more pharmacy addresses are not available for pickup': 'Some pharmacy addresses are unavailable for pickup. Please select delivery.',
      'No medications ready for checkout': 'Please complete prescription requirements in your cart.',
    };
    return errorMap[error] || error || 'An error occurred. Please try again.';
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setShowCheckoutDialog(true);
  };

  const confirmCheckout = async () => {
    if (!canCheckout) {
      toast.error('No medications ready for checkout', { duration: 4000 });
      return;
    }

    setPaymentStatus('processing');
    setShowCheckoutDialog(false);

    try {
      // Validate form
      if (!form.name || !form.phone) {
        throw new Error('Name and phone number are required');
      }

      if (form.deliveryMethod === 'delivery' && !form.address) {
        throw new Error('Address is required for delivery');
      }

      // Create order with ready medications
      let deliveryMethodEnum = form.deliveryMethod;
      if (deliveryMethodEnum === 'pickup') deliveryMethodEnum = 'PICKUP';
      else if (deliveryMethodEnum === 'delivery') deliveryMethodEnum = 'COURIER';
      const orderData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        deliveryMethod: deliveryMethodEnum
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/med-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Checkout failed');
      }

      const result = await response.json();
      console.log('Checkout response:', result);
      
      // Check if we have a payment URL to redirect to Paystack
      if (result.paymentUrl) {
        console.log('Redirecting to Paystack payment:', result.paymentUrl);
        console.log('Full result:', result);
        window.location.href = result.paymentUrl;
      } else {
        // Fallback: redirect to confirmation with order ID
        console.log('No payment URL found, using fallback');
        setPaymentStatus('success');
        await fetchCart();
        const orderId = result.orders?.[0]?.orderId || result.checkoutSessionId;
        router.push(`/confirmation?orderId=${orderId}`);
      }
      
    } catch (err) {
      console.error('Checkout error:', err);
      setPaymentError(err.message);
      setPaymentStatus('error');
      toast.error(mapErrorMessage(err.message), { duration: 4000 });
    }
  };

  const retryPayment = () => {
    setPaymentStatus('idle');
    setPaymentError(null);
    setShowCheckoutDialog(true);
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = () => {
    const addresses = [...new Set(segments.readyForCheckout.map(item => item.pharmacy?.address).filter(Boolean))];
    return addresses;
  };

  const PaymentError = () => (
    <Card className="bg-red-50 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Payment Failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-700 mb-4">{paymentError}</p>
        <Button onClick={retryPayment} className="bg-red-600 hover:bg-red-700">
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  // Show loading state while cart is being fetched or if we haven't determined checkout eligibility yet
  if (loading || isPending || !cartLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#225F91]" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <ErrorMessage error={error} />
          <div className="mt-6 text-center">
            <Button onClick={handleBackToCart} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Don't show the "no medications ready" UI if cart is still loading or if we haven't checked the cart yet
  if (!canCheckout && cartLoaded && !isPending && !loading && !isError && cart) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                No Medications Ready for Checkout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-4">
                All medications in your cart require prescription verification. 
                Please complete prescription requirements in your cart before proceeding to checkout.
              </p>
              <Button onClick={handleBackToCart} className="bg-orange-600 hover:bg-orange-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      
      {/* Payment Scripts */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="beforeInteractive"
      />

      {/* Payment processing overlay */}
      {paymentStatus === 'processing' && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-[#1ABA7F] mb-4" />
          <span className="text-lg font-semibold text-[#225F91]">Redirecting to payment...</span>
        </div>
      )}

      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={handleBackToCart}
            className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] tracking-tight">
            Checkout
          </h1>
        </div>

        {paymentStatus === 'error' ? (
          <PaymentError />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-6">
              <CheckoutForm
                form={form}
                setForm={setForm}
                handleInputChange={handleInputChange}
                handleDeliveryMethodChange={handleDeliveryMethodChange}
                handleCheckout={handleCheckout}
                segments={segments}
                getUniquePharmacyAddresses={getUniquePharmacyAddresses}
                loading={loading}
              />
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <OrderSummary 
                items={segments.readyForCheckout}
                calculateItemPrice={calculateItemPrice}
                totalPrice={segments.totalPrice}
              />
            </div>
          </div>
        )}

        {/* Checkout Dialog */}
        <CheckoutDialog
          show={showCheckoutDialog}
          onClose={() => setShowCheckoutDialog(false)}
          onConfirm={confirmCheckout}
          loading={paymentStatus === 'processing'}
          segments={segments}
        />
      </div>
    </div>
  );
}