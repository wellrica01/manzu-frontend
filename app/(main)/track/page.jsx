'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Home } from 'lucide-react';

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
      setOrders(data.orders);
    } catch (err) {
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-8 text-center">
          Track Your Order
        </h1>
        <Card className="card card-hover fade-in mb-6">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary">
              Enter Tracking Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <Label htmlFor="trackingCode" className="text-primary font-medium">
                  Tracking Code
                </Label>
                <Input
                  id="trackingCode"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="mt-1"
                  placeholder="e.g., TRK-SESSION-15-1747421013936"
                  required
                  aria-describedby={error ? 'tracking-error' : undefined}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Tracking...
                  </>
                ) : (
                  'Track Order'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        {error && (
          <div className="card bg-destructive/10 border-l-4 border-destructive p-4 mb-6 fade-in" id="tracking-error">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        {orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <Card
                key={order.id}
                className="card card-hover fade-in"
                style={{ animationDelay: `${0.2 * index}s` }}
              >
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-2xl font-semibold text-primary">
                    Order #{order.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 text-foreground">
                    <p>
                      <strong>Tracking Code:</strong> {order.trackingCode || 'N/A'}
                    </p>
                    <p>
                      <strong>Customer:</strong> {order.patientIdentifier || 'N/A'}
                    </p>
                    <p>
                      <strong>Order Status:</strong> {order.status || 'Unknown'}
                    </p>
                    <p>
                      <strong>Payment Status:</strong> {order.paymentStatus || 'Pending'}
                    </p>
                    <p>
                      <strong>Order Placed:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                    </p>
                    {order.cancelledAt && (
                      <p>
                        <strong>Cancelled:</strong> {new Date(order.cancelledAt).toLocaleString()} {order.cancelReason ? `(${order.cancelReason})` : ''}
                      </p>
                    )}
                    <p>
                      <strong>Delivery Method:</strong> {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                    </p>
                    {order.deliveryMethod === 'pickup' && getUniquePharmacyAddresses(order).length > 0 ? (
                      <div>
                        <strong>Pickup Address:</strong>
                        <div className="mt-2 space-y-2">
                          {getUniquePharmacyAddresses(order).map((pharmacy, index) => (
                            <p key={index} className="text-muted-foreground">
                              {pharmacy.name}: {pharmacy.address}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p>
                        <strong>Delivery Address:</strong> {order.address || 'Not specified'}
                      </p>
                    )}
                    {order.prescription && (
                      <div>
                        <h3 className="text-lg font-semibold text-primary">Prescription Details</h3>
                        <p>
                          <strong>Prescription ID:</strong> {order.prescription.id || 'N/A'}
                        </p>
                        <p>
                          <strong>Status:</strong> {order.prescription.status || 'Pending'}
                        </p>
                        <p>
                          <strong>Verified:</strong> {order.prescription.verified ? 'Yes' : 'No'}
                        </p>
                        <p>
                          <strong>Uploaded:</strong> {order.prescription.createdAt ? new Date(order.prescription.createdAt).toLocaleString() : 'N/A'}
                        </p>
                        {order.prescription.medications?.length > 0 && (
                          <div>
                            <strong>Prescribed Medications:</strong>
                            <div className="mt-2 space-y-2">
                              {order.prescription.medications.map((med, index) => (
                                <p key={index} className="text-muted-foreground">
                                  {med.name} {med.genericName ? `(${med.genericName})` : ''} - Dosage: {med.dosage || 'N/A'}, Quantity: {med.quantity || 'N/A'}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-primary">Order Items</h3>
                    {order.items?.map((item) => (
                      <div key={item.id} className="mb-4">
                        <p className="text-foreground font-medium">
                          {item.medication.name} {item.medication.genericName ? `(${item.medication.genericName})` : ''} {item.medication.prescriptionRequired ? '(Prescription Required)' : ''}
                        </p>
                        {item.medication.dosage && (
                          <p className="text-muted-foreground">Dosage: {item.medication.dosage}</p>
                        )}
                        <p className="text-muted-foreground">Pharmacy: {item.pharmacy.name}</p>
                        <p className="text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-muted-foreground">Unit Price: ₦{item.price.toLocaleString()}</p>
                        <p className="text-muted-foreground">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
                      </div>
                    ))}
                    <p className="text-xl font-semibold text-primary text-right">
                      Total: ₦{order.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
              onClick={handleBackToHome}
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}