'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Confirmation() {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') : null;
  const reference = searchParams.get('reference');

  const fetchConfirmation = async () => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:5000/api/confirmation?reference=${reference}`, {
        headers: { 'x-guest-id': guestId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify payment');
      }
      const data = await response.json();
      console.log('Confirmation data:', data);
      setOrder(data.order);
      setStatus(data.status);
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.message === 'Order not found' ? 'Order not found. Please contact support.' : err.message);
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (guestId && reference) {
      fetchConfirmation();
    } else {
      setError('Missing guest ID or reference');
      setStatus('failed');
    }
  }, [reference]);

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = () => {
    const addresses = [];
    const seen = new Set();
    order?.items.forEach(item => {
      const address = item.pharmacy?.address;
      const pharmacyName = item.pharmacy?.name;
      if (address && pharmacyName && !seen.has(address)) {
        addresses.push({ name: pharmacyName, address });
        seen.add(address);
      }
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
      {!order ? (
        <p className="text-gray-600">Loading order details...</p>
      ) : (
        <Card className="border-indigo-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-indigo-800">
              Payment Status: {status === 'completed' ? 'Successful' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>Order ID:</strong> {order.id}
              </p>
              <p className="text-gray-700">
                <strong>Tracking Code:</strong> {order.trackingCode}
              </p>
              <p className="text-gray-700">
                <strong>Customer:</strong> {order.patientIdentifier}
              </p>
              <p className="text-gray-700">
                <strong>Delivery Method:</strong> {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
              </p>
              {order.deliveryMethod === 'pickup' && order.items.length > 0 ? (
                <div>
                  <strong className="text-gray-700">Pickup Addresses:</strong>
                  <div className="mt-2 space-y-2">
                    {getUniquePharmacyAddresses().length > 0 ? (
                      getUniquePharmacyAddresses().map((pharmacy, index) => (
                        <p key={index} className="text-gray-600">
                          {pharmacy.name}: {pharmacy.address}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-600">Pharmacy address not available</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">
                  <strong>Delivery Address:</strong> {order.address}
                </p>
              )}
              {order.prescription && (
                <p className="text-gray-700">
                  <strong>Prescription:</strong> {order.prescription.status.charAt(0).toUpperCase() + order.prescription.status.slice(1)}
                  {' '}
                  (<a href={order.prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View File</a>)
                </p>
              )}
              <h3 className="text-lg font-semibold text-indigo-800">Order Items</h3>
              {order.items.map((item) => (
                <div key={item.id} className="mb-4">
                  <p className="text-gray-700 font-medium">
                    {item.medication.name}
                    {item.medication.prescriptionRequired && ' (Prescription Required)'}
                  </p>
                  <p className="text-gray-600">Pharmacy: {item.pharmacy.name}</p>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-gray-600">Unit Price: ₦{item.price}</p>
                  <p className="text-gray-600">Total: ₦{calculateItemPrice(item)}</p>
                </div>
              ))}
              <p className="text-xl font-semibold text-indigo-800 text-right">
                Total: ₦{order.totalPrice}
              </p>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white mt-4"
                onClick={handleBackToHome}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}