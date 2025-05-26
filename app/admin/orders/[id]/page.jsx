'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetails() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/orders/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch order');
      }
      const result = await response.json();
      setOrder(result.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      fetchOrder();
    }
  }, [params.id, authChecked]);

  if (!authChecked) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="card bg-destructive/10 border-l-4 border-destructive p-4 max-w-md mx-auto">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6 fade-in">
        <div className="card bg-muted/10 p-4 max-w-md mx-auto">
          <p className="text-muted-foreground text-center">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">Order #{order.id}</h1>
          <Link href="/admin/orders">
            <Button variant="outline" className="text-primary hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <Card className="card card-hover fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <p className="text-foreground"><strong>ID:</strong> {order.id}</p>
            <p className="text-foreground"><strong>Patient Identifier:</strong> {order.patientIdentifier || '-'}</p>
            <p className="text-foreground"><strong>Status:</strong> {order.status}</p>
            <p className="text-foreground"><strong>Total Price:</strong> ₦{order.totalPrice.toLocaleString()}</p>
            <p className="text-foreground"><strong>Delivery Method:</strong> {order.deliveryMethod || '-'}</p>
            <p className="text-foreground"><strong>Address:</strong> {order.address || '-'}</p>
            <p className="text-foreground"><strong>Email:</strong> {order.email || '-'}</p>
            <p className="text-foreground"><strong>Phone:</strong> {order.phone || '-'}</p>
            <p className="text-foreground"><strong>Tracking Code:</strong> {order.trackingCode || '-'}</p>
            <p className="text-foreground"><strong>Payment Status:</strong> {order.paymentStatus || '-'}</p>
            <p className="text-foreground"><strong>Payment Reference:</strong> {order.paymentReference || '-'}</p>
            <p className="text-foreground"><strong>Filled At:</strong> {order.filledAt ? new Date(order.filledAt).toLocaleDateString() : '-'}</p>
            <p className="text-foreground"><strong>Cancelled At:</strong> {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString() : '-'}</p>
            <p className="text-foreground"><strong>Cancel Reason:</strong> {order.cancelReason || '-'}</p>
            <p className="text-foreground"><strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            <p className="text-foreground"><strong>Updated:</strong> {new Date(order.updatedAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card className="card card-hover fade-in mt-6">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary">Pharmacy</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <p className="text-foreground"><strong>Pharmacy ID:</strong> {order.pharmacy?.id ?? 'Not available'}</p>
            <p className="text-foreground"><strong>Name:</strong> {order.pharmacy?.name ?? 'Not available'}</p>
          </CardContent>
        </Card>
        {order.prescription && (
          <Card className="card card-hover fade-in mt-6">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-semibold text-primary">Associated Prescription</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <p className="text-foreground"><strong>Prescription ID:</strong> {order.prescription.id}</p>
              <p className="text-foreground"><strong>Patient Identifier:</strong> {order.prescription.patientIdentifier}</p>
              <p className="text-foreground"><strong>Status:</strong> {order.prescription.status}</p>
              <p className="text-foreground"><strong>Verified:</strong> {order.prescription.verified ? 'Yes' : 'No'}</p>
              {order.prescription.fileUrl && (
                <div>
                  <strong className="text-foreground">Prescription File:</strong>
                  {order.prescription.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img src={order.prescription.fileUrl} alt="Prescription" className="h-48 mt-2 rounded-lg" />
                  ) : (
                    <a
                      href={order.prescription.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-secondary flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Prescription File
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <Card className="card card-hover fade-in mt-6">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary">Ordered Items</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-primary/5">
                    <TableHead>Medication ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>Pharmacy</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow
                      key={`${item.pharmacyMedication.pharmacy.id}-${item.pharmacyMedication.medication.id}`}
                      className="fade-in"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <TableCell>{item.pharmacyMedication.medication.id}</TableCell>
                      <TableCell>{item.pharmacyMedication.medication.name}</TableCell>
                      <TableCell>{item.pharmacyMedication.medication.genericName}</TableCell>
                      <TableCell>{item.pharmacyMedication.pharmacy.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₦{item.price.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}