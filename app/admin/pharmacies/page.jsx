'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Building2 } from 'lucide-react';

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
  }, [page, authChecked]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground ml-2">Loading pharmacies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="card bg-destructive/10 border-l-4 border-destructive p-4 fade-in">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">
            Pharmacies
          </h1>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Back to Dashboard
          </Button>
        </div>
        <Card className="card-wrapper card-shadow fade-in">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <Building2 className="h-6 w-6 mr-2" />
              Pharmacy List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">ID</TableHead>
                  <TableHead className="text-primary">Name</TableHead>
                  <TableHead className="text-primary">Address</TableHead>
                  <TableHead className="text-primary">LGA</TableHead>
                  <TableHead className="text-primary">State</TableHead>
                  <TableHead className="text-primary">Phone</TableHead>
                  <TableHead className="text-primary">License</TableHead>
                  <TableHead className="text-primary">Status</TableHead>
                  <TableHead className="text-primary">Active</TableHead>
                  <TableHead className="text-primary">Created</TableHead>
                  <TableHead className="text-primary">Verified</TableHead>
                  <TableHead className="text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pharmacies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-muted-foreground text-center">
                      No pharmacies found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.pharmacies.map((pharmacy, index) => (
                    <TableRow key={pharmacy.id} className="fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                      <TableCell>{pharmacy.id}</TableCell>
                      <TableCell>{pharmacy.name}</TableCell>
                      <TableCell>{pharmacy.address}</TableCell>
                      <TableCell>{pharmacy.lga}</TableCell>
                      <TableCell>{pharmacy.state}</TableCell>
                      <TableCell>{pharmacy.phone}</TableCell>
                      <TableCell>{pharmacy.licenseNumber}</TableCell>
                      <TableCell>{pharmacy.status.toUpperCase()}</TableCell>
                      <TableCell>{pharmacy.isActive ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{new Date(pharmacy.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{pharmacy.verifiedAt ? new Date(pharmacy.verifiedAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Link href={`/admin/pharmacies/${pharmacy.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-primary hover:bg-muted"
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <Button
                disabled={page === data.pagination.pages}
                onClick={() => setPage(page + 1)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}