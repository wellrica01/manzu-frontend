'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Track() {
  const [trackingCode, setTrackingCode] = useState('');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingCode) {
      setError('Please enter a tracking code');
      return;
    }
    try {
      setError(null);
      setOrders([]);
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/track?trackingCode=${trackingCode}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      const data = await response.json();
      console.log('Track data:', data);
      setOrders(data.orders);
    } catch (err) {
      console.error('Track error:', err);
      setError(err.message === 'Orders not found' ? 'Orders not found. Please check your tracking code.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateItemPrice = (item) => item.quantity * item.price;

  const getUniquePharmacyAddresses = (order) => {
    if (order.pharmacy && order.deliveryMethod === 'pickup') {
      return [{ name: order.pharmacy.name, address: order.pharmacy.address }];
    }
    return [];
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-indigo-800 mb-4">Track Your Order</h1>
      <Card className="border-indigo-100 shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-indigo-800">Enter Tracking Code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <Label htmlFor="trackingCode" className="text-gray-700">Tracking Code</Label>
              <Input
                id="trackingCode"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="border-indigo-300"
                placeholder="e.g., TRK-SESSION-15-1747421013936"
                required
              />
            </div>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading}
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </Button>
          </form>
        </CardContent>
      </Card>
      {error && <p className="text-red-600 font-medium mb-4">{error}</p>}
      {orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="border-indigo-100 shadow-md">
              <CardHeader>
                <CardTitle className="text-indigo-800">Order #{order.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    <strong>Tracking Code:</strong> {order.trackingCode}
                  </p>
                  <p className="text-gray-700">
                    <strong>Customer:</strong> {order.patientIdentifier}
                  </p>
                  <p className="text-gray-700">
                    <strong>Order Status:</strong> {order.status}
                  </p>
                  <p className="text-gray-700">
                    <strong>Payment Status:</strong> {order.paymentStatus}
                  </p>
                  <p className="text-gray-700">
                    <strong>Order Placed:</strong> {new Date(order.createdAt).toLocaleString()}
                  </p>
                  {order.cancelledAt && (
                    <p className="text-gray-700">
                      <strong>Cancelled:</strong> {new Date(order.cancelledAt).toLocaleString()} {order.cancelReason ? `(${order.cancelReason})` : ''}
                    </p>
                  )}
                  <p className="text-gray-700">
                    <strong>Delivery Method:</strong> {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                  </p>
                  {order.deliveryMethod === 'pickup' && getUniquePharmacyAddresses(order).length > 0 ? (
                    <div>
                      <strong className="text-gray-700">Pickup Address:</strong>
                      <div className="mt-2 space-y-2">
                        {getUniquePharmacyAddresses(order).map((pharmacy, index) => (
                          <p key={index} className="text-gray-600">
                            {pharmacy.name}: {pharmacy.address}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700">
                      <strong>Delivery Address:</strong> {order.address || 'Not specified'}
                    </p>
                  )}
                  {order.prescription && (
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-800">Prescription Details</h3>
                      <p className="text-gray-700">
                        <strong>Prescription ID:</strong> {order.prescription.id}
                      </p>
                      <p className="text-gray-700">
                        <strong>Status:</strong> {order.prescription.status}
                      </p>
                      <p className="text-gray-700">
                        <strong>Verified:</strong> {order.prescription.verified ? 'Yes' : 'No'}
                      </p>
                      <p className="text-gray-700">
                        <strong>Uploaded:</strong> {new Date(order.prescription.createdAt).toLocaleString()}
                      </p>
                      {order.prescription.medications.length > 0 && (
                        <div>
                          <strong className="text-gray-700">Prescribed Medications:</strong>
                          <div className="mt-2 space-y-2">
                            {order.prescription.medications.map((med, index) => (
                              <p key={index} className="text-gray-600">
                                {med.name} {med.genericName ? `(${med.genericName})` : ''} - Dosage: {med.dosage || 'N/A'}, Quantity: {med.quantity}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-indigo-800">Order Items</h3>
                  {order.items.map((item) => (
                    <div key={item.id} className="mb-4">
                      <p className="text-gray-700 font-medium">
                        {item.medication.name} {item.medication.genericName ? `(${item.medication.genericName})` : ''} {item.medication.prescriptionRequired ? '(Prescription Required)' : ''}
                      </p>
                      {item.medication.dosage && (
                        <p className="text-gray-600">Dosage: {item.medication.dosage}</p>
                      )}
                      <p className="text-gray-600">Pharmacy: {item.pharmacy.name}</p>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-gray-600">Unit Price: ₦{item.price}</p>
                      <p className="text-gray-600">Total: ₦{calculateItemPrice(item)}</p>
                    </div>
                  ))}
                  <p className="text-xl font-semibold text-indigo-800 text-right">
                    Total: ₦{order.totalPrice}
                  </p>
                </div>
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