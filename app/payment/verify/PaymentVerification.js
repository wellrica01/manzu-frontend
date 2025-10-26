'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentVerification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [error, setError] = useState(null);
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setError('No payment reference found');
      return;
    }

    // Verify payment with backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify?reference=${reference}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStatus('success');
          // Redirect to confirmation after 2 seconds
          setTimeout(() => {
            router.push(`/confirmation?reference=${reference}&session=${data.sessionId}`);
          }, 2000);
        } else {
          setStatus('failed');
          setError(data.message || 'Payment verification failed');
        }
      })
      .catch(err => {
        setStatus('failed');
        setError('Unable to verify payment. Please contact support with reference: ' + reference);
      });
  }, [reference, router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#1ABA7F] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment</p>
          <p className="text-sm text-gray-500 mt-4">Reference: {reference}</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/cart')}
              className="w-full py-3 bg-[#1ABA7F] text-white rounded-lg font-semibold"
            >
              Return to Cart
            </button>
            <a
              href={`mailto:support@manzu.com?subject=Payment Issue - ${reference}`}
              className="block w-full py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700"
            >
              Contact Support
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-4">Reference: {reference}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified!</h2>
        <p className="text-gray-600">Redirecting to your order confirmation...</p>
      </div>
    </div>
  );
}