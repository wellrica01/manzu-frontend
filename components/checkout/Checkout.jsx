'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGuestId } from '@/hooks/useGuestId';
import Script from 'next/script';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

// Components
import ErrorMessage from '@/components/ErrorMessage';
import CheckoutDialog from './CheckoutDialog';
import CheckoutForm from './CheckoutForm';
import StockValidationDialog from './StockValidationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConsentModal from '@/components/ConsentModal';

// Hooks
import { useConsentCheck } from '@/hooks/useConsentCheck';
import { useCartData } from '@/hooks/useCartData';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import { useCheckoutMutation } from '@/hooks/useCheckoutMutation';

// Utilities
import { getCartSegments, canProceedToCheckout } from '@/lib/cartUtils';
import { getUniquePharmacies } from '@/lib/checkoutUtils';

// Payment Error Component
const PaymentError = ({ error, onBackToCart, onRetry }) => (
  <div className="relative animate-in fade-in slide-in-from-top-4 duration-500">
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
      <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl" />
    </div>

    <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-red-200/50 rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="relative mx-auto w-20 h-20 mb-4">
          <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <AlertCircle className="h-10 w-10 text-white" strokeWidth={3} />
          </div>
        </div>

        <CardTitle className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
            Payment Failed
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            We couldn`t process your payment
          </p>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 border-red-200/50">
          <p className="text-red-800 text-sm sm:text-base leading-relaxed font-medium">
            {error}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onBackToCart}
            variant="outline"
            className="flex-1 h-14 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 rounded-lg font-bold transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </Button>
          
          <Button 
            onClick={onRetry} 
            className="flex-1 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow-lg hover:shadow-xl font-bold transition-all duration-300 group relative overflow-hidden"
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

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Need help? <a href="/support" className="text-[#1ABA7F] hover:text-[#225F91] font-semibold underline">Contact Support</a>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// No Checkout Available Component 
const NoCheckoutAvailable = ({ onBackToCart }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden py-8 px-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-700" />
    </div>

    <div className="relative z-10 w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="bg-white/95 backdrop-blur-sm border-2 border-orange-200/50 rounded-3xl shadow-2xl overflow-hidden">
        <CardHeader className="pb-4">
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
          <div className="p-5 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200/50">
            <p className="text-orange-800 text-sm sm:text-base leading-relaxed font-medium">
              All medications in your cart require prescription verification. 
              Please complete prescription requirements in your cart before proceeding to checkout.
            </p>
          </div>

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

          <Button 
            onClick={onBackToCart} 
            className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg shadow-lg hover:shadow-xl font-bold transition-all duration-300 group relative overflow-hidden"
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

// Loading Component
const CheckoutLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden flex items-center justify-center px-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse delay-700" />
    </div>

    <div className="relative z-10 flex flex-col items-center gap-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-xl opacity-50 animate-pulse" />
        <div className="relative w-20 h-20">
          <Loader2 className="w-20 h-20 text-[#1ABA7F] animate-spin" strokeWidth={2.5} />
          <div className="absolute inset-0 rounded-full border-t-4 border-[#225F91] animate-pulse" />
        </div>
      </div>

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

// Processing Payment Overlay 
const ProcessingPayment = ({ onCancel }) => (
  <div 
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-lg"
    role="alert"
    aria-live="assertive"
  >
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse delay-500" />
      
      <div 
        className="absolute inset-0 opacity-20 hidden sm:block"
        style={{
          backgroundImage: 'radial-gradient(circle, #225F91 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
    </div>

    <div className="relative z-10 flex flex-col items-center gap-6 p-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-2xl opacity-40 animate-pulse" />
        <div className="relative w-24 h-24">
          <Loader2 className="w-full h-full text-[#1ABA7F] animate-spin" strokeWidth={2.5} />
          <div className="absolute inset-4 rounded-full border-4 border-[#225F91]/30 border-t-[#225F91] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border-2 border-[#1ABA7F]/20 max-w-md">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] text-center mb-3">
          Processing Payment
        </h2>
        <p className="text-gray-600 text-center font-medium">
          Please wait while we securely redirect you to complete your payment...
        </p>
        
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-[#1ABA7F] rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-[#225F91] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-3 h-3 bg-[#1ABA7F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-bold text-green-800">Secure Payment Gateway</span>
      </div>
    </div>
    {/* Add after 15 seconds */}
      <button
        onClick={onCancel}
        className="mt-6 text-sm text-gray-600 underline"
      >
        Taking too long? Cancel and try again
      </button>
  </div>
);

// Main Checkout Component
function CheckoutComponent() {
  const router = useRouter();
  
  // Get environment config
  const guestId = useGuestId();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Custom hooks
  const { cart, isLoading, isError, error: cartError, refetch } = useCartData(guestId, apiUrl);
  const { 
    form, 
    touched,
    errors,
    isFormValid,
    handleInputChange, 
    handleDeliveryMethodChange,
    handleBlur,
    validateForm,
    getOrderType,
    clearForm 
  } = useCheckoutForm();
  const {
    mutate: checkout,
    isPending: isCheckoutPending,
    error: checkoutError,
    reset: resetCheckout
  } = useCheckoutMutation(guestId, apiUrl, {
    onSuccess: (data) => {
      if (data.paymentUrl) {
        clearForm();
        setIsRedirecting(true);
        window.location.href = data.paymentUrl;
      } else {
        clearForm();
        sessionStorage.removeItem('cart_entry_point');
        sessionStorage.removeItem('cart_referrer');
        const orderId = data.orders?.[0]?.orderId || data.checkoutSessionId;
        if (orderId) {
          router.push(`/confirmation?orderId=${orderId}`);
        }
      }
    }
  });
  
 const { isConsentOpen, checkConsent, handleConsentClose } = useConsentCheck();

  
  // Local state
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasRedirectedRef = useRef(false);
  const [paymentAttemptId, setPaymentAttemptId] = useState(null);
  const [stockValidation, setStockValidation] = useState(null);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
 
  // Memoized calculations
  const segments = useMemo(() => getCartSegments(cart), [cart]);
  const canCheckout = useMemo(() => canProceedToCheckout(segments), [segments]);
  const uniquePharmacies = useMemo(() => getUniquePharmacies(segments.readyForCheckout), [segments.readyForCheckout]);
  const orderType = useMemo(() => getOrderType(segments), [segments, getOrderType]);

  
  // Check consent on mount
  useEffect(() => {
    if (!checkConsent()) {
      toast.error('Please accept our privacy policy to proceed with checkout', { duration: 4000 });
    }
  }, [checkConsent]);


  // Track entry on checkout page
  useEffect(() => {
    sessionStorage.setItem('cart_referrer', '/checkout');
  }, []);

  // Track when cart is loaded
  useEffect(() => {
    if (!isLoading && !isError && cart) {
      setCartLoaded(true);
    }
  }, [isLoading, isError, cart]);



  // Redirect if no checkout-ready items
  useEffect(() => {
    if (
      cartLoaded && 
      !isLoading && 
      !isError && 
      cart && 
      !canCheckout &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      router.push('/cart');
    }
  }, [cartLoaded, isLoading, isError, cart, canCheckout, router]);

  // Handle back to cart
  const handleBackToCart = useCallback(() => {
    sessionStorage.removeItem('cart_referrer');
    router.replace('/cart');
  }, [router]);

  // Handle checkout submission
  const handleCheckout = useCallback((e) => {
    e.preventDefault();
    
    try {
      validateForm();
      setShowCheckoutDialog(true);
    } catch (err) {
      toast.error(err.message, { duration: 4000 });
    }
  }, [validateForm]);


    // Stock validation function
  const validateStockBeforePayment = useCallback(async () => {
    setIsValidatingStock(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/cart/validate-stock`, {
        headers: { 
          'x-guest-id': guestId,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to validate stock');
      }

      const data = await response.json();
      
      if (!data.allAvailable) {
        setStockValidation(data);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Stock validation error:', err);
      toast.error('Unable to verify stock availability. Please try again.');
      return false;
    } finally {
      setIsValidatingStock(false);
    }
  }, [apiUrl, guestId]);


  // Confirm checkout
  const confirmCheckout = useCallback(async () => {
    if (!canCheckout) {
      toast.error('No medications ready for checkout', { duration: 4000 });
      return;
    }

    // Check consent before proceeding
    if (!checkConsent()) {
      toast.error('Please accept our privacy policy to complete checkout', { duration: 4000 });
      return;
    }

    setShowCheckoutDialog(false);
        
    const stockAvailable = await validateStockBeforePayment();
    
    if (!stockAvailable) {
      toast.error('Some items are no longer available. Please review your cart.', { 
        duration: 5000 
      });
      return;
    }

    // Generate unique attempt ID
    const attemptId = `${guestId}-${Date.now()}`;
    setPaymentAttemptId(attemptId);

    const orderData = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      deliveryMethod: form.deliveryMethod,
      callbackUrl: `${window.location.origin}/payment/verify`,
      attemptId,
    };

    checkout(orderData);
  }, [canCheckout, form, checkout, guestId, checkConsent, validateStockBeforePayment]);


   // Handle stock validation dialog close
    const handleStockValidationClose = useCallback(() => {
      setStockValidation(null);
      router.push('/cart');
    }, [router]);


  // Retry payment
  const retryPayment = useCallback(() => {
    resetCheckout();
    setShowCheckoutDialog(true);
  }, [resetCheckout]);

  // Loading state
  if (isLoading || !cartLoaded) {
    return <CheckoutLoading />;
  }

  // No checkout available
  if (!canCheckout && cartLoaded && !isLoading && !isError && cart) {
    return <NoCheckoutAvailable onBackToCart={handleBackToCart} />;
  }

  // Error state (cart error)
  if (cartError && !canCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 py-8 px-2">
        <div className="w-full max-w-[95vw] sm:max-w-3xl mx-auto">
          <ErrorMessage error={cartError} />
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 to-gray-50/30 p-1 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none hidden sm:block" 
        aria-hidden="true" 
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl shadow-lg border-b-2 border-[#1ABA7F]/10 py-4 px-4 sm:px-6">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleBackToCart}
            className="group h-12 px-4 border-2 border-[#1ABA7F]/20 hover:border-[#1ABA7F]/40 text-[#225F91] hover:bg-[#1ABA7F]/10 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
            aria-label="Back to Cart"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="ml-2 hidden sm:inline font-semibold">Back</span>
          </Button>

          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="hidden sm:flex p-2 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-lg">
              <svg className="h-6 w-6 text-[#225F91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F]">
              Order Checkout
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
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

      {/* Stock Validation Dialog */}
      {stockValidation && !stockValidation.allAvailable && (
        <StockValidationDialog
          validation={stockValidation}
          onClose={handleStockValidationClose}
          onReviewCart={handleStockValidationClose}
        />
      )}

      
      {/* Processing overlay */}
      {(isCheckoutPending || isRedirecting || isValidatingStock) && (
        <ProcessingPayment 
          onCancel={() => {
            resetCheckout();
            setIsRedirecting(false);
            setIsValidatingStock(false);
            toast.error('Payment cancelled. Please try again.');
          }}
        />
      )}

      {/* Main Content */}
      <div className="py-8 px-2 sm:px-4">
        <div className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-[90vw] xl:max-w-[85vw] mx-auto">
          {checkoutError ? (
            <PaymentError 
              error={checkoutError.message}
              onBackToCart={handleBackToCart}
              onRetry={retryPayment}
            />
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <CheckoutForm
                form={form}
                touched={touched}
                errors={errors}
                isFormValid={isFormValid}
                handleInputChange={handleInputChange}
                handleDeliveryMethodChange={handleDeliveryMethodChange}
                handleBlur={handleBlur}
                handleCheckout={handleCheckout}
                orderType={orderType}
                uniquePharmacies={uniquePharmacies}
                loading={isCheckoutPending}
              />
            </div>
          )}

          <CheckoutDialog
            show={showCheckoutDialog}
            onClose={() => setShowCheckoutDialog(false)}
            onConfirm={confirmCheckout}
            loading={isCheckoutPending}
            segments={segments}
          />
        </div>
      </div>
      <ConsentModal isOpen={isConsentOpen} onClose={handleConsentClose} />
    </div>
  );
}

// Export with error handling
export default function Checkout() {
  return <CheckoutComponent />;
} 