'use client';

import { z } from 'zod';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import ErrorMessage from '@/components/ErrorMessage';
import CheckoutDialog from './CheckoutDialog';
import CheckoutForm from './CheckoutForm';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCartSegments, canProceedToCheckout } from '@/lib/cartUtils';

// Constants
const DELIVERY_METHODS = {
  PICKUP: 'PICKUP',
  COURIER: 'COURIER',
};

const PAYMENT_STATUS = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

const REQUEST_TIMEOUT = 30000; // 30 seconds
const FORM_STORAGE_KEY = 'checkoutForm';
const FORM_EXPIRY_KEY = 'checkoutFormExpiry';
const FORM_EXPIRY_HOURS = 24;

// Utility functions
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.replace(/[<>;"'{}$]/g, "").trim();
};



const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

const isFormExpired = () => {
  const expiry = localStorage.getItem(FORM_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
};

const saveFormToStorage = (formData) => {
  try {
    const expiryTime = Date.now() + (FORM_EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    localStorage.setItem(FORM_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    // Storage quota exceeded or disabled
    console.warn('Unable to save form data');
  }
};

const loadFormFromStorage = () => {
  try {
    if (isFormExpired()) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      localStorage.removeItem(FORM_EXPIRY_KEY);
      return null;
    }
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
};

const clearFormStorage = () => {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(FORM_EXPIRY_KEY);
  } catch (error) {
    // Silent fail
  }
};

const ERROR_MESSAGES = {
  'Invalid email address': 'Please enter a valid email address.',
  'Invalid phone number (10-15 digits)': 'Please enter a valid phone number with 10-15 digits.',
  'Address is required for delivery': 'Please provide a delivery address.',
  'Cart is empty or invalid': 'Your cart is empty or contains invalid medications.',
  'One or more pharmacy addresses are not available for pickup': 
    'One or more pharmacy addresses are unavailable for pickup. Please select delivery or contact support.',
  'Checkout failed: Server error': 'An error occurred during checkout. Please try again or contact support.',
  'Invalid transaction parameters': 'Payment couldn\'t be processed. Please check your details and try again.',
  'Failed to fetch cart or invalid cart data': 'Unable to load cart. Please try again or contact support.',
  'Invalid cart data: missing or invalid pharmacies': 'Unable to load cart. Please try again or contact support.',
  'Guest ID not found': 'Unable to identify user. Please try again or contact support.',
  'All fields are required': 'Please fill in all required fields.',
  'Invalid phone number': 'Please enter a valid phone number.',
  'No medications ready for checkout': 'Please complete prescription requirements in your cart.',
  'Network request failed': 'Network error. Please check your connection and try again.',
  'Request timeout': 'Request timed out. Please try again.',
};

export default function Checkout() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    deliveryMethod: DELIVERY_METHODS.PICKUP,
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(PAYMENT_STATUS.IDLE);
  const [paymentError, setPaymentError] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  
  const router = useRouter();
  const { cart, fetchCart, guestId, isPending, isError } = useCart();
  const abortControllerRef = useRef(null);
  const hasRedirectedRef = useRef(false);

  // Memoized calculations
  const segments = useMemo(() => getCartSegments(cart), [cart]);
  const canCheckout = useMemo(() => canProceedToCheckout(segments), [segments]);

const uniquePharmacies = useMemo(() => {
  const pharmacies = segments.readyForCheckout
    .map((item) => item.pharmacy)
    .filter(Boolean);

  const unique = new Map();
  pharmacies.forEach((pharmacy) => {
    const key = `${pharmacy.name}-${pharmacy.address}`;
    if (!unique.has(key)) {
      unique.set(key, pharmacy);
    }
  });

  return [...unique.values()];
}, [segments.readyForCheckout]);


  // Load form from storage on mount
  useEffect(() => {
    const savedForm = loadFormFromStorage();
    if (savedForm) {
      setForm(savedForm);
    }
  }, []);

  // Save form to storage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormToStorage(form);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form]);

  // Track when cart is loaded
  useEffect(() => {
    if (!isPending && !isError && cart) {
      setLoading(false);
      setCartLoaded(true);
    }
  }, [isPending, isError, cart]);

  // Redirect if no checkout-ready items
  useEffect(() => {
    if (
      cartLoaded && 
      !isPending && 
      !loading && 
      !isError && 
      cart && 
      !canCheckout &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      router.push('/cart');
    }
  }, [cartLoaded, isPending, loading, isError, cart, canCheckout, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: sanitizeInput(value) }));
  }, []);

  const handleDeliveryMethodChange = useCallback((value) => {
    setForm(prev => ({ 
      ...prev, 
      deliveryMethod: value, 
      address: value === DELIVERY_METHODS.PICKUP ? '' : prev.address 
    }));

    if (value === DELIVERY_METHODS.PICKUP) {
      const hasValidAddresses = segments.readyForCheckout.every(
        (item) => item.pharmacy?.address
      );
      if (!hasValidAddresses) {
        const errorMsg = ERROR_MESSAGES['One or more pharmacy addresses are not available for pickup'];
        setError(errorMsg);
        toast.error('One or more pharmacy addresses are unavailable for pickup', { 
          duration: 4000 
        });
      } else {
        setError(null);
      }
    }
  }, [segments.readyForCheckout]);

  const handleBackToCart = useCallback(() => {
    router.push('/cart');
  }, [router]);

  const mapErrorMessage = useCallback((error) => {
    return ERROR_MESSAGES[error] || error || 'An error occurred. Please try again.';
  }, []);

  const validateForm = useCallback(() => {
    const errors = [];

    if (!form.name || form.name.length < 2) {
      errors.push('Please enter a valid name.');
    }

    if (!form.phone || !validatePhone(form.phone)) {
      errors.push('Please enter a valid phone number (10-15 digits).');
    }

    if (form.email && !validateEmail(form.email)) {
      errors.push('Please enter a valid email address.');
    }

    if (form.deliveryMethod === DELIVERY_METHODS.COURIER && !form.address) {
      errors.push('Address is required for delivery.');
    }

    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  }, [form]);

  const handleCheckout = useCallback((e) => {
    e.preventDefault();
    
    try {
      validateForm();
      setShowCheckoutDialog(true);
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    }
  }, [validateForm]);

  const confirmCheckout = useCallback(async () => {
    if (!canCheckout) {
      toast.error('No medications ready for checkout', { duration: 4000 });
      return;
    }

    setPaymentStatus(PAYMENT_STATUS.PROCESSING);
    setShowCheckoutDialog(false);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current.abort();
    }, REQUEST_TIMEOUT);

    try {
      validateForm();

      const orderData = {
        name: sanitizeInput(form.name),
        email: form.email ? sanitizeInput(form.email) : '',
        phone: sanitizeInput(form.phone),
        address: sanitizeInput(form.address),
        deliveryMethod: form.deliveryMethod,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/med-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId,
          },
          body: JSON.stringify(orderData),
          signal: abortControllerRef.current.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Checkout failed');
      }

      const result = await response.json();

      // Check for payment URL
      if (result.paymentUrl) {
        // Clear form on successful order creation
        clearFormStorage();
        window.location.href = result.paymentUrl;
      } else {
        // Fallback to confirmation page
        clearFormStorage();
        setPaymentStatus(PAYMENT_STATUS.SUCCESS);
        await fetchCart();
        const orderId = result.orders?.[0]?.orderId || result.checkoutSessionId;
        if (orderId) {
          router.push(`/confirmation?orderId=${orderId}`);
        } else {
          throw new Error('Order ID not received');
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      
      let errorMessage = "An error occurred during checkout";

      if (err.name === "AbortError") {
        errorMessage = ERROR_MESSAGES["Request timeout"];
      } else if (err.message === "Failed to fetch") {
        errorMessage = ERROR_MESSAGES["Network request failed"];
      } else if (err instanceof z.ZodError) {
        errorMessage = err.errors[0].message; // show first validation error
      } else {
        errorMessage = mapErrorMessage(err.message); // always map
      }
      await fetchCart();
      setPaymentError(errorMessage);
      setPaymentStatus(PAYMENT_STATUS.ERROR);
      toast.error(mapErrorMessage(errorMessage), { duration: 4000 });
    }
  }, [canCheckout, form, guestId, validateForm, fetchCart, router, mapErrorMessage]);

  const retryPayment = useCallback(() => {
    setPaymentStatus(PAYMENT_STATUS.IDLE);
    setPaymentError(null);
    setShowCheckoutDialog(true);
  }, []);

  // Payment Error Component
const PaymentError = () => (
  <div className="relative animate-in fade-in slide-in-from-top-4 duration-500">
    {/* Background decoration */}
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
      <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl" />
    </div>

    <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-red-200/50 rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        {/* Error icon */}
        <div className="relative mx-auto w-20 h-20 mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <AlertCircle className="h-10 w-10 text-white" strokeWidth={3} />
          </div>
        </div>

        <CardTitle className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
            Payment Failed
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            We couldn't process your payment
          </p>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error message card */}
        <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200/50">
          <p className="text-red-800 text-sm sm:text-base leading-relaxed font-medium">
            {paymentError}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleBackToCart}
            variant="outline"
            className="flex-1 h-14 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </Button>
          
          <Button 
            onClick={retryPayment} 
            className="flex-1 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all duration-300 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>

        {/* Help text */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Need help? <a href="/support" className="text-[#1ABA7F] hover:text-[#225F91] font-semibold underline">Contact Support</a>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

  // Loading state
if (loading || isPending || !cartLoaded) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Premium loading spinner */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative w-20 h-20">
            <Loader2 className="w-20 h-20 text-[#1ABA7F] animate-spin" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-full border-t-4 border-[#225F91] animate-pulse" />
          </div>
        </div>

        {/* Loading text with animation */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] animate-pulse">
            Preparing Checkout
          </h2>
          <p className="text-gray-600 font-medium">Setting up your order details...</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[#225F91] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-[#1ABA7F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

  // Error state
  if (error && !canCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 py-8 px-2">
        <div className="w-full max-w-[95vw] sm:max-w-3xl mx-auto">
          <ErrorMessage error={error} />
          <div className="mt-6 text-center">
            <Button 
              onClick={handleBackToCart} 
              variant="outline" 
              className="h-12 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No medications ready
if (!canCheckout && cartLoaded && !isPending && !loading && !isError && cart) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden py-8 px-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
        <Card className="bg-white/95 backdrop-blur-sm border-2 border-orange-200/50 rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-4">
            {/* Warning icon */}
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-yellow-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <AlertCircle className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
            </div>

            <CardTitle className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
                Checkout Unavailable
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Prescription verification required
              </p>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info card */}
            <div className="p-5 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200/50">
              <p className="text-orange-800 text-sm sm:text-base leading-relaxed font-medium">
                All medications in your cart require prescription verification. 
                Please complete prescription requirements in your cart before proceeding to checkout.
              </p>
            </div>

            {/* Steps to complete */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">What you need to do:</h3>
              <div className="space-y-2">
                {[
                  'Upload valid prescriptions for required medications',
                  'Wait for pharmacy verification (usually 15-30 minutes)',
                  'Return to checkout once prescriptions are verified'
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action button */}
            <Button 
              onClick={handleBackToCart} 
              className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all duration-300 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Cart
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 p-1 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" 
        aria-hidden="true" 
      />

      {/* Navigation */}
<nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl shadow-lg border-b-2 border-[#1ABA7F]/10 py-4 px-4 sm:px-6">
  <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
    {/* Back Button */}
    <Button
      variant="ghost"
      onClick={handleBackToCart}
      className="group h-12 px-4 border-2 border-[#1ABA7F]/20 hover:border-[#1ABA7F]/40 text-[#225F91] hover:bg-[#1ABA7F]/10 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
      aria-label="Back to Cart"
    >
      <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
      <span className="ml-2 hidden sm:inline font-semibold">Back</span>
    </Button>

    {/* Title with Icon */}
    <div className="flex items-center gap-3 flex-1 justify-center">
      <div className="hidden sm:flex p-2 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
        <svg className="h-6 w-6 text-[#225F91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
        Order Checkout
      </h2>
    </div>

    {/* Trust Badge */}
    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-xs font-bold text-green-800">Secure</span>
    </div>
    <div className="w-12 sm:hidden" />
  </div>
</nav>

      {/* Payment Scripts */}
      <Script 
        src="https://js.paystack.co/v1/inline.js" 
        strategy="beforeInteractive" 
      />

      {/* Payment processing overlay */}
{paymentStatus === PAYMENT_STATUS.PROCESSING && (
  <div 
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-lg"
    role="alert"
    aria-live="assertive"
  >
    {/* Animated background elements */}
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  {/* Animated gradient orbs */}
  <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
  <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse delay-500" />
  
  {/* Dot pattern overlay */}
  <div 
    className="absolute inset-0 opacity-20 hidden sm:block"
    style={{
      backgroundImage: 'radial-gradient(circle, #225F91 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    }}
  />
</div>

    <div className="relative z-10 flex flex-col items-center gap-6 p-8">
      {/* Spinning loader with glow */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-2xl opacity-40 animate-pulse" />
        <div className="relative w-24 h-24">
          <Loader2 className="w-full h-full text-[#1ABA7F] animate-spin" strokeWidth={2.5} />
          {/* Inner rotating circle */}
          <div className="absolute inset-4 rounded-full border-4 border-[#225F91]/30 border-t-[#225F91] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>

      {/* Message card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border-2 border-[#1ABA7F]/20 max-w-md">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-center mb-3">
          Processing Payment
        </h2>
        <p className="text-gray-600 text-center font-medium">
          Please wait while we securely redirect you to complete your payment...
        </p>
        
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-[#1ABA7F] rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-[#225F91] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-3 h-3 bg-[#1ABA7F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-bold text-green-800">Secure Payment Gateway</span>
      </div>
    </div>
  </div>
)}

      {/* Main Content */}
      <div className="py-8 px-2 sm:px-4">
        <div className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-[90vw] xl:max-w-[85vw] mx-auto">
          {paymentStatus === PAYMENT_STATUS.ERROR ? (
            <PaymentError />
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <CheckoutForm
                form={form}
                setForm={setForm}
                handleInputChange={handleInputChange}
                handleDeliveryMethodChange={handleDeliveryMethodChange}
                handleCheckout={handleCheckout}
                segments={segments}
                uniquePharmacies={uniquePharmacies}
                loading={loading}
              />
            </div>
          )}

          {/* Checkout Dialog */}
          <CheckoutDialog
            show={showCheckoutDialog}
            onClose={() => setShowCheckoutDialog(false)}
            onConfirm={confirmCheckout}
            loading={paymentStatus === PAYMENT_STATUS.PROCESSING}
            segments={segments}
          />
        </div>
      </div>
    </div>
  );
}