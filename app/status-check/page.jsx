'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function StatusCheck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ identifier: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [patientIdentifier, setPatientIdentifier] = useState(null);

  useEffect(() => {
    const id = searchParams.get('patientIdentifier');
    const orderId = searchParams.get('orderId');
    if (id) {
      setPatientIdentifier(id);
      fetchStatus(id, orderId);
    } else {
      setShowDialog(true);
    }
  }, [searchParams]);

  const handleInputChange = (e) => setForm({ ...form, identifier: e.target.value });

  const fetchStatus = async (patientId, orderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescription/guest-order/${patientId}`, {
        headers: { 'x-guest-id': patientId },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch status');
      }
      const data = await response.json();
      const { prescriptionMetadata, orderId: fetchedOrderId, orderStatus, medications } = data;

      if (prescriptionMetadata.status === 'pending' || prescriptionMetadata.status === 'pending_admin' || prescriptionMetadata.status === 'pending_action') {
        setPrescription({ ...prescriptionMetadata, order: fetchedOrderId ? { id: fetchedOrderId } : null });
        toast.info('Your prescription is under review. You’ll be notified when it’s ready.', { duration: 4000 });
        return;
      }

      if (fetchedOrderId) {
        const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/resume/${fetchedOrderId}`, {
          headers: { 'x-guest-id': patientId },
        });
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.message || 'Failed to fetch order details');
        }
        const orderData = await orderResponse.json();
        const { checkoutSessionId, trackingCode } = orderData;

        switch (orderStatus) {
          case 'pending':
            if (orderId && orderId == fetchedOrderId) {
              router.push(`/order/${orderId}`);
            } else {
              router.push(`/order/${fetchedOrderId}`);
            }
            break;
          case 'pending_prescription':
            setPrescription({ ...prescriptionMetadata, order: { id: fetchedOrderId } });
            toast.info('Your prescription is under review for this order. You’ll be notified when it’s ready.', { duration: 4000 });
            break;
          case 'confirmed':
          case 'processing':
          case 'shipped':
          case 'delivered':
          case 'ready_for_pickup':
            setPrescription({
              ...prescriptionMetadata,
              order: { id: fetchedOrderId, trackingCode, checkoutSessionId },
              status: orderStatus,
            });
            toast.success(`Order ${orderStatus}. Track your order with code: ${trackingCode}`, {
              duration: 6000,
              action: {
                label: 'Track Now',
                onClick: () => router.push(`/track?trackingCode=${encodeURIComponent(trackingCode)}`),
              },
            });
            break;
          case 'cancelled':
            setPrescription({ ...prescriptionMetadata, order: { id: fetchedOrderId }, status: 'cancelled' });
            toast.error('Your order has been cancelled. Please contact support or start a new order.', { duration: 4000 });
            break;
          default:
            throw new Error(`Unknown order status: ${orderStatus}`);
        }
      } else if (prescriptionMetadata.status === 'verified') {
        if (medications.some(med => med.availability?.length && med.availability[0].price > 0)) {
          router.push(`/guest-order/${patientId}`);
        } else {
          setPrescription({ ...prescriptionMetadata });
          toast.info('No medications available for this prescription. Please upload a new prescription or contact support.', { duration: 4000 });
        }
      } else {
        throw new Error('Invalid prescription status');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
      setPrescription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/session/retrieve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': localStorage.getItem('guestId') || '',
        },
        body: JSON.stringify({
          email: form.identifier.includes('@') ? form.identifier : undefined,
          phone: !form.identifier.includes('@') ? form.identifier : undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to retrieve session');
      }
      const { guestId } = await response.json();
      localStorage.setItem('guestId', guestId);
      setPatientIdentifier(guestId);
      setShowDialog(false);
      await fetchStatus(guestId);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/95 to-gray-100/95 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in-20 duration-500">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-8 text-center tracking-tight animate-in slide-in-from-top-10 duration-700">
          Check Prescription Status
        </h1>
        {error && (
          <Card className="bg-red-50/95 border border-red-100/50 rounded-2xl shadow-md mb-6 p-4 animate-in slide-in-from-top-10 duration-500" role="alert">
            <p className="text-red-600 text-base font-medium">{error}</p>
          </Card>
        )}
        {prescription && (
          <Card className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md p-6">
            <h2 className="text-2xl font-extrabold text-primary mb-4">Your Prescription</h2>
            <div className="p-4 border-b border-gray-100/50">
              <p className="text-base font-semibold">Prescription #{prescription.id} | Uploaded: {new Date(prescription.uploadedAt).toLocaleDateString()}</p>
              <p className="text-base text-gray-600">
                Status: {prescription.status === 'pending' || prescription.status === 'pending_admin' || prescription.status === 'pending_action' ? 'Under Review' : 
                         prescription.status === 'verified' ? 'Verified' : 
                         prescription.status === 'cancelled' ? 'Cancelled' : 
                         prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
              </p>
              {prescription.order && prescription.status === 'verified' && prescription.order.status === 'pending' && (
                <Button
                  asChild
                  className="mt-2 h-10 px-4 rounded-full bg-primary text-white hover:bg-primary/90"
                >
                  <Link href={`/order/${prescription.order.id}`}>View Order</Link>
                </Button>
              )}
              {prescription.status === 'cancelled' && (
                <div className="mt-4 flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">This order was cancelled. Contact <Link href="/support" className="text-blue-600 underline">support</Link> for assistance.</p>
                </div>
              )}
              {prescription.order && (prescription.status === 'pending' || prescription.status === 'pending_admin' || prescription.status === 'pending_action') && (
                <div className="mt-4 flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-base font-medium">Your order is waiting for prescription verification.</p>
                </div>
              )}
              {prescription.order?.trackingCode && ['confirmed', 'processing', 'shipped', 'delivered', 'ready_for_pickup'].includes(prescription.status) && (
                <div className="mt-4 flex items-center gap-2 text-blue-600">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-base font-medium">
                    Order {prescription.status}. Track your order with code: <span className="font-semibold">{prescription.order.trackingCode}</span>.{' '}
                    <Link href={`/track?trackingCode=${encodeURIComponent(prescription.order.trackingCode)}`} className="text-blue-600 underline">Track Now</Link>
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 text-right">
              <Button
                asChild
                variant="outline"
                className="h-10 px-4 rounded-full border-primary text-primary hover:bg-primary/10"
              >
                <Link href="/prescriptions">View All Prescriptions</Link>
              </Button>
            </div>
          </Card>
        )}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md p-8 border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4 animate-[pulse_1s_ease-in-out_infinite]" aria-hidden="true" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold text-primary text-center tracking-tight">
                Check Status
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier" className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Email or Phone
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  value={form.identifier}
                  onChange={handleInputChange}
                  className="mt-2 h-12 text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  placeholder="Enter email or phone number"
                  required
                  aria-required="true"
                />
              </div>
              <DialogFooter className="flex justify-center">
                <Button
                  type="submit"
                  className="h-12 px-6 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"
                  disabled={loading}
                  aria-label="Check status"
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                  Check Status
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}