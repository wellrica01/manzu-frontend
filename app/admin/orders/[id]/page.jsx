'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OrderDetails() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useParams(); 


  const fetchOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/orders/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
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
    fetchOrder();
  }, [params.id]);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  if (!order) return <div className="text-center p-6">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <Link href="/admin/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>ID:</strong> {order.id}</p>
          <p><strong>Patient Identifier:</strong> {order.patientIdentifier}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total Price:</strong> ₦{order.totalPrice.toFixed(2)}</p>
          <p><strong>Delivery Method:</strong> {order.deliveryMethod || '-'}</p>
          <p><strong>Address:</strong> {order.address || '-'}</p>
          <p><strong>Email:</strong> {order.email || '-'}</p>
          <p><strong>Phone:</strong> {order.phone || '-'}</p>
          <p><strong>Tracking Code:</strong> {order.trackingCode || '-'}</p>
          <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
          <p><strong>Payment Reference:</strong> {order.paymentReference || '-'}</p>
          <p><strong>Filled At:</strong> {order.filledAt ? new Date(order.filledAt).toLocaleDateString() : '-'}</p>
          <p><strong>Cancelled At:</strong> {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString() : '-'}</p>
          <p><strong>Cancel Reason:</strong> {order.cancelReason || '-'}</p>
          <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Updated:</strong> {new Date(order.updatedAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pharmacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Pharmacy ID:</strong> {order.pharmacy.id}</p>
          <p><strong>Name:</strong> {order.pharmacy.name}</p>
        </CardContent>
      </Card>
      {order.prescription && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Prescription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Prescription ID:</strong> {order.prescription.id}</p>
            <p><strong>Patient Identifier:</strong> {order.prescription.patientIdentifier}</p>
            <p><strong>Status:</strong> {order.prescription.status}</p>
            <p><strong>Verified:</strong> {order.prescription.verified ? 'Yes' : 'No'}</p>
            {order.prescription.fileUrl && (
              <div>
                <strong>Prescription File:</strong>
                {order.prescription.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={order.prescription.fileUrl} alt="Prescription" className="h-48 mt-2" />
                ) : (
                  <a href={order.prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    View Prescription File
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Ordered Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={`${item.pharmacyMedication.pharmacy.id}-${item.pharmacyMedication.medication.id}`}>
                  <TableCell>{item.pharmacyMedication.medication.id}</TableCell>
                  <TableCell>{item.pharmacyMedication.medication.name}</TableCell>
                  <TableCell>{item.pharmacyMedication.medication.genericName}</TableCell>
                  <TableCell>{item.pharmacyMedication.pharmacy.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₦{item.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}