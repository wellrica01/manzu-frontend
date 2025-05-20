'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Pharmacies() {
  const [data, setData] = useState({ pharmacies: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const fetchPharmacies = async (pageNum) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/pharmacies?page=${pageNum}&limit=10`, {
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
        throw new Error('Failed to fetch pharmacies');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    fetchPharmacies(page);
  }, [page, authChecked]); // ✅ now safe: always runs, logic gated

  if (!authChecked) {
    return null; // ✅ after hooks, so no violation
  }

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pharmacies</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pharmacy List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>LGA</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pharmacies.map((pharmacy) => (
                <TableRow key={pharmacy.id}>
                  <TableCell>{pharmacy.id}</TableCell>
                  <TableCell>{pharmacy.name}</TableCell>
                  <TableCell>{pharmacy.address}</TableCell>
                  <TableCell>{pharmacy.lga}</TableCell>
                  <TableCell>{pharmacy.state}</TableCell>
                  <TableCell>{pharmacy.phone}</TableCell>
                  <TableCell>{pharmacy.licenseNumber}</TableCell>
                  <TableCell>{pharmacy.status}</TableCell>
                  <TableCell>{pharmacy.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{new Date(pharmacy.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{pharmacy.verifiedAt ? new Date(pharmacy.verifiedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Link href={`/admin/pharmacies/${pharmacy.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {data.pagination.page} of {data.pagination.pages}
            </span>
            <Button
              disabled={page === data.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}