'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default function PrescriptionDetails() {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(null); // 'verified' | 'rejected' | null
  const router = useRouter();
  const params = useParams(); 

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/prescriptions/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch prescription');
      }
      const result = await response.json();
      setPrescription(result.prescription);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, {
        description: 'Failed to load prescription details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status) => {
    setSubmitting(status);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/prescription/${params.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response || !response.ok) {
        const text = await response.text();
        console.error('Verify response:', text);
        throw new Error(`Failed to update prescription: ${response.status} ${response.statusText}`);
      }
      await fetchPrescription();
      toast.success(`Prescription ${status}`, {
        description: `Prescription #${params.id} has been ${status} successfully.`,
      });
    } catch (err) {
    toast.error('Error', {
      description: err.message || 'An unexpected error occurred.',
    });

    } finally {
      setSubmitting(null);
    }
  };

useEffect(() => {
  if (params.id) {
    fetchPrescription();
  } else {
    setError("Prescription ID is missing");
  }
}, [params.id]);


  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  if (!prescription) return <div className="text-center p-6">Prescription not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prescription #{prescription.id}</h1>
        <div className="space-x-2">
          {prescription.status === 'pending' && (
            <>
            <Button
                onClick={() => handleVerify('verified')}
                disabled={submitting !== null}
              >
                {submitting === 'verified' ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVerify('rejected')}
                disabled={submitting !== null}
              >
                {submitting === 'rejected' ? 'Rejecting...' : 'Reject'}
              </Button>
            </>
          )}
          <Link href="/admin/prescriptions">
            <Button variant="outline">Back to Prescriptions</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Prescription Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>ID:</strong> {prescription.id}</p>
          <p><strong>Patient Identifier:</strong> {prescription.patientIdentifier}</p>
          <p><strong>Status:</strong> {prescription.status}</p>
          <p><strong>Verified:</strong> {prescription.verified ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> {new Date(prescription.createdAt).toLocaleDateString()}</p>
          {prescription.fileUrl && (
            <div>
              <strong>Prescription File:</strong>
              {prescription.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={prescription.fileUrl} alt="Prescription" className="h-48 mt-2" />
              ) : (
                <a href={prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  View Prescription File
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Related Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {prescription.orders && Array.isArray(prescription.orders) && prescription.orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescription.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.pharmacy?.name || 'N/A'}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>
                      $
                      {order.items
                        .reduce((total, item) => total + item.quantity * item.pharmacyMedication.price, 0)
                        .toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No orders associated with this prescription.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}