'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Confirmation() {
  const [confirmationData, setConfirmationData] = useState({ pharmacies: [], trackingCode: '', checkoutSessionId: '' });
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
  const reference = searchParams.get('reference');
  const session = searchParams.get('session');

  const fetchConfirmation = async () => {
    try {
      setError(null);
      const query = new URLSearchParams();
      if (reference) query.set('reference', reference);
      if (session) query.set('session', session);
      const response = await fetch(`http://localhost:5000/api/confirmation?${query.toString()}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify payment');
      }
      const data = await response.json();
      console.log('Confirmation data:', data);
      setConfirmationData({
        pharmacies: data.pharmacies,
        trackingCode: data.trackingCode,
        checkoutSessionId: data.checkoutSessionId,
      });
      setStatus(data.status);
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.message === 'Orders not found' ? 'Orders not found. Please contact support.' : err.message);
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (guestId && (reference || session)) {
      fetchConfirmation();
    } else {
      setError('Missing guest ID, reference, or session ID');
      setStatus('failed');
    }
  }, [reference, session]);

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = (pharmacyOrders) => {
    const addresses = [];
    const seen = new Set();
    pharmacyOrders.forEach(order => {
      order.items.forEach(item => {
        const address = pharmacyOrders[0].pharmacy?.address;
        const pharmacyName = pharmacyOrders[0].pharmacy?.name;
        if (address && pharmacyName && !seen.has(address)) {
          addresses.push({ name: pharmacyName, address });
          seen.add(address);
        }
      });
    });
    return addresses;
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-indigo-800 mb-4">Order Confirmation</h1>
      {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
      {confirmationData.pharmacies.length === 0 ? (
        <p className="text-gray-600">Loading order details...</p>
      ) : (
        <div className="space-y-6">
          <Card className="border-indigo-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-indigo-800">
                Order Status: {status === 'completed' ? 'Successful' : 'Awaiting Verification'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                <strong>Tracking Code:</strong> {confirmationData.trackingCode}
              </p>
              <p className="text-gray-700">
                <strong>Checkout Session ID:</strong> {confirmationData.checkoutSessionId}
              </p>
            </CardContent>
          </Card>
          {confirmationData.pharmacies.map((pharmacy) => (
            <Card key={pharmacy.pharmacy.id} className="border-indigo-100 shadow-md">
              <CardHeader>
                <CardTitle className="text-indigo-800">{pharmacy.pharmacy.name}</CardTitle>
                <p className="text-gray-600">{pharmacy.pharmacy.address}</p>
              </CardHeader>
              <CardContent>
                {pharmacy.orders.map((order) => (
                  <div key={order.id} className="mb-6 border-b pb-4">
                    <p className="text-gray-700">
                      <strong>Order ID:</strong> {order.id}
                    </p>
                    <p className="text-gray-700">
                      <strong>Status:</strong>{' '}
                      {order.status === 'confirmed' ? 'Confirmed' : 'Awaiting Prescription Verification'}
                    </p>
                    <p className="text-gray-700">
                      <strong>Delivery Method:</strong>{' '}
                      {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                    </p>
                    {order.deliveryMethod === 'pickup' ? (
                      <div>
                        <strong className="text-gray-700">Pickup Address:</strong>
                        <p className="text-gray-600">{pharmacy.pharmacy.address}</p>
                      </div>
                    ) : (
                      <p className="text-gray-700">
                        <strong>Delivery Address:</strong> {order.address}
                      </p>
                    )}
                    {order.prescription && (
                      <p className="text-gray-700">
                        <strong>Prescription:</strong>{' '}
                        {order.prescription.status.charAt(0).toUpperCase() + order.prescription.status.slice(1)}
                        {' '}
                        (<a
                          href={order.prescription.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View File
                        </a>)
                        {order.prescription.status === 'verified' && order.status === 'pending_prescription' && (
                          <span>
                            {' '}
                            <Link
                              href={`/checkout/${order.id}`}
                              className="text-indigo-600 hover:underline"
                            >
                              Complete Payment
                            </Link>
                          </span>
                        )}
                      </p>
                    )}
                    <h3 className="text-lg font-semibold text-indigo-800 mt-4">Order Items</h3>
                    {order.items.map((item) => (
                      <div key={item.id} className="mb-4">
                        <p className="text-gray-700 font-medium">
                          {item.medication.name}
                          {item.medication.prescriptionRequired && ' (Prescription Required)'}
                        </p>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-gray-600">Unit Price: ₦{item.price}</p>
                        <p className="text-gray-600">Total: ₦{calculateItemPrice(item)}</p>
                      </div>
                    ))}
                    <p className="text-gray-700 font-semibold">Order Total: ₦{order.totalPrice}</p>
                  </div>
                ))}
                <p className="text-xl font-semibold text-indigo-800">
                  Subtotal for {pharmacy.pharmacy.name}: ₦{pharmacy.subtotal}
                </p>
              </CardContent>
            </Card>
          ))}
          <Button
            className="bg-green-600 hover:bg-green-700 text-white mt-4"
            onClick={handleBackToHome}
          >
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}