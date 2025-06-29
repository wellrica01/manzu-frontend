'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ErrorMessage from '@/components/ErrorMessage';

export default function ConfirmationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;

  const [confirmationData, setConfirmationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConfirmation() {
      if (!guestId || !reference || !session) {
        console.error('Missing required parameters:', { guestId, reference, session });
        setError('Missing guest ID, reference, or session ID');
        toast.error('Missing required parameters. Please try again or contact support.', { duration: 4000 });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching confirmation:', { reference, session, guestId });
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/confirmation?session=${session}&reference=${reference}`,
          {
            headers: { 'x-guest-id': guestId },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch confirmation');
        }

        const data = await response.json();
        console.log('Confirmation response:', data);
        setConfirmationData(data);

        if (data.status === 'completed') {
          toast.success('Payment verified and orders confirmed!', { duration: 4000 });
        } else {
          toast.info(data.message || 'Orders retrieved, some awaiting verification', { duration: 4000 });
        }
      } catch (err) {
        console.error('Fetch confirmation error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(err.message || 'An unexpected error occurred');
        toast.error(err.message || 'Failed to load confirmation details. Please try again.', { duration: 4000 });
      } finally {
        setLoading(false);
      }
    }

    fetchConfirmation();
  }, [reference, session, guestId]);

  const mapErrorMessage = (error) => {
    const errorMap = {
      'Missing guest ID, reference, or session ID': 'Unable to load confirmation. Please ensure you have a valid session and try again.',
      'Orders not found': 'No orders found for this transaction. Please contact support.',
      'Payment verification failed': 'Payment could not be verified. Please try again or contact support.',
      'Order not found': 'Order not found. Please check your details or contact support.',
      'Server error': 'An error occurred on the server. Please try again or contact support.',
    };
    return errorMap[error] || error || 'An unexpected error occurred.';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-[#1ABA7F]/10 to-white/80">
        <Loader2 className="h-12 w-12 text-[#225F91] animate-spin" aria-label="Loading confirmation" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1ABA7F]/10 to-white/80">
        <ErrorMessage error={mapErrorMessage(error)} />
        <button
          className="mt-4 px-4 py-2 bg-[#225F91] text-white rounded hover:bg-[#1A4A76]"
          onClick={() => router.push('/checkout')}
        >
          Return to Checkout
        </button>
      </div>
    );
  }

  if (!confirmationData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1ABA7F]/10 to-white/80">
        <ErrorMessage error="No confirmation data available" />
        <button
          className="mt-4 px-4 py-2 bg-[#225F91] text-white rounded hover:bg-[#1A4A76]"
          onClick={() => router.push('/checkout')}
        >
          Return to Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/svg/pattern-dots.svg')] opacity-10 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-8 text-center tracking-tight animate-in slide-in-from-top duration-700">
          Order Confirmation
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-[#225F91] mb-4">
            {confirmationData.status === 'completed'
              ? 'Order Confirmed!'
              : 'Order Awaiting Verification'}
          </h2>
          <p className="text-gray-600 mb-4">
            Tracking Code: <span className="font-semibold">{confirmationData.trackingCode}</span>
          </p>
          <p className="text-gray-600 mb-6">
            Session ID: <span className="font-semibold">{confirmationData.checkoutSessionId}</span>
          </p>

          {confirmationData.providers && confirmationData.providers.length > 0 ? (
            confirmationData.providers.map((provider) => (
              <div key={provider.provider.id} className="mb-8 border-b pb-6">
                <h3 className="text-xl font-semibold text-[#225F91] mb-2">
                  {provider.provider.name}
                </h3>
                <p className="text-gray-600 mb-4">{provider.provider.address}</p>
                {provider.orders.map((order) => (
                  <div key={order.id} className="mb-4">
                    <h4 className="text-lg font-medium text-gray-800">Order #{order.id}</h4>
                    <p className="text-gray-600">Status: {order.status}</p>
                    <p className="text-gray-600">Total: ₦{order.totalPrice.toLocaleString()}</p>
                    {order.paymentReference && (
                      <p className="text-gray-600">Payment Reference: {order.paymentReference}</p>
                    )}
                    {order.prescription && (
                      <p className="text-gray-600">
                        Prescription Status: {order.prescription.status}
                        {order.prescription.fileUrl && (
                          <a
                            href={order.prescription.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1ABA7F] hover:underline ml-2"
                          >
                            View Prescription
                          </a>
                        )}
                      </p>
                    )}
                    <div className="mt-2">
                      <h5 className="text-sm font-semibold text-gray-700">Items:</h5>
                      <ul className="list-disc pl-5">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-gray-600">
                            {item.service.name} (x{item.quantity}) - ₦{item.price.toLocaleString()}
                            {item.service.prescriptionRequired && (
                              <span className="text-[#1ABA7F] ml-2">(Prescription Required)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                <p className="text-gray-800 font-semibold mt-4">
                  Subtotal: ₦{provider.subtotal.toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No confirmed orders available.</p>
          )}

          <div className="mt-6 flex justify-center">
            <button
              className="px-6 py-3 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4A76] transition-colors"
              onClick={() => router.push('/')}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}